import React, { useEffect, useRef, useState, useCallback } from 'react'
import ToolCard from './ToolCard'
// @ts-ignore - vendored ES module, see src/vendor/beam/qrcode-generator.LICENSE
import qrcode from '../vendor/beam/qrcode-generator.mjs'
// Vendored jsQR loaded into the decode worker via importScripts (see worker source below).
import jsQRWorkerUrl from '../vendor/beam/jsQR.js?url'

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
 *   48      N     payload (symbolSize bytes)
 *   48+N    4     crc32 (over bytes [0 .. 48+N))
 *
 * Coding: LT fountain code. Encoder XORs source blocks chosen by a
 * deterministic per-seed PRNG (mulberry32) + Robust Soliton degree
 * distribution. Decoder peels (belief propagation). deriveSymbol() is shared
 * verbatim by both sides so any frame is self-describing.
 * ========================================================================== */

const MAGIC = 0x534e
const VERSION = 1
const HEADER_LEN = 48
const DEFAULT_SYMBOL_SIZE = 160

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
// PRNG + Robust Soliton degree distribution + symbol derivation (shared)
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

// Robust Soliton distribution, c=0.03, delta=0.05.
function buildRobustSoliton(K: number): Float64Array {
  const c = 0.03
  const delta = 0.05
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
  for (let d = 1; d <= K; d++) {
    acc += (rho[d] + tau[d]) / sum
    cdf[d] = acc
  }
  return cdf
}

// deriveSymbol(seed, K) -> {degree, indices[]}. Identical on encode + decode.
function deriveSymbol(seed: number, K: number, cdf: Float64Array): { degree: number; indices: number[] } {
  const rand = mulberry32(seed >>> 0)
  const r = rand()
  let degree = 1
  // binary-ish linear scan over the CDF
  for (let d = 1; d <= K; d++) {
    if (r <= cdf[d]) {
      degree = d
      break
    }
    degree = d
  }
  if (degree > K) degree = K
  // pick `degree` distinct source indices
  const chosen = new Set<number>()
  while (chosen.size < degree) {
    chosen.add(Math.floor(rand() * K) % K)
  }
  return { degree, indices: Array.from(chosen) }
}

// ----------------------------------------------------------------------------
// Frame builder (encoder side)
// ----------------------------------------------------------------------------
function buildFrame(opts: {
  dataLen: number
  flags: number
  K: number
  symbolSize: number
  seed: number
  fileHash: Uint8Array
  payload: Uint8Array
}): Uint8Array {
  const { dataLen, flags, K, symbolSize, seed, fileHash, payload } = opts
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
  buf.set(payload.subarray(0, symbolSize), HEADER_LEN)
  const crc = crc32(buf, 0, HEADER_LEN + symbolSize)
  dv.setUint32(HEADER_LEN + symbolSize, crc >>> 0, true)
  return buf
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------
async function sha256(bytes: Uint8Array): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest('SHA-256', bytes as BufferSource)
  return new Uint8Array(digest)
}

async function maybeGzip(bytes: Uint8Array): Promise<{ data: Uint8Array; gzipped: boolean }> {
  if (typeof (globalThis as any).CompressionStream === 'undefined') {
    return { data: bytes, gzipped: false }
  }
  try {
    const cs = new (globalThis as any).CompressionStream('gzip')
    const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(cs)
    const compressed = new Uint8Array(await new Response(stream).arrayBuffer())
    // Only use compression if it actually helps.
    if (compressed.length < bytes.length) return { data: compressed, gzipped: true }
    return { data: bytes, gzipped: false }
  } catch {
    return { data: bytes, gzipped: false }
  }
}

async function gunzip(bytes: Uint8Array): Promise<Uint8Array> {
  const ds = new (globalThis as any).DecompressionStream('gzip')
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(ds)
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

function toHex(bytes: Uint8Array): string {
  let s = ''
  for (let i = 0; i < bytes.length; i++) s += bytes[i].toString(16).padStart(2, '0')
  return s
}

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(2)} MB`
}

// QR encode a frame: pack as Latin-1, render to canvas.
function encodeFrameToCanvas(frame: Uint8Array, canvas: HTMLCanvasElement) {
  let str = ''
  for (let i = 0; i < frame.length; i++) str += String.fromCharCode(frame[i] & 0xff)
  const qr = (qrcode as any)(0, 'M')
  qr.addData(str, 'Byte')
  qr.make()
  const count = qr.getModuleCount()
  const size = canvas.width
  const quiet = 4
  const cell = size / (count + quiet * 2)
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, size, size)
  ctx.fillStyle = '#000000'
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (qr.isDark(r, c)) {
        ctx.fillRect(
          Math.floor((c + quiet) * cell),
          Math.floor((r + quiet) * cell),
          Math.ceil(cell),
          Math.ceil(cell)
        )
      }
    }
  }
}

// ----------------------------------------------------------------------------
// Decode worker (inline, via Blob URL). Runs jsQR + CRC + LT peel off-thread.
// ----------------------------------------------------------------------------
function buildWorkerSource(jsqrUrl: string): string {
  // The worker re-implements the shared coding primitives so it stays self
  // contained. crc32 / mulberry32 / robust soliton / deriveSymbol are byte-for
  // byte identical to the encoder above.
  return `
self.importScripts(${JSON.stringify(jsqrUrl)});
var jsQR = self.jsQR;

var MAGIC = ${MAGIC}, HEADER_LEN = ${HEADER_LEN};
var CRC32_TABLE = (function(){var t=new Uint32Array(256);for(var n=0;n<256;n++){var c=n;for(var k=0;k<8;k++)c=(c&1)?(0xedb88320^(c>>>1)):(c>>>1);t[n]=c>>>0;}return t;})();
function crc32(buf,start,end){var crc=-1;for(var i=start;i<end;i++)crc=(crc>>>8)^CRC32_TABLE[(crc^buf[i])&0xff];return (crc^-1)>>>0;}
function mulberry32(a){return function(){a|=0;a=(a+0x6d2b79f5)|0;var t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return ((t^(t>>>14))>>>0)/4294967296;};}
function buildRobustSoliton(K){var c=0.03,delta=0.05;var rho=new Float64Array(K+1);rho[1]=1/K;for(var d=2;d<=K;d++)rho[d]=1/(d*(d-1));var R=c*Math.log(K/delta)*Math.sqrt(K);var tau=new Float64Array(K+1);var kR=Math.max(1,Math.floor(K/R));for(var d2=1;d2<kR;d2++)tau[d2]=R/(d2*K);if(kR<=K)tau[kR]=(R*Math.log(R/delta))/K;var sum=0;for(var d3=1;d3<=K;d3++)sum+=rho[d3]+tau[d3];var cdf=new Float64Array(K+1);var acc=0;for(var d4=1;d4<=K;d4++){acc+=(rho[d4]+tau[d4])/sum;cdf[d4]=acc;}return cdf;}
function deriveSymbol(seed,K,cdf){var rand=mulberry32(seed>>>0);var r=rand();var degree=1;for(var d=1;d<=K;d++){if(r<=cdf[d]){degree=d;break;}degree=d;}if(degree>K)degree=K;var chosen={},indices=[];while(indices.length<degree){var idx=Math.floor(rand()*K)%K;if(!chosen[idx]){chosen[idx]=1;indices.push(idx);}}return indices;}

// LT decoder state
var K=0, symbolSize=0, dataLen=0, flags=0, cdf=null, fileHashHex=null;
var recovered=null;       // Uint8Array[K] | null per block
var recoveredCount=0;
var pending=[];           // {indices:Set, data:Uint8Array}
var seenSeeds={};
var started=false;

function reset(){K=0;symbolSize=0;dataLen=0;flags=0;cdf=null;fileHashHex=null;recovered=null;recoveredCount=0;pending=[];seenSeeds={};started=false;}

function xorInto(dst,src){for(var i=0;i<dst.length;i++)dst[i]^=src[i];}

function peel(){
  var progressed=true;
  while(progressed){
    progressed=false;
    for(var p=0;p<pending.length;p++){
      var blk=pending[p];
      if(!blk) continue;
      // remove already-recovered indices
      for(var qi=blk.indices.length-1;qi>=0;qi--){
        var ix=blk.indices[qi];
        if(recovered[ix]){xorInto(blk.data,recovered[ix]);blk.indices.splice(qi,1);}
      }
      if(blk.indices.length===1){
        var idx=blk.indices[0];
        if(!recovered[idx]){recovered[idx]=blk.data.slice();recoveredCount++;progressed=true;}
        pending[p]=null;
      } else if(blk.indices.length===0){
        pending[p]=null;
      }
    }
  }
}

function ingest(frame){
  var dv=new DataView(frame.buffer,frame.byteOffset,frame.byteLength);
  if(frame.length<HEADER_LEN+1+4) return;
  if(dv.getUint16(0,true)!==MAGIC) return;
  var fK=dv.getUint16(8,true);
  var fSym=dv.getUint16(10,true);
  if(frame.length < HEADER_LEN+fSym+4) return;
  // verify crc
  var gotCrc=dv.getUint32(HEADER_LEN+fSym,true)>>>0;
  var calc=crc32(frame,0,HEADER_LEN+fSym);
  if(gotCrc!==calc) return;
  var seed=dv.getUint32(12,true)>>>0;
  if(!started){
    K=fK;symbolSize=fSym;dataLen=dv.getUint32(4,true)>>>0;flags=frame[3];
    var fh=frame.subarray(16,48);var hx='';for(var i=0;i<32;i++)hx+=fh[i].toString(16).padStart(2,'0');
    fileHashHex=hx;
    cdf=buildRobustSoliton(K);
    recovered=new Array(K);
    started=true;
  }
  if(fK!==K||fSym!==symbolSize) return; // mismatched stream
  if(seenSeeds[seed]) return;
  seenSeeds[seed]=1;
  var payload=frame.slice(HEADER_LEN,HEADER_LEN+symbolSize);
  var indices=deriveSymbol(seed,K,cdf);
  pending.push({indices:indices,data:payload});
  peel();
  postMessage({type:'progress',recovered:recoveredCount,K:K,dataLen:dataLen,fileHashHex:fileHashHex});
  if(recoveredCount===K){
    // assemble
    var out=new Uint8Array(K*symbolSize);
    for(var b=0;b<K;b++) out.set(recovered[b],b*symbolSize);
    var trimmed=out.slice(0,dataLen);
    postMessage({type:'complete',data:trimmed,flags:flags,fileHashHex:fileHashHex},[trimmed.buffer]);
  }
}

self.onmessage=function(e){
  var msg=e.data;
  if(msg.type==='reset'){reset();return;}
  if(msg.type==='frame'){
    if(!started && msg.expectReset){reset();}
    try{
      var img=msg.image;
      var code=jsQR(img.data,img.width,img.height,{inversionAttempts:'dontInvert'});
      if(!code||!code.binaryData||!code.binaryData.length) return;
      ingest(new Uint8Array(code.binaryData));
    }catch(err){/* ignore frame */}
  }
};
`
}

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------
type Mode = 'send' | 'receive'

export default function Beam() {
  const [mode, setMode] = useState<Mode>('send')

  return (
    <ToolCard
      title="Beam — File Transfer"
      description="Move a file between two devices using only animated QR codes. No network, no server, no upload — the bytes travel as light through your camera."
    >
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setMode('send')}
          className={
            'px-4 py-2 rounded-lg font-medium text-sm transition-colors ' +
            (mode === 'send'
              ? 'bg-emerald-500 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700')
          }
        >
          Send
        </button>
        <button
          onClick={() => setMode('receive')}
          className={
            'px-4 py-2 rounded-lg font-medium text-sm transition-colors ' +
            (mode === 'receive'
              ? 'bg-emerald-500 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700')
          }
        >
          Receive
        </button>
      </div>

      {mode === 'send' ? <SendPanel /> : <ReceivePanel />}

      <BeamInfo />
    </ToolCard>
  )
}

// ----------------------------------------------------------------------------
// Send panel
// ----------------------------------------------------------------------------
function SendPanel() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [fps, setFps] = useState(8)
  const [running, setRunning] = useState(false)
  const [seed, setSeed] = useState(0)
  const [meta, setMeta] = useState<{
    K: number
    symbolSize: number
    dataLen: number
    flags: number
    fileHash: Uint8Array
  } | null>(null)
  const blocksRef = useRef<Uint8Array[]>([])
  const cdfRef = useRef<Float64Array | null>(null)
  const seedRef = useRef(0)
  const rafRef = useRef<number | null>(null)
  const lastRef = useRef(0)
  const fpsRef = useRef(8)
  useEffect(() => {
    fpsRef.current = fps
  }, [fps])

  const prepare = useCallback(async (f: File) => {
    setError('')
    setRunning(false)
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    try {
      const raw = new Uint8Array(await f.arrayBuffer())
      const fileHash = await sha256(raw)
      const { data, gzipped } = await maybeGzip(raw)
      const symbolSize = DEFAULT_SYMBOL_SIZE
      const K = Math.max(1, Math.ceil(data.length / symbolSize))
      if (K > 65535) {
        setError('File too large for a single Beam stream (over ~10 MB). Try a smaller file or compress it first.')
        setMeta(null)
        return
      }
      // chunk into K blocks of symbolSize (zero-padded)
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
      setMeta({ K, symbolSize, dataLen: data.length, flags: gzipped ? 1 : 0, fileHash })
    } catch (e: any) {
      setError('Could not read file: ' + (e?.message || String(e)))
      setMeta(null)
    }
  }, [])

  const renderNextFrame = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !meta || !cdfRef.current) return
    const s = seedRef.current >>> 0
    const { indices } = deriveSymbol(s, meta.K, cdfRef.current)
    const payload = new Uint8Array(meta.symbolSize)
    for (const ix of indices) {
      const blk = blocksRef.current[ix]
      for (let i = 0; i < meta.symbolSize; i++) payload[i] ^= blk[i]
    }
    const frame = buildFrame({
      dataLen: meta.dataLen,
      flags: meta.flags,
      K: meta.K,
      symbolSize: meta.symbolSize,
      seed: s,
      fileHash: meta.fileHash,
      payload,
    })
    encodeFrameToCanvas(frame, canvas)
    seedRef.current = (s + 1) >>> 0
    setSeed(seedRef.current)
  }, [meta])

  // animation loop
  useEffect(() => {
    if (!running || !meta) return
    const loop = (t: number) => {
      const interval = 1000 / fpsRef.current
      if (t - lastRef.current >= interval) {
        lastRef.current = t
        renderNextFrame()
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [running, meta, renderNextFrame])

  // render a static first frame when prepared
  useEffect(() => {
    if (meta && !running) {
      seedRef.current = 0
      renderNextFrame()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta])

  const estSeconds = meta ? Math.ceil((meta.K * 2) / fps) : 0

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Choose a file to beam</label>
          <input
            type="file"
            onChange={e => {
              const f = e.target.files?.[0] || null
              setFile(f)
              if (f) prepare(f)
            }}
            className="block text-sm"
          />
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-300 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {meta && file && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              <Stat label="File" value={file.name} />
              <Stat label="Size" value={fmtBytes(file.size)} />
              <Stat label="Stream" value={`${fmtBytes(meta.dataLen)}${meta.flags & 1 ? ' (gzip)' : ''}`} />
              <Stat label="Blocks (K)" value={String(meta.K)} />
              <Stat label="Est. time" value={`~${estSeconds}s`} />
              <Stat label="Frame / seed" value={String(seed)} />
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={() => {
                  if (!running) {
                    lastRef.current = 0
                    setRunning(true)
                  } else {
                    setRunning(false)
                  }
                }}
                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-sm transition-colors"
              >
                {running ? 'Stop' : 'Start beaming'}
              </button>
              <label className="flex items-center gap-2 text-sm">
                <span className="text-slate-600 dark:text-slate-300">Speed</span>
                <input
                  type="range"
                  min={5}
                  max={15}
                  value={fps}
                  onChange={e => setFps(Number(e.target.value))}
                />
                <span className="tabular-nums w-12">{fps} fps</span>
              </label>
            </div>

            <div className="flex justify-center">
              <canvas
                ref={canvasRef}
                width={512}
                height={512}
                className="w-full max-w-[360px] aspect-square rounded-xl border border-slate-200 dark:border-slate-800 bg-white"
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
              Point the receiving device's camera at this screen. Beam keeps emitting fresh fountain
              frames — the receiver only needs to catch enough of them, in any order.
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
// Receive panel
// ----------------------------------------------------------------------------
function ReceivePanel() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const workerRef = useRef<Worker | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const sampleTimer = useRef<number | null>(null)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState<{ recovered: number; K: number } | null>(null)
  const [status, setStatus] = useState('')
  const [done, setDone] = useState(false)
  const expectedHashRef = useRef<string | null>(null)
  const fileNameRef = useRef('beam-received.bin')

  const cleanup = useCallback(() => {
    if (sampleTimer.current) {
      clearInterval(sampleTimer.current)
      sampleTimer.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (workerRef.current) {
      workerRef.current.terminate()
      workerRef.current = null
    }
  }, [])

  useEffect(() => () => cleanup(), [cleanup])

  const startCamera = useCallback(async () => {
    setError('')
    setDone(false)
    setProgress(null)
    setStatus('Requesting camera…')
    try {
      // build worker
      const src = buildWorkerSource(new URL(jsQRWorkerUrl, window.location.href).href)
      const blob = new Blob([src], { type: 'application/javascript' })
      const worker = new Worker(URL.createObjectURL(blob))
      workerRef.current = worker
      worker.onmessage = async (e: MessageEvent) => {
        const m = e.data
        if (m.type === 'progress') {
          setProgress({ recovered: m.recovered, K: m.K })
          expectedHashRef.current = m.fileHashHex
          setStatus(`Catching frames… ${m.recovered} / ${m.K} blocks`)
        } else if (m.type === 'complete') {
          setStatus('Stream complete — verifying…')
          try {
            let bytes: Uint8Array = new Uint8Array(m.data)
            if (m.flags & 1) bytes = await gunzip(bytes)
            const hash = toHex(await sha256(bytes))
            if (expectedHashRef.current && hash !== expectedHashRef.current) {
              setError('Integrity check failed: the reconstructed file does not match the sender hash. Try again.')
              return
            }
            // download
            const out = new Blob([bytes.slice()])
            const url = URL.createObjectURL(out)
            const a = document.createElement('a')
            a.href = url
            a.download = fileNameRef.current
            document.body.appendChild(a)
            a.click()
            a.remove()
            setTimeout(() => URL.revokeObjectURL(url), 2000)
            setDone(true)
            setStatus('File received and verified. Download started.')
            cleanup()
            setScanning(false)
          } catch (err: any) {
            setError('Could not finalise file: ' + (err?.message || String(err)))
          }
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      streamRef.current = stream
      const video = videoRef.current!
      video.srcObject = stream
      await video.play()
      setScanning(true)
      setStatus('Scanning… aim at the sending screen.')

      const sample = () => {
        const v = videoRef.current
        const c = canvasRef.current
        const w = workerRef.current
        if (!v || !c || !w || v.videoWidth === 0) return
        const cw = 480
        const scale = cw / v.videoWidth
        c.width = cw
        c.height = Math.round(v.videoHeight * scale)
        const ctx = c.getContext('2d', { willReadFrequently: true })!
        ctx.drawImage(v, 0, 0, c.width, c.height)
        const img = ctx.getImageData(0, 0, c.width, c.height)
        w.postMessage(
          { type: 'frame', image: { data: img.data, width: img.width, height: img.height } },
          [img.data.buffer]
        )
      }
      sampleTimer.current = window.setInterval(sample, 80)
    } catch (e: any) {
      const name = e?.name || ''
      if (name === 'NotAllowedError') setError('Camera permission denied. Allow camera access and try again.')
      else if (name === 'NotFoundError') setError('No camera found on this device.')
      else setError('Could not start camera: ' + (e?.message || String(e)))
      setStatus('')
      cleanup()
      setScanning(false)
    }
  }, [cleanup])

  const pct = progress && progress.K ? Math.round((progress.recovered / progress.K) * 100) : 0

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          {!scanning ? (
            <button
              onClick={startCamera}
              className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-sm transition-colors"
            >
              Start camera
            </button>
          ) : (
            <button
              onClick={() => {
                cleanup()
                setScanning(false)
                setStatus('Stopped.')
              }}
              className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium text-sm transition-colors"
            >
              Stop
            </button>
          )}
          <label className="text-sm flex items-center gap-2">
            <span className="text-slate-600 dark:text-slate-300">Save as</span>
            <input
              type="text"
              defaultValue="beam-received.bin"
              onChange={e => (fileNameRef.current = e.target.value || 'beam-received.bin')}
              className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm w-44"
            />
          </label>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-300 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <div className="relative flex justify-center">
          <video ref={videoRef} playsInline muted className={scanning ? 'w-full max-w-[360px] rounded-xl border border-slate-200 dark:border-slate-800' : 'hidden'} />
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {status && <p className="text-sm text-slate-600 dark:text-slate-300">{status}</p>}

        {progress && progress.K > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>
                {progress.recovered} / {progress.K} blocks recovered
              </span>
              <span>{pct}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-150"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}

        {done && (
          <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-4 py-3 text-sm">
            Transfer complete and SHA-256 verified. Your download has started.
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
      <div className="font-medium truncate" title={value}>{value}</div>
    </div>
  )
}

// ----------------------------------------------------------------------------
// Info / help
// ----------------------------------------------------------------------------
function BeamInfo() {
  return (
    <div className="mt-8 text-sm leading-6 text-slate-700 dark:text-slate-300 space-y-4">
      <div>
        <h3 className="text-base font-semibold">What Beam is</h3>
        <p>
          Beam transfers a file from one device to another using nothing but animated QR codes and a
          camera. There is no network request, no server, and nothing is uploaded — the file is
          encoded into a stream of QR frames on the sending screen and rebuilt from the camera feed
          on the receiver. It runs entirely in your browser.
        </p>
      </div>
      <div>
        <h3 className="text-base font-semibold">How to use it</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Send:</strong> pick a file, press <em>Start beaming</em>, and hold the screen
            steady. The QR codes will keep cycling — that is expected.
          </li>
          <li>
            <strong>Receive:</strong> on the other device, switch to the Receive tab, press
            <em> Start camera</em>, and point it at the sending screen. The progress bar fills as
            blocks arrive. When complete, the file is verified and downloaded automatically.
          </li>
          <li>Tune the <strong>speed</strong> slider (5–15 fps). Slower is more reliable on shaky cameras; faster finishes sooner.</li>
        </ul>
      </div>
      <div>
        <h3 className="text-base font-semibold">How fountain coding works</h3>
        <p>
          The file is split into <em>K</em> equal blocks. Each QR frame carries a random XOR
          combination of some of those blocks, chosen by a seed that the frame itself contains. The
          receiver does not need any specific frame or order — it just needs to catch <em>enough</em>
          {' '}distinct frames, then it peels the combinations apart to recover every block. This is
          called an LT (Luby Transform) fountain code, and it tolerates dropped or misread frames
          gracefully.
        </p>
      </div>
      <div>
        <h3 className="text-base font-semibold">Offline & PWA note</h3>
        <p>
          Beam needs no connection while running. If you install String Ninja to your home screen
          over HTTPS, the app and Beam work fully offline afterwards. Camera access requires a secure
          context (HTTPS or localhost).
        </p>
      </div>
      <div>
        <h3 className="text-base font-semibold">GitHub Pages caveat</h3>
        <p>
          This site is hosted on GitHub Pages, which cannot set the COOP/COEP headers that browsers
          require for <code>SharedArrayBuffer</code>. Beam is therefore single-threaded by design: it
          uses one inline Web Worker for decoding but no shared-memory multithreading and no ML
          models.
        </p>
      </div>
      <div>
        <h3 className="text-base font-semibold">File types & size</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Any file type works — Beam treats the file as raw bytes and verifies it with SHA-256.</li>
          <li>Best for small files: text, configs, keys, small images, PDFs. Under ~1 MB transfers comfortably.</li>
          <li>Larger files take proportionally longer (more blocks = more frames to film). The hard ceiling per stream is roughly 10 MB.</li>
          <li>Text and other compressible files are gzip-compressed automatically when the browser supports <code>CompressionStream</code>.</li>
        </ul>
      </div>
    </div>
  )
}
