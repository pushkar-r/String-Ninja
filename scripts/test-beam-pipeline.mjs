/**
 * Standalone test for the Beam encode/decode pipeline.
 * Runs entirely in Node — no camera, no workers, no browser.
 * Tests that ltIngest correctly recovers a file from LT-encoded frames.
 */

// ---- constants (must match Beam.tsx) ----
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

// ---- PRNG + Robust Soliton ----
function mulberry32(a) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function buildRobustSoliton(K) {
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

function deriveSymbol(seed, K, cdf) {
  const rand = mulberry32(seed >>> 0)
  const r = rand()
  let degree = 1
  for (let d = 1; d <= K; d++) { if (r <= cdf[d]) { degree = d; break }; degree = d }
  if (degree > K) degree = K
  const chosen = new Set()
  while (chosen.size < degree) chosen.add(Math.floor(rand() * K) % K)
  return { degree, indices: Array.from(chosen) }
}

// ---- Frame builder (mirrors buildFrame in Beam.tsx) ----
function buildFrame({ dataLen, flags, K, symbolSize, seed, fileHash, fileName, payload }) {
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

// ---- LT encoder (mirrors SendPanel encode logic) ----
function encodeFile(data, symbolSize, fileHash, fileName) {
  const dataLen = data.length
  const K = Math.ceil(dataLen / symbolSize)
  const cdf = buildRobustSoliton(K)
  const padded = new Uint8Array(K * symbolSize)
  padded.set(data)
  const flags = 0 // no gzip for test

  // Pre-compute source blocks
  const blocks = []
  for (let i = 0; i < K; i++) blocks.push(padded.slice(i * symbolSize, (i + 1) * symbolSize))

  // Generate N encoded frames (fountain: seed-driven XOR combos)
  function makeFrame(seed) {
    const { indices } = deriveSymbol(seed, K, cdf)
    const payload = new Uint8Array(symbolSize)
    for (const idx of indices) {
      for (let b = 0; b < symbolSize; b++) payload[b] ^= blocks[idx][b]
    }
    return buildFrame({ dataLen, flags, K, symbolSize, seed, fileHash, fileName, payload })
  }

  return { K, makeFrame, dataLen }
}

// ---- LT decoder (mirrors ltIngest + peelMain in Beam.tsx) ----
function makeFreshLT() {
  return {
    K: 0, symbolSize: 0, dataLen: 0, flags: 0,
    fileHashHex: '', fileName: '',
    cdf: null,
    recovered: [],
    recoveredCount: 0,
    pending: [],
    seenSeeds: {},
    started: false,
    lastSaveCount: 0,
  }
}

function xorInto(dst, src) {
  for (let i = 0; i < dst.length; i++) dst[i] ^= src[i]
}

function peel(st) {
  let progressed = true
  while (progressed) {
    progressed = false
    for (let p = 0; p < st.pending.length; p++) {
      const blk = st.pending[p]
      if (!blk) continue
      // XOR out any already-recovered blocks
      for (let qi = blk.indices.length - 1; qi >= 0; qi--) {
        const ix = blk.indices[qi]
        if (st.recovered[ix]) { xorInto(blk.data, st.recovered[ix]); blk.indices.splice(qi, 1) }
      }
      // If degree=1 remaining, we can recover it
      if (blk.indices.length === 1) {
        const ix = blk.indices[0]
        if (!st.recovered[ix]) { st.recovered[ix] = blk.data.slice(); st.recoveredCount++; progressed = true }
        st.pending[p] = null
      } else if (blk.indices.length === 0) { st.pending[p] = null }
    }
  }
}

function ltIngest(st, frame) {
  if (frame.length < HEADER_LEN + 1 + 4) return 'invalid:too-short'
  const dv = new DataView(frame.buffer, frame.byteOffset, frame.byteLength)
  if (dv.getUint16(0, true) !== MAGIC) return `invalid:bad-magic ${dv.getUint16(0,true).toString(16)} expected ${MAGIC.toString(16)}`
  const fK = dv.getUint16(8, true), fSym = dv.getUint16(10, true)
  if (frame.length < HEADER_LEN + fSym + 4) return 'invalid:too-short-for-payload'
  const gotCrc = dv.getUint32(HEADER_LEN + fSym, true) >>> 0
  const expCrc = crc32(frame, 0, HEADER_LEN + fSym)
  if (gotCrc !== expCrc) return `invalid:crc got=${gotCrc} exp=${expCrc}`
  const seed = dv.getUint32(12, true) >>> 0
  if (!st.started) {
    st.K = fK; st.symbolSize = fSym; st.dataLen = dv.getUint32(4, true) >>> 0; st.flags = frame[3]
    const fh = frame.subarray(16, 48); let hx = ''
    for (let i = 0; i < 32; i++) hx += fh[i].toString(16).padStart(2, '0')
    st.fileHashHex = hx
    const nameLen = Math.min(frame[48] || 0, 31)
    try { st.fileName = new TextDecoder().decode(frame.subarray(49, 49 + nameLen)) } catch { st.fileName = 'unknown' }
    st.cdf = buildRobustSoliton(fK)
    st.recovered = new Array(fK).fill(null)
    st.started = true
  }
  if (fK !== st.K || fSym !== st.symbolSize) return 'invalid:K-or-sym-mismatch'
  if (st.seenSeeds[seed]) return 'duplicate'
  st.seenSeeds[seed] = 1
  const payload = frame.slice(HEADER_LEN, HEADER_LEN + st.symbolSize)
  st.pending.push({ indices: deriveSymbol(seed, st.K, st.cdf).indices, data: payload })
  peel(st)
  return st.recoveredCount === st.K ? 'complete' : 'progress'
}

// ---- sha256 via Node crypto ----
import { createHash } from 'crypto'
function sha256(bytes) {
  return createHash('sha256').update(bytes).digest()
}

// ---- TEST ----
function runTest(label, dataSize, symbolSize) {
  console.log(`\n=== ${label} (data=${dataSize}B, sym=${symbolSize}B) ===`)

  // Make dummy data
  const data = new Uint8Array(dataSize)
  for (let i = 0; i < dataSize; i++) data[i] = i & 0xff
  const fileHash = new Uint8Array(sha256(data))
  const fileHashHex = Array.from(fileHash).map(b => b.toString(16).padStart(2,'0')).join('')

  const { K, makeFrame, dataLen } = encodeFile(data, symbolSize, fileHash, 'test.bin')
  console.log(`  K=${K}, dataLen=${dataLen}`)

  const st = makeFreshLT()
  let framesUsed = 0
  let seed = 1000

  // Feed frames until complete (fountain: keep generating)
  const MAX_FRAMES = K * 5
  while (st.recoveredCount < st.K && framesUsed < MAX_FRAMES) {
    const frame = makeFrame(seed++)
    const result = ltIngest(st, frame)
    framesUsed++
    if (typeof result === 'string' && result.startsWith('invalid')) {
      console.error(`  FATAL: ltIngest returned "${result}" on frame ${framesUsed}`)
      console.error(`  frame[0..4] = ${Array.from(frame.slice(0,4)).map(b=>b.toString(16).padStart(2,'0')).join(' ')}`)
      console.error(`  frame.length=${frame.length}, HEADER_LEN=${HEADER_LEN}, fSym=${symbolSize}`)
      process.exit(1)
    }
  }

  if (st.recoveredCount < st.K) {
    console.error(`  FAIL: only recovered ${st.recoveredCount}/${st.K} blocks after ${framesUsed} frames`)
    process.exit(1)
  }

  // Reconstruct
  const out = new Uint8Array(K * symbolSize)
  for (let b = 0; b < K; b++) out.set(st.recovered[b], b * symbolSize)
  const reconstructed = out.slice(0, dataLen)
  const gotHash = Array.from(sha256(reconstructed)).map(b => b.toString(16).padStart(2,'0')).join('')

  if (gotHash !== fileHashHex) {
    console.error(`  FAIL: hash mismatch\n  got: ${gotHash}\n  exp: ${fileHashHex}`)
    process.exit(1)
  }

  console.log(`  OK: recovered in ${framesUsed} frames (overhead ${((framesUsed/K - 1)*100).toFixed(1)}%)`)
}

runTest('tiny file',    100,  110)
runTest('small file',  1000, 110)
runTest('medium file', 5000, 187)
runTest('large file',  50000, 292)

console.log('\nAll tests passed.')
