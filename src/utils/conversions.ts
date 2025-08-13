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
export function textToBinary(str: string): string {
  return Array.from(new TextEncoder().encode(str)).map(b => b.toString(2).padStart(8,'0')).join(' ')
}
export function binaryToText(bin: string): string {
  try {
    const bytes = new Uint8Array(bin.trim().split(/\s+/).map(b => parseInt(b,2)))
    return new TextDecoder().decode(bytes)
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
