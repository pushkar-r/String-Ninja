// SAML response decoding helpers
// - Base64 decode SAMLResponse
// - HTTP-Redirect binding (deflate+base64) decode support
// Note: This provides textual XML output. Complex validation or XML signature verification is out of scope.

import { inflateRaw } from 'pako'

function base64ToUint8(b64: string){
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i=0;i<bin.length;i++) out[i] = bin.charCodeAt(i)
  return out
}
function uint8ToString(u8: Uint8Array){
  try { return new TextDecoder().decode(u8) } catch { return String.fromCharCode(...Array.from(u8)) }
}
function base64ToString(b64: string){
  try { return decodeURIComponent(escape(atob(b64))) } catch { return atob(b64) }
}

export function decodeSAMLResponse(b64: string): string {
  try {
    const xml = base64ToString(b64)
    if (/^\s*<\?xml|^\s*<samlp:Response|^\s*<Response/.test(xml)) return xml
    return xml
  } catch (e) {
    return 'Invalid SAML (Base64)'
  }
}

export function decodeSAMLRedirect(paramValue: string): string {
  try {
    // paramValue may be URL-encoded; decode it first
    const urlDecoded = decodeURIComponent(paramValue)
    const raw = base64ToUint8(urlDecoded)
    const inflated = inflateRaw(raw)
    return uint8ToString(inflated)
  } catch {
    return 'Invalid SAML (Redirect binding)'
  }
}
