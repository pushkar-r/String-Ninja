\
  // Minimal JWT verification helpers.
  // HS256 verification (HMAC-SHA256) using SubtleCrypto
  // RS256 verification (RSA SHA-256) by importing a PEM public key

  function base64urlToUint8Array(s: string) {
    s = s.replace(/-/g,'+').replace(/_/g,'/')
    while (s.length % 4) s += '='
    const raw = atob(s)
    const arr = new Uint8Array(raw.length)
    for (let i=0;i<raw.length;i++) arr[i] = raw.charCodeAt(i)
    return arr
  }

  export async function verifyHS256(token: string, secret: string) {
    try {
      const [h,p,s] = token.split('.')
      const algoText = JSON.parse(decodeURIComponent(escape(atob(h.replace(/-/g,'+').replace(/_/g,'/'))))).alg || ''
      if (!algoText.includes('HS')) return false
      const encoder = new TextEncoder()
      const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify'])
      const data = new TextEncoder().encode(h + '.' + p)
      const sig = base64urlToUint8Array(s)
      const ok = await crypto.subtle.verify('HMAC', key, sig, data)
      return ok
    } catch { return false }
  }

  export async function verifyRS256(token: string, pemPublicKey: string) {
    try {
      const [h,p,s] = token.split('.')
      const rawKey = pemPublicKey.replace('-----BEGIN PUBLIC KEY-----','').replace('-----END PUBLIC KEY-----','').replace(/\s+/g,'')
      const bin = Uint8Array.from(atob(rawKey), c=>c.charCodeAt(0))
      const key = await crypto.subtle.importKey('spki', bin.buffer, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify'])
      const data = new TextEncoder().encode(h + '.' + p)
      const sig = base64urlToUint8Array(s)
      const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, sig, data)
      return ok
    } catch { return false }
  }
