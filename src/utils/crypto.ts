import CryptoJS from 'crypto-js'

export function hashString(input: string, algo: 'MD5' | 'SHA1' | 'SHA256' | 'SHA512' = 'SHA256') {
  switch (algo) {
    case 'MD5': return CryptoJS.MD5(input).toString()
    case 'SHA1': return CryptoJS.SHA1(input).toString()
    case 'SHA256': return CryptoJS.SHA256(input).toString()
    case 'SHA512': return CryptoJS.SHA512(input).toString()
  }
}

export async function aesEncrypt(plainText: string, password: string): Promise<string> {
  const enc = new TextEncoder()
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveKey'])
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
  const cipherBuffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plainText))
  const pack = new Uint8Array(salt.length + iv.length + cipherBuffer.byteLength)
  pack.set(salt, 0)
  pack.set(iv, salt.length)
  pack.set(new Uint8Array(cipherBuffer), salt.length + iv.length)
  return btoa(String.fromCharCode(...pack))
}

export async function aesDecrypt(payloadB64: string, password: string): Promise<string> {
  const all = Uint8Array.from(atob(payloadB64), c => c.charCodeAt(0))
  const salt = all.slice(0, 16)
  const iv = all.slice(16, 28)
  const data = all.slice(28)
  const enc = new TextEncoder()
  const dec = new TextDecoder()
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveKey'])
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data)
  return dec.decode(plain)
}

export function jwtDecode(token: string): { header: any; payload: any } | null {
  try {
    const [h, p] = token.split('.')
    const base64urlToStr = (s: string)=> decodeURIComponent(escape(atob(s.replace(/-/g,'+').replace(/_/g,'/'))))
    return { header: JSON.parse(base64urlToStr(h)), payload: JSON.parse(base64urlToStr(p)) }
  } catch {
    return null
  }
}
