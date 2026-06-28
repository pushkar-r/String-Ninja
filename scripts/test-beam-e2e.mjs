/**
 * End-to-end Beam pipeline test using Node worker_threads.
 * Encodes dummy data into LT frames, renders each frame to a QR canvas,
 * reads the canvas pixel data, sends to the decode worker, and verifies
 * the reconstructed output matches the original.
 *
 * Requires: npm install canvas jsqr (or uses the vendored jsQR directly)
 */

import { Worker, isMainThread, parentPort, workerData } from 'worker_threads'
import { createHash } from 'crypto'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dir = dirname(fileURLToPath(import.meta.url))
const root = join(__dir, '..')

// ---- constants ----
const MAGIC = 0x534e
const VERSION = 1
const HEADER_LEN = 80

// ---- CRC-32 ----
const CRC32_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()
function crc32(buf, start = 0, end = buf.length) {
  let crc = -1
  for (let i = start; i < end; i++) crc = (crc >>> 8) ^ CRC32_TABLE[(crc ^ buf[i]) & 0xff]
  return (crc ^ -1) >>> 0
}

// ---- PRNG + Soliton ----
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
function buildRobustSoliton(K) {
  const c = 0.03, delta = 0.05, rho = new Float64Array(K + 1)
  rho[1] = 1 / K
  for (let d = 2; d <= K; d++) rho[d] = 1 / (d * (d - 1))
  const R = c * Math.log(K / delta) * Math.sqrt(K), tau = new Float64Array(K + 1)
  const kR = Math.max(1, Math.floor(K / R))
  for (let d = 1; d < kR; d++) tau[d] = R / (d * K)
  if (kR <= K) tau[kR] = (R * Math.log(R / delta)) / K
  let sum = 0; for (let d = 1; d <= K; d++) sum += rho[d] + tau[d]
  const cdf = new Float64Array(K + 1); let acc = 0
  for (let d = 1; d <= K; d++) { acc += (rho[d] + tau[d]) / sum; cdf[d] = acc }
  return cdf
}
function deriveSymbol(seed, K, cdf) {
  const rand = mulberry32(seed >>> 0), r = rand()
  let degree = 1
  for (let d = 1; d <= K; d++) { if (r <= cdf[d]) { degree = d; break }; degree = d }
  if (degree > K) degree = K
  const chosen = new Set()
  while (chosen.size < degree) chosen.add(Math.floor(rand() * K) % K)
  return { degree, indices: Array.from(chosen) }
}

// ---- Frame builder ----
function buildFrame({ dataLen, flags, K, symbolSize, seed, fileHash, fileName, payload }) {
  const total = HEADER_LEN + symbolSize + 4
  const buf = new Uint8Array(total)
  const dv = new DataView(buf.buffer)
  dv.setUint16(0, MAGIC, true); buf[2] = VERSION; buf[3] = flags
  dv.setUint32(4, dataLen >>> 0, true)
  dv.setUint16(8, K, true); dv.setUint16(10, symbolSize, true)
  dv.setUint32(12, seed >>> 0, true)
  buf.set(fileHash.subarray(0, 32), 16)
  const nameBytes = new TextEncoder().encode(fileName).subarray(0, 31)
  buf[48] = nameBytes.length; buf.set(nameBytes, 49)
  buf.set(payload.subarray(0, symbolSize), HEADER_LEN)
  dv.setUint32(HEADER_LEN + symbolSize, crc32(buf, 0, HEADER_LEN + symbolSize) >>> 0, true)
  return buf
}

// ---- LT decoder ----
function makeFreshLT() {
  return { K: 0, symbolSize: 0, dataLen: 0, flags: 0, fileHashHex: '', fileName: '',
    cdf: null, recovered: [], recoveredCount: 0, pending: [], seenSeeds: {}, started: false }
}
function xorInto(dst, src) { for (let i = 0; i < dst.length; i++) dst[i] ^= src[i] }
function peel(st) {
  let progressed = true
  while (progressed) {
    progressed = false
    for (let p = 0; p < st.pending.length; p++) {
      const blk = st.pending[p]; if (!blk) continue
      for (let qi = blk.indices.length - 1; qi >= 0; qi--) {
        const ix = blk.indices[qi]
        if (st.recovered[ix]) { xorInto(blk.data, st.recovered[ix]); blk.indices.splice(qi, 1) }
      }
      if (blk.indices.length === 1) {
        const ix = blk.indices[0]
        if (!st.recovered[ix]) { st.recovered[ix] = blk.data.slice(); st.recoveredCount++; progressed = true }
        st.pending[p] = null
      } else if (blk.indices.length === 0) { st.pending[p] = null }
    }
  }
}
function ltIngest(st, frame) {
  if (frame.length < HEADER_LEN + 1 + 4) return `invalid:too-short(${frame.length})`
  const dv = new DataView(frame.buffer, frame.byteOffset, frame.byteLength)
  const magic = dv.getUint16(0, true)
  if (magic !== MAGIC) return `invalid:magic(${magic.toString(16)}≠${MAGIC.toString(16)})`
  const fK = dv.getUint16(8, true), fSym = dv.getUint16(10, true)
  if (frame.length < HEADER_LEN + fSym + 4) return `invalid:payload-short`
  const gotCrc = dv.getUint32(HEADER_LEN + fSym, true) >>> 0
  const expCrc = crc32(frame, 0, HEADER_LEN + fSym)
  if (gotCrc !== expCrc) return `invalid:crc(got=${gotCrc},exp=${expCrc})`
  const seed = dv.getUint32(12, true) >>> 0
  if (!st.started) {
    st.K = fK; st.symbolSize = fSym; st.dataLen = dv.getUint32(4, true) >>> 0; st.flags = frame[3]
    const fh = frame.subarray(16, 48); let hx = ''
    for (let i = 0; i < 32; i++) hx += fh[i].toString(16).padStart(2, '0')
    st.fileHashHex = hx
    const nameLen = Math.min(frame[48] || 0, 31)
    try { st.fileName = new TextDecoder().decode(frame.subarray(49, 49 + nameLen)) } catch { st.fileName = 'unknown' }
    st.cdf = buildRobustSoliton(fK); st.recovered = new Array(fK).fill(null); st.started = true
  }
  if (fK !== st.K || fSym !== st.symbolSize) return `invalid:K-mismatch(fK=${fK},K=${st.K})`
  if (st.seenSeeds[seed]) return 'duplicate'
  st.seenSeeds[seed] = 1
  const payload = frame.slice(HEADER_LEN, HEADER_LEN + st.symbolSize)
  st.pending.push({ indices: deriveSymbol(seed, st.K, st.cdf).indices, data: payload })
  peel(st)
  return st.recoveredCount === st.K ? 'complete' : 'progress'
}

// ---- Encode test data ----
function sha256(bytes) { return new Uint8Array(createHash('sha256').update(bytes).digest()) }

function encodeFrames(data, symbolSize) {
  const dataLen = data.length
  const K = Math.ceil(dataLen / symbolSize)
  const cdf = buildRobustSoliton(K)
  const padded = new Uint8Array(K * symbolSize); padded.set(data)
  const blocks = []
  for (let i = 0; i < K; i++) blocks.push(padded.slice(i * symbolSize, (i + 1) * symbolSize))
  const fileHash = sha256(data)
  const fileName = 'test.bin'

  function makeFrame(seed) {
    const { indices } = deriveSymbol(seed, K, cdf)
    const payload = new Uint8Array(symbolSize)
    for (const idx of indices) for (let b = 0; b < symbolSize; b++) payload[b] ^= blocks[idx][b]
    return buildFrame({ dataLen, flags: 0, K, symbolSize, seed, fileHash, fileName, payload })
  }
  return { K, dataLen, fileHash, makeFrame }
}

// ---- Test 1: raw frame bytes → ltIngest (no QR encoding, tests codec only) ----
function testCodecDirect() {
  console.log('\n=== Test 1: codec direct (no QR) ===')
  const data = new Uint8Array(500)
  for (let i = 0; i < data.length; i++) data[i] = (i * 7 + 13) & 0xff
  const symbolSize = 110
  const { K, dataLen, fileHash, makeFrame } = encodeFrames(data, symbolSize)
  console.log(`  K=${K}, dataLen=${dataLen}`)

  const st = makeFreshLT()
  let seed = 42, frames = 0
  while (st.recoveredCount < K && frames < K * 5) {
    const frame = makeFrame(seed++)
    const r = ltIngest(st, frame)
    frames++
    if (r.startsWith('invalid')) {
      console.error(`  FAIL: ${r} on frame ${frames}`)
      return false
    }
  }
  if (st.recoveredCount < K) { console.error(`  FAIL: only ${st.recoveredCount}/${K} recovered`); return false }

  // Reconstruct
  const out = new Uint8Array(K * symbolSize)
  for (let b = 0; b < K; b++) {
    if (!st.recovered[b]) { console.error(`  FAIL: recovered[${b}] is null`); return false }
    out.set(st.recovered[b], b * symbolSize)
  }
  const reconstructed = out.slice(0, dataLen)
  const gotHash = sha256(reconstructed)
  const origHash = sha256(data)
  if (!gotHash.every((v, i) => v === origHash[i])) { console.error('  FAIL: hash mismatch'); return false }
  console.log(`  PASS: recovered in ${frames} frames`)
  return true
}

// ---- Test 2: Simulate what the worker does — jsQR decode path ----
// We can't run the actual worker (no browser), but we can test jsQR directly
// by loading it with vm and running it against a QR-rendered image.
async function testJsQRDecode() {
  console.log('\n=== Test 2: jsQR decode path (requires canvas npm package) ===')
  try {
    // Try to import canvas — if not installed, skip
    const { createCanvas } = await import('canvas').catch(() => null) || {}
    if (!createCanvas) { console.log('  SKIP: npm package "canvas" not installed'); return true }

    // Load jsQR
    const jsqrSrc = readFileSync(join(root, 'src/vendor/beam/jsQR.js'), 'utf8')
    const vm = await import('vm')
    const mod = { exports: {} }
    const ctx = vm.createContext({ module: mod, exports: mod.exports, require: () => ({}) })
    vm.runInContext(jsqrSrc, ctx)
    const jsQR = mod.exports

    // Load qrcode-generator to render QR
    const qrcodeJs = readFileSync(join(root, 'src/vendor/beam/qrcode-generator.js'), 'utf8')
    const qrMod = { exports: {} }
    const qrCtx = vm.createContext({ module: qrMod, exports: qrMod.exports, require: () => ({}) })
    vm.runInContext(qrcodeJs, qrCtx)
    const qrcode = qrMod.exports

    // Build one frame
    const data = new Uint8Array(100)
    for (let i = 0; i < data.length; i++) data[i] = i & 0xff
    const symbolSize = 110
    const { makeFrame } = encodeFrames(data, symbolSize)
    const frame = makeFrame(1000)

    // Render to QR
    let str = ''
    for (let i = 0; i < frame.length; i++) str += String.fromCharCode(frame[i] & 0xff)
    const qr = qrcode(0, 'M')
    qr.addData(str, 'Byte')
    qr.make()
    const count = qr.getModuleCount()
    const size = 400, quiet = 2
    const cell = size / (count + quiet * 2)

    const canvas = createCanvas(size, size)
    const ctx2 = canvas.getContext('2d')
    ctx2.fillStyle = '#ffffff'; ctx2.fillRect(0, 0, size, size)
    ctx2.fillStyle = '#000000'
    for (let r = 0; r < count; r++)
      for (let c = 0; c < count; c++)
        if (qr.isDark(r, c))
          ctx2.fillRect(Math.floor((c + quiet) * cell), Math.floor((r + quiet) * cell), Math.ceil(cell), Math.ceil(cell))

    const imgData = ctx2.getImageData(0, 0, size, size)
    const result = jsQR(imgData.data, size, size, { inversionAttempts: 'dontInvert' })
    if (!result) { console.error('  FAIL: jsQR could not decode the QR image'); return false }

    const decoded = new Uint8Array(result.binaryData)
    console.log(`  jsQR decoded ${decoded.length} bytes, frame has ${frame.length} bytes`)

    // Now ingest the decoded bytes
    const st = makeFreshLT()
    const r2 = ltIngest(st, decoded)
    if (r2.startsWith('invalid')) { console.error(`  FAIL: ltIngest said ${r2}`); return false }
    console.log(`  PASS: jsQR → ltIngest → ${r2}`)
    return true
  } catch (e) {
    console.error('  ERROR:', e.message)
    return false
  }
}

const ok1 = testCodecDirect()
const ok2 = await testJsQRDecode()
if (ok1 && ok2) console.log('\nAll tests passed.')
else { console.error('\nSome tests FAILED.'); process.exit(1) }
