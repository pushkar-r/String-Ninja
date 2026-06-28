/**
 * Full roundtrip: encode file → QR images → jsQR decode → LT decode → verify hash.
 * This replicates exactly what the browser does, end to end.
 */
import { createHash } from 'crypto'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import vm from 'vm'

const __dir = dirname(fileURLToPath(import.meta.url))
const root = join(__dir, '..')

const MAGIC = 0x534e, VERSION = 1, HEADER_LEN = 80
const CRC32_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0 }
  return t
})()
const crc32 = (buf, s = 0, e = buf.length) => { let c = -1; for (let i = s; i < e; i++) c = (c >>> 8) ^ CRC32_TABLE[(c ^ buf[i]) & 0xff]; return (c ^ -1) >>> 0 }
const sha256 = b => new Uint8Array(createHash('sha256').update(b).digest())
const mulberry32 = a => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }

function buildRobustSoliton(K) {
  const c = 0.03, delta = 0.05, rho = new Float64Array(K + 1)
  rho[1] = 1 / K; for (let d = 2; d <= K; d++) rho[d] = 1 / (d * (d - 1))
  const R = c * Math.log(K / delta) * Math.sqrt(K), tau = new Float64Array(K + 1), kR = Math.max(1, Math.floor(K / R))
  for (let d = 1; d < kR; d++) tau[d] = R / (d * K); if (kR <= K) tau[kR] = (R * Math.log(R / delta)) / K
  let sum = 0; for (let d = 1; d <= K; d++) sum += rho[d] + tau[d]
  const cdf = new Float64Array(K + 1); let acc = 0; for (let d = 1; d <= K; d++) { acc += (rho[d] + tau[d]) / sum; cdf[d] = acc }
  return cdf
}
function deriveSymbol(seed, K, cdf) {
  const rand = mulberry32(seed >>> 0), r = rand(); let degree = 1
  for (let d = 1; d <= K; d++) { if (r <= cdf[d]) { degree = d; break }; degree = d }
  if (degree > K) degree = K; const chosen = new Set()
  while (chosen.size < degree) chosen.add(Math.floor(rand() * K) % K)
  return { degree, indices: Array.from(chosen) }
}
function buildFrame({ dataLen, flags, K, symbolSize, seed, fileHash, fileName, payload }) {
  const total = HEADER_LEN + symbolSize + 4, buf = new Uint8Array(total), dv = new DataView(buf.buffer)
  dv.setUint16(0, MAGIC, true); buf[2] = VERSION; buf[3] = flags
  dv.setUint32(4, dataLen >>> 0, true); dv.setUint16(8, K, true); dv.setUint16(10, symbolSize, true); dv.setUint32(12, seed >>> 0, true)
  buf.set(fileHash.subarray(0, 32), 16)
  const nb = new TextEncoder().encode(fileName).subarray(0, 31); buf[48] = nb.length; buf.set(nb, 49)
  buf.set(payload.subarray(0, symbolSize), HEADER_LEN)
  dv.setUint32(HEADER_LEN + symbolSize, crc32(buf, 0, HEADER_LEN + symbolSize) >>> 0, true)
  return buf
}
function makeFreshLT() {
  return { K: 0, symbolSize: 0, dataLen: 0, flags: 0, fileHashHex: '', fileName: '', cdf: null, recovered: [], recoveredCount: 0, pending: [], seenSeeds: {}, started: false }
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
  if (frame.length < HEADER_LEN + 1 + 4) return `invalid:short(${frame.length})`
  const dv = new DataView(frame.buffer, frame.byteOffset, frame.byteLength)
  const magic = dv.getUint16(0, true)
  if (magic !== MAGIC) return `invalid:magic(${magic.toString(16)})`
  const fK = dv.getUint16(8, true), fSym = dv.getUint16(10, true)
  if (frame.length < HEADER_LEN + fSym + 4) return `invalid:payload`
  const gotCrc = dv.getUint32(HEADER_LEN + fSym, true) >>> 0
  if (gotCrc !== crc32(frame, 0, HEADER_LEN + fSym)) return `invalid:crc`
  const seed = dv.getUint32(12, true) >>> 0
  if (!st.started) {
    st.K = fK; st.symbolSize = fSym; st.dataLen = dv.getUint32(4, true) >>> 0; st.flags = frame[3]
    const fh = frame.subarray(16, 48); let hx = ''; for (let i = 0; i < 32; i++) hx += fh[i].toString(16).padStart(2, '0')
    st.fileHashHex = hx
    const nameLen = Math.min(frame[48] || 0, 31)
    try { st.fileName = new TextDecoder().decode(frame.subarray(49, 49 + nameLen)) } catch { st.fileName = 'unknown' }
    st.cdf = buildRobustSoliton(fK); st.recovered = new Array(fK).fill(null); st.started = true
  }
  if (fK !== st.K || fSym !== st.symbolSize) return `invalid:mismatch`
  if (st.seenSeeds[seed]) return 'duplicate'
  st.seenSeeds[seed] = 1
  const payload = frame.slice(HEADER_LEN, HEADER_LEN + st.symbolSize)
  st.pending.push({ indices: deriveSymbol(seed, st.K, st.cdf).indices, data: payload })
  peel(st)
  return st.recoveredCount === st.K ? 'complete' : 'progress'
}

// ---- load jsQR and qrcode-generator via vm ----
function loadModule(path) {
  const src = readFileSync(path, 'utf8')
  const mod = { exports: {} }
  const ctx = vm.createContext({ module: mod, exports: mod.exports, self: {}, require: () => ({}) })
  vm.runInContext(`(function(module,exports){${src}})(module,exports)`, ctx)
  return mod.exports
}

const { createCanvas } = await import('canvas')
const jsQR = loadModule(join(root, 'src/vendor/beam/jsQR.js'))
const qrcode = loadModule(join(root, 'src/vendor/beam/qrcode-generator.js'))

if (!jsQR || typeof jsQR !== 'function') throw new Error('jsQR failed to load: ' + typeof jsQR)
if (!qrcode || typeof qrcode !== 'function') throw new Error('qrcode failed to load: ' + typeof qrcode)
console.log('Libraries loaded OK')

function renderFrameToImageData(frame, size = 400) {
  let str = ''
  for (let i = 0; i < frame.length; i++) str += String.fromCharCode(frame[i] & 0xff)
  const qr = qrcode(0, 'M')
  qr.addData(str, 'Byte')
  qr.make()
  const count = qr.getModuleCount(), quiet = 2, cell = size / (count + quiet * 2)
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, size, size)
  ctx.fillStyle = '#000000'
  for (let r = 0; r < count; r++)
    for (let c = 0; c < count; c++)
      if (qr.isDark(r, c))
        ctx.fillRect(Math.floor((c + quiet) * cell), Math.floor((r + quiet) * cell), Math.ceil(cell), Math.ceil(cell))
  return ctx.getImageData(0, 0, size, size)
}

async function runFullRound(label, dataSize, symbolSize, qrSize = 400) {
  console.log(`\n=== ${label} ===`)
  const data = new Uint8Array(dataSize)
  for (let i = 0; i < dataSize; i++) data[i] = (i * 13 + 7) & 0xff
  const fileHash = sha256(data)
  const K = Math.ceil(dataSize / symbolSize)
  const cdf = buildRobustSoliton(K)
  const padded = new Uint8Array(K * symbolSize); padded.set(data)
  const blocks = []; for (let i = 0; i < K; i++) blocks.push(padded.slice(i * symbolSize, (i + 1) * symbolSize))
  console.log(`  K=${K}, symbolSize=${symbolSize}, frameSize=${HEADER_LEN + symbolSize + 4}`)

  const st = makeFreshLT()
  let seed = 1, framesTotal = 0, framesDecoded = 0, framesInvalid = 0

  while (st.recoveredCount < K) {
    // Encode frame
    const { indices } = deriveSymbol(seed, K, cdf)
    const payload = new Uint8Array(symbolSize)
    for (const idx of indices) for (let b = 0; b < symbolSize; b++) payload[b] ^= blocks[idx][b]
    const frame = buildFrame({ dataLen: dataSize, flags: 0, K, symbolSize, seed, fileHash, fileName: 'test.bin', payload })

    // Render to QR image
    const imgData = renderFrameToImageData(frame, qrSize)

    // Decode with jsQR (exactly as the worker does)
    const result = jsQR(imgData.data, qrSize, qrSize, { inversionAttempts: 'dontInvert' })
    framesTotal++

    if (!result || !result.binaryData || !result.binaryData.length) {
      console.error(`  Frame ${seed}: jsQR failed to decode!`)
      framesInvalid++
      seed++
      if (framesInvalid > 5) { console.error('  Too many decode failures, aborting'); process.exit(1) }
      continue
    }

    const decoded = new Uint8Array(result.binaryData)
    const ingestResult = ltIngest(st, decoded)
    if (ingestResult.startsWith('invalid')) {
      console.error(`  Frame ${seed}: ltIngest returned "${ingestResult}" (decoded ${decoded.length} bytes, frame ${frame.length} bytes)`)
      console.error(`  decoded[0..3]: ${Array.from(decoded.slice(0,4)).map(b=>b.toString(16).padStart(2,'0')).join(' ')}`)
      console.error(`  frame[0..3]:   ${Array.from(frame.slice(0,4)).map(b=>b.toString(16).padStart(2,'0')).join(' ')}`)
      framesInvalid++
      seed++
      if (framesInvalid > 3) { console.error('  Too many invalid frames, aborting'); process.exit(1) }
      continue
    }
    framesDecoded++
    seed++

    if (framesTotal <= 3 || st.recoveredCount === K) {
      process.stdout.write(`  Frame ${framesTotal}: decoded=${decoded.length}B ingest=${ingestResult} recovered=${st.recoveredCount}/${K}\n`)
    }

    if (framesTotal > K * 6) { console.error('  Too many frames needed, aborting'); process.exit(1) }
  }

  // Reconstruct
  const out = new Uint8Array(K * symbolSize)
  for (let b = 0; b < K; b++) {
    if (!st.recovered[b]) { console.error(`  FAIL: recovered[${b}] null`); process.exit(1) }
    out.set(st.recovered[b], b * symbolSize)
  }
  const reconstructed = out.slice(0, dataSize)
  const gotHash = sha256(reconstructed)
  const match = gotHash.every((v, i) => v === fileHash[i])
  if (!match) { console.error('  FAIL: hash mismatch'); process.exit(1) }
  console.log(`  PASS in ${framesTotal} frames (${framesInvalid} decode failures, overhead ${((framesTotal / K - 1) * 100).toFixed(1)}%)`)
}

await runFullRound('small file  sym=110 size=400px', 500,   110, 400)
await runFullRound('medium file sym=187 size=400px', 2000,  187, 400)
await runFullRound('small file  sym=110 size=640px', 500,   110, 640)
await runFullRound('medium file sym=187 size=640px', 2000,  187, 640)

console.log('\nAll roundtrip tests passed.')
