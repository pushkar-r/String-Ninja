import base32 from 'hi-base32'

export function textToHex(str: string): string {
  return Array.from(new TextEncoder().encode(str)).map(b => b.toString(16).padStart(2,'0')).join('')
}
export function hexToText(hex: string): string {
  try {
    const bytes = new Uint8Array(hex.replace(/\s+/g,'').match(/.{1,2}/g)!.map(h => parseInt(h, 16)))
    return new TextDecoder().decode(bytes)
  } catch { return 'Invalid hex' }
}
export function hexToBinary(hex: string): string {
  try {
    const clean = hex.replace(/\s+/g,'')
    if (clean.length % 2 !== 0) throw new Error('odd length')
    const bytes = clean.match(/.{1,2}/g)!.map(h => {
      const v = parseInt(h, 16)
      if (Number.isNaN(v)) throw new Error('NaN')
      return v
    })
    return bytes.map(b => b.toString(2).padStart(8,'0')).join(' ')
  } catch { return 'Invalid hex' }
}
export function textToBinary(str: string): string {
  return Array.from(new TextEncoder().encode(str)).map(b => b.toString(2).padStart(8,'0')).join(' ')
}
export function binaryToText(bin: string): string {
  try {
    const bytes = new Uint8Array(bin.trim().split(/\s+/).map(b => parseInt(b,2)))
    return new TextDecoder().decode(bytes)
  } catch { return 'Invalid binary' }
}
export function binaryToHex(bin: string): string {
  try {
    const tokens = bin.trim().split(/\s+/).filter(Boolean)
    if (tokens.length === 0) return ''
    const bytes = tokens.map(b => {
      if (!/^[01]+$/.test(b)) throw new Error('invalid bit')
      const v = parseInt(b, 2)
      if (Number.isNaN(v)) throw new Error('NaN')
      return v
    })
    return bytes.map(b => b.toString(16).padStart(2,'0')).join(' ')
  } catch { return 'Invalid binary' }
}
export function base32Encode(s: string): string {
  return base32.encode(s)
}
export function base32Decode(s: string): string {
  try { return base32.decode(s) } catch { return 'Invalid Base32' }
}
export function htmlEncode(s: string): string {
  const div = document.createElement('div')
  div.innerText = s
  return div.innerHTML
}
export function htmlDecode(s: string): string {
  const div = document.createElement('div')
  div.innerHTML = s
  return div.textContent || ''
}

export function rotN(s: string, n: number): string {
  return s.replace(/[A-Za-z]/g, c => {
    const base = c <= 'Z' ? 65 : 97
    return String.fromCharCode((c.charCodeAt(0) - base + n) % 26 + base)
  })
}

// Base58 (Bitcoin alphabet)
const B58_ALPH = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
export function base58Encode(str: string): string {
  try {
    const bytes = new TextEncoder().encode(str)
    if (bytes.length === 0) return ''
    let bi = 0n
    for (const b of bytes) bi = (bi << 8n) + BigInt(b)
    let out = ''
    while (bi > 0n) { const rem = bi % 58n; out = B58_ALPH[Number(rem)] + out; bi = bi / 58n }
    let leadingZeros = 0
    for (const b of bytes) { if (b === 0) leadingZeros++; else break }
    return '1'.repeat(leadingZeros) + (out || '1')
  } catch { return 'Invalid input' }
}
export function base58Decode(s: string): string {
  try {
    if (!s) return ''
    let bi = 0n
    for (const ch of s) {
      const idx = B58_ALPH.indexOf(ch)
      if (idx < 0) throw new Error('bad char')
      bi = bi * 58n + BigInt(idx)
    }
    const bytes: number[] = []
    while (bi > 0n) { bytes.push(Number(bi % 256n)); bi = bi / 256n }
    bytes.reverse()
    let leadingZeros = 0
    for (const ch of s) { if (ch === '1') leadingZeros++; else break }
    const out = new Uint8Array(leadingZeros + bytes.length)
    for (let i=0;i<bytes.length;i++) out[leadingZeros+i] = bytes[i]
    return new TextDecoder().decode(out)
  } catch { return 'Invalid Base58' }
}

// Ascii85 (Base85) minimal implementation (no <~ ~> wrappers)
export function ascii85Encode(str: string): string {
  try {
    const data = new TextEncoder().encode(str)
    let out = ''
    for (let i = 0; i < data.length; i += 4) {
      const a = data[i] || 0, b = data[i+1] || 0, c = data[i+2] || 0, d = data[i+3] || 0
      const len = Math.min(4, data.length - i)
      const num = ((a<<24)>>>0) + (b<<16) + (c<<8) + d
      if (len === 4 && num === 0) { out += 'z'; continue }
      let div = num >>> 0
      const vals = new Array(5).fill(0)
      for (let k=4;k>=0;k--){ vals[k] = div % 85; div = Math.floor(div/85) }
      const emit = len + 1 // emit 5 for full, else 2..4 for partial
      for (let k=0;k<emit;k++){ out += String.fromCharCode(33 + vals[k]) }
    }
    return out
  } catch { return 'Invalid input' }
}
export function ascii85Decode(s: string): string {
  try {
    const clean = s.replace(/\s+/g,'')
    const out: number[] = []
    for (let i=0;i<clean.length;){
      if (clean[i] === 'z'){ out.push(0,0,0,0); i++; continue }
      const chunk = clean.slice(i, i+5)
      const pad = 5 - chunk.length
      const padded = chunk + 'u'.repeat(pad)
      let num = 0
      for (let k=0;k<5;k++){
        const v = padded.charCodeAt(k) - 33
        if (v < 0 || v > 84) throw new Error('range')
        num = num * 85 + v
      }
      const bytes = [ (num>>>24)&255, (num>>>16)&255, (num>>>8)&255, num&255 ]
      const take = pad ? (4 - pad) : 4
      for (let t=0;t<take;t++) out.push(bytes[t])
      i += chunk.length
    }
    return new TextDecoder().decode(new Uint8Array(out))
  } catch { return 'Invalid Ascii85' }
}

// UTF-16 encode/decode (hex)
export function utf16ToHex(str: string, endian: 'LE'|'BE'='LE'): string {
  try {
    const parts: string[] = []
    for (let i=0;i<str.length;i++){
      const cu = str.charCodeAt(i)
      const hi = (cu >> 8) & 0xff
      const lo = cu & 0xff
      const b1 = endian==='LE'? lo: hi
      const b2 = endian==='LE'? hi: lo
      parts.push(b1.toString(16).padStart(2,'0'))
      parts.push(b2.toString(16).padStart(2,'0'))
    }
    return parts.join('')
  } catch { return 'Invalid input' }
}
export function hexToUtf16(hex: string, endian: 'LE'|'BE'='LE'): string {
  try {
    const clean = hex.replace(/\s+/g,'')
    if (clean.length % 4 !== 0) throw new Error('len')
    let out = ''
    for (let i=0;i<clean.length;i+=4){
      const b1 = parseInt(clean.slice(i, i+2), 16)
      const b2 = parseInt(clean.slice(i+2, i+4), 16)
      const cu = endian==='LE'? (b1 | (b2<<8)) : (b2 | (b1<<8))
      out += String.fromCharCode(cu)
    }
    return out
  } catch { return 'Invalid hex' }
}

// UTF-32 encode/decode (hex)
export function utf32ToHex(str: string, endian: 'LE'|'BE'='LE'): string {
  try {
    const parts: string[] = []
    for (const ch of Array.from(str)){
      const cp = ch.codePointAt(0)!
      const b = [ (cp>>>24)&255, (cp>>>16)&255, (cp>>>8)&255, cp&255 ]
      const order = endian==='LE'? [3,2,1,0] : [0,1,2,3]
      for (const idx of order){ parts.push(b[idx].toString(16).padStart(2,'0')) }
    }
    return parts.join('')
  } catch { return 'Invalid input' }
}
export function hexToUtf32(hex: string, endian: 'LE'|'BE'='LE'): string {
  try {
    const clean = hex.replace(/\s+/g,'')
    if (clean.length % 8 !== 0) throw new Error('len')
    let out = ''
    for (let i=0;i<clean.length;i+=8){
      const b = [
        parseInt(clean.slice(i, i+2), 16),
        parseInt(clean.slice(i+2, i+4), 16),
        parseInt(clean.slice(i+4, i+6), 16),
        parseInt(clean.slice(i+6, i+8), 16),
      ]
      const order = endian==='LE'? [3,2,1,0] : [0,1,2,3]
      const cp = (b[order[0]]<<24) | (b[order[1]]<<16) | (b[order[2]]<<8) | b[order[3]]
      out += String.fromCodePoint(cp >>> 0)
    }
    return out
  } catch { return 'Invalid hex' }
}
