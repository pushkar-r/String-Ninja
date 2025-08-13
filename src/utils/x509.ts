// Minimal X.509 reader: extracts basic fields from a PEM/DER certificate for display.
// Note: This is a simplified decoder: it tries to parse ASN.1 to get Subject, Issuer,
// Validity, and public key algorithm. For full validation/coverage, use a dedicated X.509 lib.

function b64ToUint8(s: string) {
  const bin = atob(s)
  const out = new Uint8Array(bin.length)
  for (let i=0;i<bin.length;i++) out[i] = bin.charCodeAt(i)
  return out
}
export function pemToDer(pem: string): Uint8Array {
  const body = pem.replace(/-----BEGIN [^-]+-----/g,'').replace(/-----END [^-]+-----/g,'').replace(/\s+/g,'')
  return b64ToUint8(body)
}

// Poor-man ASN.1 DER reader for SEQUENCEs and primitive strings/integers/time.
// Returns a nested object structure for inspection.
export function parseAsn1(bytes: Uint8Array, offset=0): any {
  function readLen(i: number){
    let len = bytes[i++]
    if ((len & 0x80) === 0) return { len, i }
    const n = len & 0x7f
    len = 0
    for (let j=0;j<n;j++) len = (len<<8) | bytes[i++]
    return { len, i }
  }
  const tag = bytes[offset++]
  const { len, i } = readLen(offset)
  const start = i
  const end = i + len
  if ((tag & 0x20) === 0x20) {
    // constructed
    const items: any[] = []
    let j = start
    while (j < end) {
      const item = parseAsn1(bytes, j)
      items.push(item.node)
      j = item.next
    }
    return { node: { tag, len, constructed: true, items }, next: end }
  } else {
    const content = bytes.slice(start, end)
    return { node: { tag, len, constructed: false, content }, next: end }
  }
}

function findTbsCertificate(root: any){
  // Certificate ::= SEQUENCE { tbsCertificate, signatureAlgorithm, signatureValue }
  // tbsCertificate is the first item of the root sequence
  if (!root.constructed || !root.items?.length) return null
  return root.items[0]
}

function asPrintableString(node: any){
  if (!node || node.constructed) return ''
  try { return new TextDecoder().decode(node.content) } catch { return '' }
}

function parseName(node: any){
  // Name ::= SEQUENCE of RDNSequence; RDN ::= SET OF AttributeTypeAndValue ::= SEQUENCE { oid, value }
  const atts: Record<string,string> = {}
  if (!node?.constructed) return atts
  for (const rdn of node.items || []){
    if (!rdn?.constructed) continue
    for (const atv of rdn.items || []){
      if (!atv?.constructed || atv.items.length < 2) continue
      const oid = oidToString(atv.items[0])
      const val = asPrintableString(atv.items[1])
      if (oid) atts[oid] = val
    }
  }
  return atts
}

function oidToString(node: any){
  if (!node || node.constructed) return ''
  const b = node.content
  if (!b?.length) return ''
  const first = Math.floor(b[0] / 40)
  const second = b[0] % 40
  const parts = [first, second]
  let val = 0
  for (let i=1;i<b.length;i++){
    val = (val << 7) | (b[i] & 0x7f)
    if ((b[i] & 0x80) === 0) { parts.push(val); val = 0 }
  }
  return parts.join('.')
}

function parseValidity(node: any){
  // Validity ::= SEQUENCE { notBefore, notAfter } with UTCTime/GeneralizedTime
  const out: any = {}
  if (!node?.constructed || node.items.length < 2) return out
  const [nb, na] = node.items
  const toTime = (n:any)=> asPrintableString(n)
  out.notBefore = toTime(nb)
  out.notAfter = toTime(na)
  return out
}

export function decodeX509(pemOrDer: string): any {
  try {
    const isPem = pemOrDer.includes('-----BEGIN')
    const der = isPem ? pemToDer(pemOrDer) : b64ToUint8(pemOrDer)
    const { node: root } = parseAsn1(der, 0)
    const tbs = findTbsCertificate(root)
    const summary: any = { ok: true }
    if (tbs?.constructed) {
      // RFC 5280: tbsCertificate ::= SEQUENCE { version [0] EXPLICIT Version DEFAULT v1, serialNumber, signature, issuer, validity, subject, subjectPublicKeyInfo, ... }
      const items = tbs.items
      // naive indexing; extensions and version are context-specific and may shift indices in real certs
      summary.serialNumber = items?.[1]?.content ? Buffer.from(items[1].content).toString('hex') : undefined
      summary.issuer = parseName(items?.[3])
      summary.validity = parseValidity(items?.[4])
      summary.subject = parseName(items?.[5])
      const spki = items?.[6]
      if (spki?.constructed) {
        const algOid = spki.items?.[0]?.items?.[0]
        summary.subjectPublicKeyAlg = algOid ? oidToString(algOid) : undefined
      }
    }
    return summary
  } catch (e) {
    return { ok: false, error: String(e) }
  }
}
