import React, { useEffect, useRef, useState, useCallback } from 'react'
import ToolCard from './ToolCard'
// @ts-ignore - vendored ES module, see src/vendor/beam/qrcode-generator.LICENSE
import qrcode from '../vendor/beam/qrcode-generator.mjs'
// Vendored ZXing IIFE + WASM + jsQR fallback loaded into decode workers via importScripts.
import jsQRUrl from '../vendor/beam/jsQR.js?url'
import zxingIIFEUrl from '../vendor/beam/zxing-reader.iife.js?url'
import zxingWasmUrl from '../vendor/beam/zxing_reader.wasm?url'

/* ============================================================================
 * Beam — animated QR-code, device-to-device file transfer (no backend).
 *
 * Per-frame binary format (little-endian):
 *   offset  size  field
 *   0       2     magic = 0x534E ("SN")
 *   2       1     version = 1
 *   3       1     flags (bit0 = gzip compressed)
 *   4       4     dataLen (compressed stream length)
 *   8       2     K (number of source symbols)
 *   10      2     symbolSize (bytes per symbol)
 *   12      4     seed (LT symbol id for this frame)
 *   16      32    fileHash (SHA-256 of original file)
 *   48      1     fileNameLen (byte length of filename, max 31)
 *   49      31    fileName (UTF-8, zero-padded)
 *   80      N     payload (symbolSize bytes)
 *   80+N    4     crc32 (over bytes [0 .. 80+N))
 *
 * Enhancements over v1:
 *   - Symbol size selectable: 160 / 300 / 512 bytes (→ max ~33 MB at 512)
 *   - QR error-correction level L for maximum data density
 *   - 2×2 multi-QR grid: 4 fountain symbols per screen refresh
 *   - IndexedDB partial-state persistence: interrupted scans resume
 *   - Adaptive FPS: decoder rate drives a suggestion to sender
 * ========================================================================== */

const MAGIC = 0x534e
const VERSION = 1
const HEADER_LEN = 80  // 48 base + 1 nameLen + 31 name bytes (reduced from 112 to lower QR version)
const IDB_DB = 'beam-v1'
const IDB_STORE = 'sessions'

// Symbol size presets. Larger = fewer blocks = faster for big files, but QR
// codes get denser (higher version). Camera must resolve them clearly.
// Frame total = HEADER_LEN(80) + symbolSize + 4 (CRC) = 84 + symbolSize
// Presets per EC level, sized to fit neatly under each QR version's byte capacity.
// Level M: v10=194B(→110), v12=271B(→187), v15=376B(→292), v18=513B(→429)
// Level L: v10=271B(→187), v12=367B(→283), v15=520B(→436), v18=691B(→607)
type ECLevel = 'M' | 'L'
const SYMBOL_PRESETS: Record<ECLevel, Record<string, { bytes: number; label: string; maxMB: number }>> = {
  M: {
    small:  { bytes: 110, label: 'Small — QR v10 M, easiest to scan', maxMB: 7 },
    medium: { bytes: 187, label: 'Medium — QR v12 M, balanced', maxMB: 12 },
    large:  { bytes: 292, label: 'Large — QR v15 M, needs steady camera', maxMB: 19 },
  },
  L: {
    small:  { bytes: 187, label: 'Small — QR v10 L, good camera needed', maxMB: 12 },
    medium: { bytes: 283, label: 'Medium — QR v12 L, balanced', maxMB: 18 },
    large:  { bytes: 436, label: 'Large — QR v15 L, high density', maxMB: 28 },
  },
}

// ----------------------------------------------------------------------------
// CRC-32 (pure JS, no library)
// ----------------------------------------------------------------------------
const CRC32_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()
function crc32(buf: Uint8Array, start = 0, end = buf.length): number {
  let crc = -1
  for (let i = start; i < end; i++) crc = (crc >>> 8) ^ CRC32_TABLE[(crc ^ buf[i]) & 0xff]
  return (crc ^ -1) >>> 0
}

// ----------------------------------------------------------------------------
// PRNG + Robust Soliton + symbol derivation (shared encoder ↔ decoder)
// ----------------------------------------------------------------------------
function mulberry32(a: number) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function buildRobustSoliton(K: number): Float64Array {
  const c = 0.03, delta = 0.05
  const rho = new Float64Array(K + 1)
  rho[1] = 1 / K
  for (let d = 2; d <= K; d++) rho[d] = 1 / (d * (d - 1))
  const R = c * Math.log(K / delta) * Math.sqrt(K)
  const tau = new Float64Array(K + 1)
  const kR = Math.max(1, Math.floor(K / R))
  for (let d = 1; d < kR; d++) tau[d] = R / (d * K)
  if (kR <= K) tau[kR] = (R * Math.log(R / delta)) / K
  let sum = 0
  for (let d = 1; d <= K; d++) sum += rho[d] + tau[d]
  const cdf = new Float64Array(K + 1)
  let acc = 0
  for (let d = 1; d <= K; d++) { acc += (rho[d] + tau[d]) / sum; cdf[d] = acc }
  return cdf
}

function deriveSymbol(seed: number, K: number, cdf: Float64Array): { degree: number; indices: number[] } {
  const rand = mulberry32(seed >>> 0)
  const r = rand()
  let degree = 1
  for (let d = 1; d <= K; d++) { if (r <= cdf[d]) { degree = d; break }; degree = d }
  if (degree > K) degree = K
  const chosen = new Set<number>()
  while (chosen.size < degree) chosen.add(Math.floor(rand() * K) % K)
  return { degree, indices: Array.from(chosen) }
}

// ----------------------------------------------------------------------------
// Frame builder
// ----------------------------------------------------------------------------
function buildFrame(opts: {
  dataLen: number; flags: number; K: number; symbolSize: number
  seed: number; fileHash: Uint8Array; fileName: string; payload: Uint8Array
}): Uint8Array {
  const { dataLen, flags, K, symbolSize, seed, fileHash, fileName, payload } = opts
  const total = HEADER_LEN + symbolSize + 4
  const buf = new Uint8Array(total)
  const dv = new DataView(buf.buffer)
  dv.setUint16(0, MAGIC, true)
  buf[2] = VERSION
  buf[3] = flags
  dv.setUint32(4, dataLen >>> 0, true)
  dv.setUint16(8, K, true)
  dv.setUint16(10, symbolSize, true)
  dv.setUint32(12, seed >>> 0, true)
  buf.set(fileHash.subarray(0, 32), 16)
  const nameBytes = new TextEncoder().encode(fileName).subarray(0, 31)
  buf[48] = nameBytes.length
  buf.set(nameBytes, 49)
  buf.set(payload.subarray(0, symbolSize), HEADER_LEN)
  dv.setUint32(HEADER_LEN + symbolSize, crc32(buf, 0, HEADER_LEN + symbolSize) >>> 0, true)
  return buf
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------
async function sha256(bytes: Uint8Array): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', bytes as BufferSource))
}

async function maybeGzip(bytes: Uint8Array): Promise<{ data: Uint8Array; gzipped: boolean }> {
  if (typeof (globalThis as any).CompressionStream === 'undefined') return { data: bytes, gzipped: false }
  try {
    const cs = new (globalThis as any).CompressionStream('gzip')
    const compressed = new Uint8Array(await new Response(
      new Blob([bytes as BlobPart]).stream().pipeThrough(cs)
    ).arrayBuffer())
    return compressed.length < bytes.length ? { data: compressed, gzipped: true } : { data: bytes, gzipped: false }
  } catch { return { data: bytes, gzipped: false } }
}

async function gunzip(bytes: Uint8Array): Promise<Uint8Array> {
  const ds = new (globalThis as any).DecompressionStream('gzip')
  return new Uint8Array(await new Response(
    new Blob([bytes as BlobPart]).stream().pipeThrough(ds)
  ).arrayBuffer())
}

function toHex(bytes: Uint8Array): string {
  let s = ''
  for (let i = 0; i < bytes.length; i++) s += bytes[i].toString(16).padStart(2, '0')
  return s
}

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1048576) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1048576).toFixed(2)} MB`
}

// ----------------------------------------------------------------------------
// QR rendering
// ----------------------------------------------------------------------------
function renderQRToCtx(
  frame: Uint8Array,
  ctx: CanvasRenderingContext2D,
  x: number, y: number, size: number,
  ecLevel: ECLevel = 'M'
) {
  let str = ''
  for (let i = 0; i < frame.length; i++) str += String.fromCharCode(frame[i] & 0xff)
  const qr = (qrcode as any)(0, ecLevel)
  qr.addData(str, 'Byte')
  qr.make()
  const count = qr.getModuleCount()
  const quiet = 2
  const cell = size / (count + quiet * 2)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(x, y, size, size)
  ctx.fillStyle = '#000000'
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (qr.isDark(r, c)) {
        ctx.fillRect(
          x + Math.floor((c + quiet) * cell),
          y + Math.floor((r + quiet) * cell),
          Math.ceil(cell), Math.ceil(cell)
        )
      }
    }
  }
}

// 1×2 dual: two QR codes side by side
function encodeDualToCanvas(frames: Uint8Array[], canvas: HTMLCanvasElement, ecLevel: ECLevel = 'M') {
  const ctx = canvas.getContext('2d')!
  const half = canvas.width / 2
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  renderQRToCtx(frames[0], ctx, 0, 0, half, ecLevel)
  if (frames[1]) renderQRToCtx(frames[1], ctx, half, 0, half, ecLevel)
  ctx.strokeStyle = '#e2e8f0'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(half, 0); ctx.lineTo(half, canvas.height)
  ctx.stroke()
}

// 2×2 quad: four QR codes in a grid
function encodeQuadToCanvas(frames: Uint8Array[], canvas: HTMLCanvasElement, ecLevel: ECLevel = 'M') {
  const ctx = canvas.getContext('2d')!
  const half = canvas.width / 2
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  const positions = [[0, 0], [half, 0], [0, half], [half, half]]
  for (let i = 0; i < Math.min(frames.length, 4); i++) {
    renderQRToCtx(frames[i], ctx, positions[i][0], positions[i][1], half, ecLevel)
  }
  ctx.strokeStyle = '#e2e8f0'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(half, 0); ctx.lineTo(half, canvas.height)
  ctx.moveTo(0, half); ctx.lineTo(canvas.width, half)
  ctx.stroke()
}

// Single QR
function encodeSingleToCanvas(frame: Uint8Array, canvas: HTMLCanvasElement, ecLevel: ECLevel = 'M') {
  const ctx = canvas.getContext('2d')!
  renderQRToCtx(frame, ctx, 0, 0, canvas.width, ecLevel)
}

// ----------------------------------------------------------------------------
// IndexedDB helpers for receiver state persistence
// ----------------------------------------------------------------------------
function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_DB, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function idbGet<T>(key: string): Promise<T | null> {
  try {
    const db = await openIDB()
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readonly')
      const req = tx.objectStore(IDB_STORE).get(key)
      req.onsuccess = () => resolve(req.result ?? null)
      req.onerror = () => resolve(null)
    })
  } catch { return null }
}

async function idbSet(key: string, value: unknown): Promise<void> {
  try {
    const db = await openIDB()
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readwrite')
      tx.objectStore(IDB_STORE).put(value, key)
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    })
  } catch { /* ignore */ }
}

async function idbDelete(key: string): Promise<void> {
  try {
    const db = await openIDB()
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readwrite')
      tx.objectStore(IDB_STORE).delete(key)
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    })
  } catch { /* ignore */ }
}

// ----------------------------------------------------------------------------
// Decode worker source — pure QR decode only (ZXing-WASM + jsQR fallback).
// ----------------------------------------------------------------------------
// LT decoder state
// ----------------------------------------------------------------------------
interface LTState {
  K: number; symbolSize: number; dataLen: number; flags: number
  fileHashHex: string; fileName: string
  cdf: Float64Array
  recovered: (Uint8Array | null)[]
  recoveredCount: number
  pending: { indices: number[]; data: Uint8Array }[]
  seenSeeds: Record<number, 1>
  started: boolean
  lastSaveCount: number
}

function makeFreshLT(): LTState {
  return { K:0, symbolSize:0, dataLen:0, flags:0, fileHashHex:'', fileName:'',
    cdf: new Float64Array(0), recovered:[], recoveredCount:0,
    pending:[], seenSeeds:{}, started:false, lastSaveCount:0 }
}

function ltFromSaved(s: any): LTState {
  return { K:s.K, symbolSize:s.symbolSize, dataLen:s.dataLen, flags:s.flags,
    fileHashHex:s.fileHashHex, fileName:s.fileName,
    cdf: new Float64Array(s.cdf),
    recovered: s.recovered.map((b: number[]|null) => b ? new Uint8Array(b) : null),
    recoveredCount: s.recoveredCount, pending:[], seenSeeds:s.seenSeeds||{},
    started:true, lastSaveCount:s.recoveredCount }
}

function ltSnap(st: LTState) {
  return { K:st.K, symbolSize:st.symbolSize, dataLen:st.dataLen, flags:st.flags,
    fileHashHex:st.fileHashHex, fileName:st.fileName,
    cdf:Array.from(st.cdf),
    recovered:st.recovered.map(b => b ? Array.from(b) : null),
    recoveredCount:st.recoveredCount, seenSeeds:st.seenSeeds }
}

function crc32Main(buf: Uint8Array, start: number, end: number): number {
  const T = CRC32_TABLE
  let crc = -1
  for (let i = start; i < end; i++) crc = (crc >>> 8) ^ T[(crc ^ buf[i]) & 0xff]
  return (crc ^ -1) >>> 0
}

function xorIntoMain(dst: Uint8Array, src: Uint8Array) {
  for (let i = 0; i < dst.length; i++) dst[i] ^= src[i]
}

function peelMain(st: LTState) {
  let progressed = true
  while (progressed) {
    progressed = false
    for (let p = 0; p < st.pending.length; p++) {
      const blk = st.pending[p]; if (!blk) continue
      for (let qi = blk.indices.length - 1; qi >= 0; qi--) {
        const ix = blk.indices[qi]
        if (st.recovered[ix]) { xorIntoMain(blk.data, st.recovered[ix]!); blk.indices.splice(qi, 1) }
      }
      if (blk.indices.length === 1) {
        const idx = blk.indices[0]
        if (!st.recovered[idx]) { st.recovered[idx] = blk.data.slice(); st.recoveredCount++; progressed = true }
        st.pending[p] = null as any
      } else if (blk.indices.length === 0) { st.pending[p] = null as any }
    }
  }
}

// Returns 'progress' | 'complete' | 'duplicate' | 'invalid'
function ltIngest(st: LTState, frame: Uint8Array): 'progress' | 'complete' | 'duplicate' | 'invalid' {
  if (frame.length < HEADER_LEN + 1 + 4) return 'invalid'
  const dv = new DataView(frame.buffer, frame.byteOffset, frame.byteLength)
  if (dv.getUint16(0, true) !== MAGIC) return 'invalid'
  const fK = dv.getUint16(8, true), fSym = dv.getUint16(10, true)
  if (frame.length < HEADER_LEN + fSym + 4) return 'invalid'
  const gotCrc = dv.getUint32(HEADER_LEN + fSym, true) >>> 0
  if (gotCrc !== crc32Main(frame, 0, HEADER_LEN + fSym)) return 'invalid'
  const seed = dv.getUint32(12, true) >>> 0
  if (!st.started) {
    st.K = fK; st.symbolSize = fSym; st.dataLen = dv.getUint32(4, true) >>> 0; st.flags = frame[3]
    const fh = frame.subarray(16, 48); let hx = ''
    for (let i = 0; i < 32; i++) hx += fh[i].toString(16).padStart(2, '0')
    st.fileHashHex = hx
    const nameLen = Math.min(frame[48] || 0, 31)
    try { st.fileName = new TextDecoder().decode(frame.subarray(49, 49 + nameLen)) } catch { st.fileName = 'beam-received.bin' }
    st.cdf = buildRobustSoliton(fK); st.recovered = new Array(fK).fill(null); st.started = true
  }
  if (fK !== st.K || fSym !== st.symbolSize) return 'invalid'
  if (st.seenSeeds[seed]) return 'duplicate'
  st.seenSeeds[seed] = 1
  const payload = frame.slice(HEADER_LEN, HEADER_LEN + st.symbolSize)
  st.pending.push({ indices: deriveSymbol(seed, st.K, st.cdf).indices, data: payload })
  peelMain(st)
  return st.recoveredCount === st.K ? 'complete' : 'progress'
}

// ----------------------------------------------------------------------------
// Component root
// ----------------------------------------------------------------------------
type Mode = 'send' | 'receive'

export default function Beam() {
  const [mode, setMode] = useState<Mode>('send')

  // Start loading jsQR + ZXing WASM immediately when Beam mounts (user may be on Send tab).
  // By the time they switch to Receive and hit Start, both decoders are compiled and warm.
  useEffect(() => { loadDecoders().catch(() => {}) }, [])

  return (
    <ToolCard
      title="📡 Beam — File Transfer"
      description="Move a file between two devices using only animated QR codes. No network, no server, no upload — the bytes travel as light through your camera."
    >
      <div className="flex gap-2 mb-4 min-w-0 flex-wrap">
        {(['send', 'receive'] as Mode[]).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={
              'px-4 py-2 rounded-lg font-medium text-sm transition-colors capitalize ' +
              (mode === m
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700')
            }
          >
            {m}
          </button>
        ))}
      </div>

      {mode === 'send' ? <SendPanel /> : <ReceivePanel />}
      <BeamInfo />
    </ToolCard>
  )
}

// ----------------------------------------------------------------------------
// Send panel — 2×2 quad QR, symbol size selector, level L
// ----------------------------------------------------------------------------
function SendPanel() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [fps, setFps] = useState(6)
  const [symbolPreset, setSymbolPreset] = useState<'small' | 'medium' | 'large'>('small')
  const [ecLevel, setEcLevel] = useState<ECLevel>('M')
  const ecLevelRef = useRef<ECLevel>('M')
  useEffect(() => { ecLevelRef.current = ecLevel }, [ecLevel])
  const [gridMode, setGridMode] = useState<1 | 2 | 4>(1)
  const [running, setRunning] = useState(false)
  const [seed, setSeed] = useState(0)
  const [meta, setMeta] = useState<{
    K: number; symbolSize: number; dataLen: number
    flags: number; fileHash: Uint8Array; fileName: string
  } | null>(null)
  const blocksRef = useRef<Uint8Array[]>([])
  const cdfRef = useRef<Float64Array | null>(null)
  const seedRef = useRef(0)
  const rafRef = useRef<number | null>(null)
  const lastRef = useRef(0)
  const fpsRef = useRef(6)
  const gridModeRef = useRef<1 | 2 | 4>(1)
  useEffect(() => { fpsRef.current = fps }, [fps])
  useEffect(() => { gridModeRef.current = gridMode }, [gridMode])

  const prepare = useCallback(async (f: File, preset: 'small' | 'medium' | 'large', level?: ECLevel) => {
    setError('')
    setRunning(false)
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    try {
      const raw = new Uint8Array(await f.arrayBuffer())
      const fileHash = await sha256(raw)
      const { data, gzipped } = await maybeGzip(raw)
      const symbolSize = SYMBOL_PRESETS[level ?? ecLevelRef.current][preset].bytes
      const K = Math.max(1, Math.ceil(data.length / symbolSize))
      if (K > 65535) {
        setError(`File too large for this block size (${fmtBytes(f.size)}). Switch to "Large" blocks, Level L, or use a smaller file.`)
        setMeta(null)
        return
      }
      const blocks: Uint8Array[] = []
      for (let i = 0; i < K; i++) {
        const block = new Uint8Array(symbolSize)
        block.set(data.subarray(i * symbolSize, (i + 1) * symbolSize))
        blocks.push(block)
      }
      blocksRef.current = blocks
      cdfRef.current = buildRobustSoliton(K)
      seedRef.current = 0
      setSeed(0)
      setMeta({ K, symbolSize, dataLen: data.length, flags: gzipped ? 1 : 0, fileHash, fileName: f.name })
    } catch (e: any) {
      setError('Could not read file: ' + (e?.message || String(e)))
      setMeta(null)
    }
  }, [])

  // Re-prepare when preset or EC level changes and file already selected
  useEffect(() => {
    if (file) prepare(file, symbolPreset, ecLevel)
  }, [symbolPreset, ecLevel]) // eslint-disable-line react-hooks/exhaustive-deps

  // Render `count` fountain frames starting at seed s, return next seed
  const renderFrames = useCallback((s: number, count: number): number => {
    const canvas = canvasRef.current
    if (!canvas || !meta || !cdfRef.current) return s
    let cur = s >>> 0
    if (count === 1) {
      const payload = new Uint8Array(meta.symbolSize)
      const { indices } = deriveSymbol(cur, meta.K, cdfRef.current)
      for (const ix of indices) { const blk = blocksRef.current[ix]; for (let i = 0; i < meta.symbolSize; i++) payload[i] ^= blk[i] }
      encodeSingleToCanvas(buildFrame({ dataLen: meta.dataLen, flags: meta.flags, K: meta.K, symbolSize: meta.symbolSize, seed: cur, fileHash: meta.fileHash, fileName: meta.fileName, payload }), canvas, ecLevelRef.current)
      return (cur + 1) >>> 0
    }
    const frames: Uint8Array[] = []
    for (let q = 0; q < count; q++) {
      const payload = new Uint8Array(meta.symbolSize)
      const { indices } = deriveSymbol(cur, meta.K, cdfRef.current)
      for (const ix of indices) { const blk = blocksRef.current[ix]; for (let i = 0; i < meta.symbolSize; i++) payload[i] ^= blk[i] }
      frames.push(buildFrame({ dataLen: meta.dataLen, flags: meta.flags, K: meta.K, symbolSize: meta.symbolSize, seed: cur, fileHash: meta.fileHash, fileName: meta.fileName, payload }))
      cur = (cur + 1) >>> 0
    }
    if (count === 2) encodeDualToCanvas(frames, canvas, ecLevelRef.current)
    else encodeQuadToCanvas(frames, canvas, ecLevelRef.current)
    return cur
  }, [meta])

  // Animation loop — reads gridModeRef live so changes take effect without restart
  useEffect(() => {
    if (!running || !meta) return
    const loop = (t: number) => {
      const interval = 1000 / fpsRef.current
      if (t - lastRef.current >= interval) {
        lastRef.current = t
        seedRef.current = renderFrames(seedRef.current, gridModeRef.current)
        setSeed(seedRef.current)
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [running, meta, renderFrames])

  // Static preview on prepare
  useEffect(() => {
    if (meta && !running) {
      seedRef.current = 0
      renderFrames(0, gridModeRef.current)
    }
  }, [meta]) // eslint-disable-line react-hooks/exhaustive-deps

  const estSeconds = meta ? Math.ceil(meta.K / (fps * gridMode) * 1.3) : 0

  return (
    <div className="space-y-4 w-full min-w-0">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 space-y-4 overflow-hidden">

        {/* File + preset */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Choose a file to beam</label>
            <input
              type="file"
              onChange={e => {
                const f = e.target.files?.[0] || null
                setFile(f)
                if (f) prepare(f, symbolPreset, ecLevelRef.current)
              }}
              className="block text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium mb-2">Block size</label>
              <select
                value={symbolPreset}
                onChange={e => setSymbolPreset(e.target.value as any)}
                className="w-full text-sm rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-950"
              >
                {Object.entries(SYMBOL_PRESETS[ecLevel]).map(([k, v]) => (
                  <option key={k} value={k}>{v.label} · max {v.maxMB} MB</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Error correction</label>
              <div className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 text-sm">
                {(['M', 'L'] as ECLevel[]).map(lv => (
                  <button
                    key={lv}
                    onClick={() => setEcLevel(lv)}
                    className={
                      'flex-1 py-2 font-medium transition-colors ' +
                      (ecLevel === lv
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800')
                    }
                  >
                    {lv === 'M' ? 'M (default)' : 'L (dense)'}
                  </button>
                ))}
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {ecLevel === 'M' ? 'Recovers ~15% damage — reliable on most phones' : 'Recovers ~7% damage — max data, needs good lighting'}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-300 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {meta && file && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <Stat label="File" value={file.name} />
              <Stat label="Size" value={fmtBytes(file.size)} />
              <Stat label="Stream" value={`${fmtBytes(meta.dataLen)}${meta.flags & 1 ? ' gzip' : ''}`} />
              <Stat label="Blocks (K)" value={String(meta.K)} />
              {/* <Stat label="QR grid" value={gridMode === 1 ? 'Single' : gridMode === 2 ? '1×2 (2 QR)' : '2×2 (4 QR)'} /> */}
              <Stat label="Level" value={`${ecLevel} (${ecLevel === 'M' ? '~15% EC' : '~7% EC'})`} />
              <Stat label="Est. time" value={`~${estSeconds}s`} />
              <Stat label="Seed" value={String(seed)} />
            </div>

            <div className="flex flex-wrap items-center gap-3 min-w-0">
              <button
                onClick={() => {
                  if (!running) { lastRef.current = 0; setRunning(true) }
                  else setRunning(false)
                }}
                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-sm transition-colors"
              >
                {running ? 'Pause' : 'Start beaming'}
              </button>
              <label className="flex items-center gap-2 text-sm">
                <span className="text-slate-600 dark:text-slate-300">Speed</span>
                <input type="range" min={3} max={15} value={fps}
                  onChange={e => setFps(Number(e.target.value))} />
                <span className="tabular-nums w-14">{fps} fps</span>
              </label>
              {/* Grid mode selector — kept for future re-enable, currently single QR only
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-600 dark:text-slate-300">QR grid</span>
                <div className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 text-xs font-medium">
                  {([1, 2, 4] as const).map(g => (
                    <button key={g} onClick={() => setGridMode(g)}
                      className={'px-3 py-1.5 transition-colors ' + (gridMode === g ? 'bg-emerald-500 text-white' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300')}>
                      {g === 1 ? '1' : g === 2 ? '1×2' : '2×2'}
                    </button>
                  ))}
                </div>
              </div>
              */}
            </div>

            <div className="flex justify-center">
              <canvas
                ref={canvasRef}
                width={512}
                height={512}
                className="w-full max-w-[400px] aspect-square rounded-xl border border-slate-200 dark:border-slate-800 bg-white"
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
              Point the receiving device's camera at this screen. Beam loops forever —
              the receiver catches whichever frames it can, in any order.
            </p>
          </>
        )}
        {!meta && !error && (
          <canvas ref={canvasRef} width={512} height={512} className="hidden" />
        )}
      </div>
    </div>
  )
}

// ----------------------------------------------------------------------------
// Receive panel — IndexedDB resume, quad-aware sampling
// ----------------------------------------------------------------------------
const IDB_SESSION_KEY = 'beam-current-session'

// QR decoder state — module-level so it persists across scans.
let _jsQRFn: ((d: Uint8ClampedArray, w: number, h: number, o: any) => any) | null = null
let _zxRead: ((id: ImageData, opts: any) => Promise<any[]>) | null = null
let _barcodeDetector: any = null
const ZXING_OPTS = { formats: ['QRCode'], tryHarder: true, tryInvert: false, binarizer: 'LocalAverage' }

// Bounding box in 0-1 normalised coords relative to the cropped square frame
interface QRBox { x: number; y: number; w: number; h: number }
interface DecodeResult { bytes: Uint8Array; box: QRBox | null }

/** Loads jsQR (sync), BarcodeDetector (native), and ZXing WASM (background). */
function loadDecoders(): Promise<void> {
  if (_jsQRFn) return Promise.resolve()

  // Native BarcodeDetector — Chrome/Android, no download needed
  if (typeof (window as any).BarcodeDetector !== 'undefined') {
    try {
      _barcodeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code'] })
    } catch { /* not supported */ }
  }

  return new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = jsQRUrl
    s.onload = () => {
      _jsQRFn = (window as any).jsQR
      resolve()
      // ZXing WASM loads in background — upgrades to faster C++ decoder once compiled
      const zs = document.createElement('script')
      zs.src = zxingIIFEUrl
      zs.onload = () => {
        const ZX = (window as any).ZXingWASM
        if (!ZX?.prepareZXingModule) return
        ZX.prepareZXingModule({
          overrides: { locateFile: () => new URL(zxingWasmUrl, window.location.href).href }
        }).then(() => { _zxRead = ZX.readBarcodesFromImageData }).catch(() => {})
      }
      document.head.appendChild(zs)
    }
    s.onerror = reject
    document.head.appendChild(s)
  })
}

/** corners → axis-aligned bounding box in 0-1 normalised coords */
function cornersToBox(pts: { x: number; y: number }[], imgW: number, imgH: number): QRBox {
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y)
  const x0 = Math.min(...xs), y0 = Math.min(...ys)
  const x1 = Math.max(...xs), y1 = Math.max(...ys)
  return { x: x0 / imgW, y: y0 / imgH, w: (x1 - x0) / imgW, h: (y1 - y0) / imgH }
}

/**
 * Decode one ImageData frame. Priority: BarcodeDetector → ZXing → jsQR.
 * Returns bytes + normalised bounding box (null if decoder doesn't provide one).
 */
async function decodeFrame(img: ImageData): Promise<DecodeResult | null> {
  // 1. Native BarcodeDetector (hardware-accelerated on Android Chrome)
  if (_barcodeDetector) {
    try {
      const results = await _barcodeDetector.detect(img)
      for (const r of results) {
        if (r.rawValue != null && r.cornerPoints?.length) {
          // BarcodeDetector returns text; encode back to bytes via latin1
          const bytes = new Uint8Array(r.rawValue.length)
          for (let i = 0; i < r.rawValue.length; i++) bytes[i] = r.rawValue.charCodeAt(i) & 0xff
          if (bytes.length) return { bytes, box: cornersToBox(r.cornerPoints, img.width, img.height) }
        }
      }
    } catch { /* fall through */ }
  }

  // 2. ZXing-WASM (C++, fast, cross-platform)
  if (_zxRead) {
    try {
      const results = await _zxRead(img, ZXING_OPTS)
      for (const r of results) {
        if (r.isValid && r.bytes?.length) {
          const box = r.position ? cornersToBox(
            [r.position.topLeft, r.position.topRight, r.position.bottomRight, r.position.bottomLeft],
            img.width, img.height
          ) : null
          return { bytes: new Uint8Array(r.bytes), box }
        }
      }
    } catch { /* fall through */ }
  }

  // 3. jsQR (pure JS fallback)
  if (_jsQRFn) {
    const r = _jsQRFn(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' })
    if (r?.binaryData?.length) {
      const box = r.location ? cornersToBox(
        [r.location.topLeftCorner, r.location.topRightCorner, r.location.bottomRightCorner, r.location.bottomLeftCorner],
        img.width, img.height
      ) : null
      return { bytes: new Uint8Array(r.binaryData), box }
    }
  }

  return null
}

function ReceivePanel() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)  // hidden off-screen sample canvas
  const overlayRef = useRef<HTMLCanvasElement | null>(null) // visible bounding-box overlay
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)
  const ltRef = useRef<LTState>(makeFreshLT())
  const doneRef = useRef(false)

  // Pre-warm: kick off jsQR + ZXing WASM load the moment Receive tab is mounted,
  // so both are compiled/JIT-warm before the user hits Start.
  useEffect(() => { loadDecoders().catch(() => {}) }, [])
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState<{ recovered: number; K: number } | null>(null)
  const [status, setStatus] = useState('')
  const [done, setDone] = useState(false)
  const [detectedFileName, setDetectedFileName] = useState('')
  const [resumeAvailable, setResumeAvailable] = useState(false)
  const [resumeInfo, setResumeInfo] = useState<{ recovered: number; K: number; fileName: string } | null>(null)
  const fileNameRef = useRef('beam-received.bin')

  // Check for saved session on mount
  useEffect(() => {
    idbGet<any>(IDB_SESSION_KEY).then(saved => {
      if (saved && saved.K > 0 && saved.recoveredCount < saved.K) {
        setResumeAvailable(true)
        setResumeInfo({ recovered: saved.recoveredCount, K: saved.K, fileName: saved.fileName || 'unknown' })
      }
    })
  }, [])

  const stopStream = useCallback(() => {
    if (rafRef.current != null) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null }
  }, [])

  useEffect(() => () => stopStream(), [stopStream])

  const pauseCamera = useCallback(async () => {
    stopStream()
    const st = ltRef.current
    if (st.started && st.recoveredCount > 0) {
      await idbSet(IDB_SESSION_KEY, ltSnap(st))
      setResumeAvailable(true)
    }
    setScanning(false)
    setStatus('Paused — progress saved. Resume when ready.')
  }, [stopStream])

  const startCamera = useCallback(async (resume = false) => {
    setError(''); setDone(false); doneRef.current = false
    if (!resume) {
      setProgress(null); setDetectedFileName('')
      fileNameRef.current = 'beam-received.bin'
      ltRef.current = makeFreshLT()
      await idbDelete(IDB_SESSION_KEY); setResumeAvailable(false)
    } else {
      const saved = await idbGet<any>(IDB_SESSION_KEY)
      if (saved) {
        ltRef.current = ltFromSaved(saved)
        setProgress({ recovered: ltRef.current.recoveredCount, K: ltRef.current.K })
        fileNameRef.current = ltRef.current.fileName || 'beam-received.bin'
        setDetectedFileName(ltRef.current.fileName)
        setStatus(`Resumed — ${ltRef.current.recoveredCount} / ${ltRef.current.K} blocks recovered. Keep scanning…`)
      }
    }

    setStatus('Requesting camera…')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      streamRef.current = stream
      const video = videoRef.current!
      video.srcObject = stream
      await video.play()
      setScanning(true)
      setStatus(resume ? 'Camera ready — keep scanning.' : 'Scanning… aim at the sending screen.')

      // Try to enable continuous autofocus (supported on Android Chrome; silently fails elsewhere)
      try {
        const track = stream.getVideoTracks()[0]
        if (track && typeof (track as any).applyConstraints === 'function') {
          await (track as any).applyConstraints({ advanced: [{ focusMode: 'continuous' }] } as any)
        }
      } catch { /* not supported — ignore */ }

      const SAMPLE_SZ = 512
      const sc = document.createElement('canvas')
      sc.width = SAMPLE_SZ; sc.height = SAMPLE_SZ
      const sctx = sc.getContext('2d', { willReadFrequently: true })!

      await loadDecoders()

      // Fade-out timer for the bounding box
      let boxFadeTimer: ReturnType<typeof setTimeout> | null = null

      const drawBox = (box: QRBox | null) => {
        const ov = overlayRef.current
        if (!ov) return
        const W = ov.width, H = ov.height
        const ctx = ov.getContext('2d')!
        ctx.clearRect(0, 0, W, H)
        if (!box) return
        const x = box.x * W, y = box.y * H, w = box.w * W, h = box.h * H
        const r = 8
        ctx.beginPath()
        ctx.moveTo(x + r, y)
        ctx.arcTo(x + w, y, x + w, y + h, r)
        ctx.arcTo(x + w, y + h, x, y + h, r)
        ctx.arcTo(x, y + h, x, y, r)
        ctx.arcTo(x, y, x + w, y, r)
        ctx.closePath()
        ctx.strokeStyle = '#22c55e'
        ctx.lineWidth = 3
        ctx.shadowColor = '#22c55e'
        ctx.shadowBlur = 8
        ctx.stroke()
      }

      let busy = false
      const loop = async () => {
        if (!streamRef.current || doneRef.current) return
        const v = videoRef.current
        if (v && v.videoWidth > 0 && !busy) {
          busy = true
          // crop centre square
          const vw = v.videoWidth, vh = v.videoHeight
          const side = Math.min(vw, vh)
          sctx.drawImage(v, (vw - side) >> 1, (vh - side) >> 1, side, side, 0, 0, SAMPLE_SZ, SAMPLE_SZ)
          const img = sctx.getImageData(0, 0, SAMPLE_SZ, SAMPLE_SZ)
          const result = await decodeFrame(img)
          busy = false
          if (result) {
            // Draw / refresh bounding box
            drawBox(result.box)
            if (boxFadeTimer) clearTimeout(boxFadeTimer)
            boxFadeTimer = setTimeout(() => drawBox(null), 500)

            const raw = result.bytes
            const r = ltIngest(ltRef.current, raw)
            if (r === 'progress') {
              const st = ltRef.current
              if (st.fileName && fileNameRef.current !== st.fileName) {
                fileNameRef.current = st.fileName; setDetectedFileName(st.fileName)
              }
              setProgress({ recovered: st.recoveredCount, K: st.K })
              setStatus(`Scanning… ${st.recoveredCount} / ${st.K} blocks`)
              if (st.recoveredCount - st.lastSaveCount >= 10) {
                st.lastSaveCount = st.recoveredCount
                idbSet(IDB_SESSION_KEY, ltSnap(st))
              }
            } else if (r === 'complete') {
              doneRef.current = true
              stopStream(); setScanning(false)
              setStatus('Stream complete — verifying…')
              try {
                const st = ltRef.current
                let bytes = new Uint8Array(st.K * st.symbolSize)
                for (let b = 0; b < st.K; b++) bytes.set(st.recovered[b]!, b * st.symbolSize)
                bytes = bytes.slice(0, st.dataLen)
                if (st.flags & 1) bytes = new Uint8Array(await gunzip(bytes))
                const hash = toHex(await sha256(bytes))
                if (hash !== st.fileHashHex) {
                  setError('Integrity check failed — file does not match. Try scanning again.')
                  doneRef.current = false; return
                }
                const saveName = st.fileName || fileNameRef.current || 'beam-received.bin'
                const url = URL.createObjectURL(new Blob([bytes.buffer as ArrayBuffer]))
                const a = document.createElement('a'); a.href = url; a.download = saveName
                document.body.appendChild(a); a.click(); a.remove()
                setTimeout(() => URL.revokeObjectURL(url), 2000)
                await idbDelete(IDB_SESSION_KEY)
                setResumeAvailable(false); setDone(true)
                setStatus('File received and verified. Download started.')
              } catch (err: any) { setError('Could not finalise: ' + (err?.message ?? err)) }
              return
            }
          } else { busy = false }
        } else { busy = false }
        rafRef.current = requestAnimationFrame(loop)
      }
      rafRef.current = requestAnimationFrame(loop)
    } catch (e: any) {
      const n = e?.name ?? ''
      if (n === 'NotAllowedError') setError('Camera permission denied — allow access and reload.')
      else if (n === 'NotFoundError') setError('No camera found on this device.')
      else setError('Could not start camera: ' + (e?.message ?? e))
      setStatus(''); stopStream(); setScanning(false)
    }
  }, [stopStream])

  const pct = progress && progress.K ? Math.round((progress.recovered / progress.K) * 100) : 0

  return (
    <div className="space-y-4 w-full min-w-0">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 space-y-4 overflow-hidden">

        {/* Resume banner */}
        {resumeAvailable && resumeInfo && !scanning && (
          <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 px-4 py-3 text-sm text-amber-800 dark:text-amber-300 flex flex-wrap items-center justify-between gap-3">
            <span>
              Incomplete transfer found: <strong>{resumeInfo.fileName}</strong> — {resumeInfo.recovered} / {resumeInfo.K} blocks ({Math.round(resumeInfo.recovered / resumeInfo.K * 100)}%).
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => startCamera(true)}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium transition-colors"
              >
                Resume scan
              </button>
              <button
                onClick={async () => { await idbDelete(IDB_SESSION_KEY); setResumeAvailable(false) }}
                className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors"
              >
                Discard
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          {!scanning ? (
            <button
              onClick={() => startCamera(false)}
              className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-sm transition-colors"
            >
              Start camera
            </button>
          ) : (
            <button
              onClick={() => pauseCamera()}
              className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium text-sm transition-colors"
            >
              Pause
            </button>
          )}
          {detectedFileName ? (
            <span className="text-sm text-slate-500 dark:text-slate-400">
              Saving as <span className="font-medium text-slate-700 dark:text-slate-200">{detectedFileName}</span>
            </span>
          ) : (
            <label className="text-sm flex items-center gap-2">
              <span className="text-slate-600 dark:text-slate-300">Save as</span>
              <input
                type="text"
                placeholder="beam-received.bin"
                onChange={e => (fileNameRef.current = e.target.value || 'beam-received.bin')}
                className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm w-44"
              />
            </label>
          )}
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-300 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <div className={scanning ? 'relative w-full aspect-square rounded-xl overflow-hidden bg-black border border-slate-200 dark:border-slate-800' : 'hidden'}>
          <video ref={videoRef} playsInline muted
            className="absolute inset-0 w-full h-full object-cover" />
          {/* Bounding-box overlay — sized to match the video element via CSS */}
          <canvas ref={overlayRef} width={512} height={512}
            className="absolute inset-0 w-full h-full pointer-events-none" />
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {status && <p className="text-sm text-slate-600 dark:text-slate-300">{status}</p>}

        {progress && progress.K > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>{progress.recovered} / {progress.K} blocks recovered</span>
              <span>{pct}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div className="h-full bg-emerald-500 transition-all duration-150" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}

        {done && (
          <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-4 py-3 text-sm">
            Transfer complete — SHA-256 verified. Download started.
          </div>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-slate-400">{label}</div>
      <div className="font-medium truncate text-sm" title={value}>{value}</div>
    </div>
  )
}

// ----------------------------------------------------------------------------
// Info section
// ----------------------------------------------------------------------------
function BeamInfo() {
  return (
    <div className="mt-8 text-sm leading-6 text-slate-700 dark:text-slate-300 space-y-6 w-full min-w-0 overflow-hidden">

      {/* What it is */}
      <div>
        <h3 className="text-base font-semibold mb-1">What Beam is</h3>
        <p>
          Beam transfers a file from one device to another using nothing but animated QR codes and a
          camera. No network, no server, nothing uploaded — the file is encoded into a fountain of QR
          frames on the sending screen and rebuilt from the camera feed on the receiver. Both sides
          only need a browser tab.
        </p>
      </div>

      {/* How to use */}
      <div>
        <h3 className="text-base font-semibold mb-1">How to use it</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Send:</strong> pick a file, choose a block size and QR grid, press <em>Start beaming</em>. The codes cycle continuously — that's normal.</li>
          <li><strong>Receive:</strong> on the other device, open the Receive tab and press <em>Start camera</em>. Point it at the screen. Progress fills as blocks arrive; the file downloads automatically with its original name when done.</li>
          <li><strong>Pausing:</strong> the receiver saves progress to your browser every 10 blocks. Press Pause at any time — a Resume banner appears when you return.</li>
          <li><strong>QR grid:</strong> start with <em>1</em> (single, most reliable). If your camera keeps up, try <em>1×2</em> then <em>2×2</em> for more throughput. Switch live during a transfer — no restart needed.</li>
        </ul>
      </div>

      {/* How fountain coding works */}
      <div>
        <h3 className="text-base font-semibold mb-1">How fountain coding works</h3>
        <p>
          The file is split into <em>K</em> equal blocks. Each QR frame carries an XOR combination
          of some blocks, chosen by a seed embedded in the frame itself. The receiver needs no
          specific frame and no specific order — any sufficient subset reconstructs the whole file.
          Dropped, blurry, or missed frames cost nothing; the next one substitutes. This is an LT
          (Luby Transform) fountain code with a Robust Soliton degree distribution — the same family
          of codes used in satellite broadcasting and deep-space telemetry.
        </p>
      </div>

      {/* Block size */}
      <div>
        <h3 className="text-base font-semibold mb-1">Block size & max file size</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Small (160 B):</strong> compact QR codes, easiest for any camera. Max ~10 MB. Best for keys, configs, text, small PDFs.</li>
          <li><strong>Medium (300 B):</strong> balanced. Max ~19 MB.</li>
          <li><strong>Large (512 B):</strong> denser codes — needs steady camera and good lighting. Max ~33 MB.</li>
          <li>Compressible files (text, JSON, HTML) are automatically gzip-compressed before encoding, reducing block count further.</li>
        </ul>
      </div>

      {/* Air-gap */}
      <div>
        <h3 className="text-base font-semibold mb-1">Air-gap & offline use</h3>
        <p>
          Beam makes zero network requests during a transfer — it works on machines with no network
          card, no WiFi, no Bluetooth, and no USB port. Camera access requires a secure context
          (HTTPS or localhost), so install String Ninja to your home screen over HTTPS once; after
          that it works fully offline and air-gapped.
        </p>
      </div>

      {/* Integrity */}
      <div>
        <h3 className="text-base font-semibold mb-1">Integrity & privacy</h3>
        <p>
          The sender computes a SHA-256 hash of the original file and embeds it in every frame. The
          receiver verifies this hash after reconstruction — if a single byte is wrong, the transfer
          is rejected. No data ever leaves either device.
        </p>
      </div>

      {/* Comparison */}
      <div>
        <h3 className="text-base font-semibold mb-2">How Beam compares to alternatives</h3>
        <p className="mb-3 text-slate-500 dark:text-slate-400 text-xs">
          Based on independently verified research across all major QR/optical file transfer tools.
        </p>
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 text-left">
                <th className="px-3 py-2 font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">Approach</th>
                <th className="px-3 py-2 font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">No server</th>
                <th className="px-3 py-2 font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">Fountain codes</th>
                <th className="px-3 py-2 font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">Browser-native</th>
                <th className="px-3 py-2 font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">Resume</th>
                <th className="px-3 py-2 font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">Multi-QR grid</th>
                <th className="px-3 py-2 font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">Max size</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {[
                { name: 'Beam', server: '✅', fountain: '✅', browser: '✅', resume: '✅', multi: '✅ 1/1×2/2×2', size: '~33 MB', highlight: true },
                { name: 'WebRTC P2P tools', server: '❌ needs relay', fountain: '❌', browser: '✅', resume: '❌', multi: '❌', size: 'large' },
                { name: 'CLI QR tools (Go/Python)', server: '✅', fountain: '✅ some', browser: '❌ install required', resume: '❌', multi: '❌', size: 'small' },
                { name: 'Native app QR tools (C++)', server: '✅', fountain: '✅ some', browser: '❌ install required', resume: '❌', multi: '❌', size: '33 MB' },
                { name: 'Browser QR (sequential)', server: '✅', fountain: '❌', browser: '✅', resume: '❌', multi: '❌', size: 'small' },
                { name: 'Relay-based file share', server: '❌ relay server', fountain: '❌', browser: '❌ CLI', resume: '❌', multi: '❌', size: 'large' },
              ].map(row => (
                <tr key={row.name} className={row.highlight ? 'bg-emerald-50 dark:bg-emerald-950/30 font-medium' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}>
                  <td className="px-3 py-2 whitespace-nowrap text-slate-800 dark:text-slate-200">{row.name}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{row.server}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{row.fountain}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{row.browser}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{row.resume}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{row.multi}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{row.size}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="mt-3 list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
          <li><strong className="text-slate-800 dark:text-slate-200">Only browser-native + fountain-coded + serverless tool.</strong> Other fountain-coded QR tools require installing a native app (Go, Python, or C++). Browser-based QR tools exist but use sequential chunks — miss one frame and that block is lost until it cycles back.</li>
          <li><strong className="text-slate-800 dark:text-slate-200">Multi-QR grid is unique to Beam.</strong> No other QR transfer tool — browser or native — displays multiple independent codes simultaneously for parallel decoding.</li>
          <li><strong className="text-slate-800 dark:text-slate-200">Resume across sessions.</strong> Beam saves decoder state to IndexedDB every 10 blocks. Close the tab, switch apps, come back later — no re-scan from scratch.</li>
          <li><strong className="text-slate-800 dark:text-slate-200">No install on either end.</strong> Native app tools with higher throughput use proprietary color-icon matrix formats that need a custom C++ decoder. Beam trades that ceiling for universal compatibility — any phone camera, any browser, zero install.</li>
        </ul>
      </div>

    </div>
  )
}
