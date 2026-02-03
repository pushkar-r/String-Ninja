import React, { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import ToolCard from '../components/ToolCard'
import CopyButton from '../components/CopyButton'
import Head from '../components/Head'
import { hashString, aesEncrypt, aesDecrypt, jwtDecode, generateRSAKeyPairPEM } from '../utils/crypto'
import { bcryptHash, bcryptCompare, argon2Hash } from '../utils/passwords'
import { verifyHS256, verifyRS256 } from '../utils/jwt'
import { decodeX509 } from '../utils/x509'
import { decodeSAMLResponse, decodeSAMLRedirect } from '../utils/saml'
import { base32Decode } from '../utils/conversions'

export default function Security() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [active, setActive] = useState<'hash'|'aes'|'jwt'|'pw'|'jwtv'|'rsa'|'x509'|'saml'|'jwtSign'|'hmac'|'filehash'|'pkce'|'ecc'|'certconv'>(
    (searchParams.get('tool') as any) || 'hash'
  )
  useEffect(()=>{
    const t = searchParams.get('tool') as any
    if (t && t !== active) setActive(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])
  function selectTool(key: typeof active){ setActive(key); setSearchParams({ tool: key }) }

  // Per-feature cache to keep state local to each tab and restore when revisiting
  const [cache, setCache] = useState<Record<string, any>>({})
  const prevActive = useRef(active)
  useEffect(() => {
    const prev = prevActive.current
    // Save current common states under previous tool key
    const nextCache = { ...cache, [prev]: { text, algo, password, cipher, jwt } }
    const saved = nextCache[active] || {}

    // Commit cache and restore for new active
    setCache(nextCache)
    setText(saved.text || '')
    setAlgo(saved.algo || 'SHA256')
    setPassword(saved.password || '')
    setCipher(saved.cipher || '')
    setJwt(saved.jwt || '')

    // Ensure File Hashing starts clean on activation
    if (active === 'filehash') {
      setTimeout(() => {
        const a = document.getElementById('fh-256') as HTMLInputElement | null
        const b = document.getElementById('fh-512') as HTMLInputElement | null
        if (a) a.value = ''
        if (b) b.value = ''
        const f = document.getElementById('fh-file') as HTMLInputElement | null
        if (f) f.value = ''
      }, 0)
    }

    prevActive.current = active
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  const [text, setText] = useState('')
  const [algo, setAlgo] = useState<'MD5' | 'SHA1' | 'SHA256' | 'SHA512'>('SHA256')
  const [password, setPassword] = useState('')
  const [cipher, setCipher] = useState('')
  const [jwt, setJwt] = useState('')
  const decoded = jwt ? jwtDecode(jwt) : null

  // Helpers for JWT signing, HMAC, etc.
  function strToUint8(s: string){ return new TextEncoder().encode(s) }
  function b64url(bytes: Uint8Array){
    let bin = ''
    for (let i=0;i<bytes.length;i++) bin += String.fromCharCode(bytes[i])
    return btoa(bin).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')
  }
  function pemToArrayBuffer(pem: string){
    const body = pem.replace(/-----BEGIN [^-]+-----/g,'').replace(/-----END [^-]+-----/g,'').replace(/\s+/g,'')
    const bin = atob(body)
    const buf = new Uint8Array(bin.length)
    for (let i=0;i<bin.length;i++) buf[i] = bin.charCodeAt(i)
    return buf.buffer
  }

  async function signJwtHS256(headerJson: string, payloadJson: string, secret: string){
    // Disabled: under development
    throw new Error('JWT signing (HS256) is under development')
  }
  async function signJwtRS256(headerJson: string, payloadJson: string, privatePem: string){
    // Disabled: under development
    throw new Error('JWT signing (RS256) is under development')
  }
  async function hmacCompute(message: string, secret: string, hash: 'SHA-256'|'SHA-512'){
    // Disabled: under development
    throw new Error('HMAC compute is under development')
  }
  async function hashFile(file: File){
    const buf = await file.arrayBuffer()
    const sha256 = new Uint8Array(await crypto.subtle.digest('SHA-256', buf))
    const sha512 = new Uint8Array(await crypto.subtle.digest('SHA-512', buf))
    const toHex = (arr: Uint8Array)=> Array.from(arr).map(b=> b.toString(16).padStart(2,'0')).join('')
    return { sha256: toHex(sha256), sha512: toHex(sha512) }
  }

  async function hmacSha1Bytes(key: Uint8Array, msg: Uint8Array){
    // Disabled: under development
    throw new Error('TOTP/HOTP is under development')
  }
  function intToBytesBE(n: number){
    const buf = new Uint8Array(8)
    for (let i=7;i>=0;i--){ buf[i] = n & 0xff; n = Math.floor(n/256) }
    return buf
  }
  async function hotpGenerate(secretBytes: Uint8Array, counter: number, digits=6){
    // Disabled: under development
    throw new Error('TOTP/HOTP is under development')
  }
  async function totpGenerate(secretBytes: Uint8Array, period=30, digits=6, now=Date.now()){
    // Disabled: under development
    throw new Error('TOTP/HOTP is under development')
  }
  function strToBytes(s: string){ return new TextEncoder().encode(s) }
  function hexToBytes(hex: string){ const clean=hex.replace(/\s+/g,''); if(clean.length%2) return new Uint8Array(); return new Uint8Array(clean.match(/.{1,2}/g)!.map(h=>parseInt(h,16))) }
  function base32ToBytes(b32: string){ const s = base32Decode(b32); const arr = new Uint8Array(s.length); for(let i=0;i<s.length;i++) arr[i]=s.charCodeAt(i); return arr }
  function parseSecret(input: string, fmt: 'base32'|'hex'|'text'){
    if (fmt==='base32') return base32ToBytes(input.trim())
    if (fmt==='hex') return hexToBytes(input)
    return strToBytes(input)
  }

  async function generateECDSAKeyPairPEM(){
    const kp = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign','verify'])
    const spki = new Uint8Array(await crypto.subtle.exportKey('spki', kp.publicKey))
    const pkcs8 = new Uint8Array(await crypto.subtle.exportKey('pkcs8', kp.privateKey))
    function toB64(u8: Uint8Array){ let bin=''; for(let i=0;i<u8.length;i++) bin+=String.fromCharCode(u8[i]); return btoa(bin) }
    function toPem(bodyB64: string, label: string){ const lines = bodyB64.match(/.{1,64}/g) || []; return `-----BEGIN ${label}-----\n${lines.join('\n')}\n-----END ${label}-----` }
    return { publicKey: toPem(toB64(spki), 'PUBLIC KEY'), privateKey: toPem(toB64(pkcs8), 'PRIVATE KEY') }
  }

  function downloadBlob(data: string|Uint8Array, filename: string, mime='application/octet-stream'){
    let blob: Blob
    if (typeof data === 'string') {
      blob = new Blob([data], { type: mime })
    } else {
      // Create a fresh ArrayBuffer and copy to avoid SharedArrayBuffer union types
      const ab = new ArrayBuffer(data.byteLength)
      new Uint8Array(ab).set(data)
      blob = new Blob([ab], { type: mime })
    }
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  function detectCertFormatByExt(name: string){
    const ext = name.toLowerCase().split('.').pop() || ''
    if (ext === 'pem') return 'PEM'
    if (ext === 'der' || ext === 'cer' || ext === 'crt') return 'DER'
    if (ext === 'p7b' || ext === 'p7c') return 'PKCS7'
    if (ext === 'pfx' || ext === 'p12') return 'PKCS12'
    return 'Unknown'
  }

  async function convertCert(inputBytes: Uint8Array, inFmt: 'PEM'|'DER'|'PKCS7'|'PKCS12'|'Unknown', outFmt: 'PEM'|'DER'){
    function derToPem(der: Uint8Array, label='CERTIFICATE'){
      let bin=''; for(let i=0;i<der.length;i++) bin+=String.fromCharCode(der[i])
      const b64 = btoa(bin).replace(/(.{64})/g,'$1\n')
      return `-----BEGIN ${label}-----\n${b64}\n-----END ${label}-----\n`
    }
    function pemToDer(pem: string){
      const body = pem.replace(/-----BEGIN [^-]+-----/g,'').replace(/-----END [^-]+-----/g,'').replace(/\s+/g,'')
      const bin = atob(body)
      const u8 = new Uint8Array(bin.length)
      for (let i=0;i<bin.length;i++) u8[i] = bin.charCodeAt(i)
      return u8
    }

    if (outFmt === 'DER'){
      if (inFmt === 'DER') return inputBytes
      if (inFmt === 'PEM') return pemToDer(new TextDecoder().decode(inputBytes))
      throw new Error('Only PEM/DER supported for conversion to DER')
    } else if (outFmt === 'PEM'){
      if (inFmt === 'PEM') return new TextDecoder().decode(inputBytes)
      if (inFmt === 'DER') return derToPem(inputBytes)
      throw new Error('Only PEM/DER supported for conversion to PEM')
    }
    throw new Error('Unsupported output format')
  }

  function renderPanel(){
    switch (active) {
      case 'hash':
        return (
          <ToolCard title="Hash (MD5, SHA-1, SHA-256, SHA-512)" description="Compute fixed-length hashes (digests) of text.">
            <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Enter text…" className="w-full h-28 rounded-xl border p-3 dark:bg-slate-900" />
            <div className="flex gap-2 items-center">
              <label className="text-sm">Algorithm</label>
              <select value={algo} onChange={e=>setAlgo(e.target.value as any)} className="px-2 py-2 rounded-xl border dark:bg-slate-900">
                <option>MD5</option><option>SHA1</option><option>SHA256</option><option>SHA512</option>
              </select>
            </div>
            <div className="relative">
              <input readOnly value={text ? hashString(text, algo) : ''} className="w-full rounded-xl border p-3 font-mono text-xs dark:bg-slate-900 pr-12" />
              <div className="absolute top-2 right-2"><CopyButton value={text ? hashString(text, algo) : ''} /></div>
            </div>
            <div className="mt-6 text-sm leading-6 text-slate-700 dark:text-slate-300 space-y-3">
              <h3 className="text-base font-semibold">How hashing works</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Hashes map arbitrary input to fixed-size output deterministically.</li>
                <li>Small input changes cause unpredictable, large changes in the hash (avalanche effect).</li>
                <li>MD5/SHA-1 are broken for collision resistance; prefer SHA-256/512.</li>
              </ul>
              <p className="text-xs text-slate-500 dark:text-slate-400">Security tip: Hashing ≠ encryption. Use salted password hashing (bcrypt/Argon2) for passwords, not generic hashes.</p>
            </div>
          </ToolCard>
        )
      case 'filehash':
        return (
          <ToolCard title="File Hashing" description="Compute SHA-256 and SHA-512 of an uploaded file in the browser.">
            <input id="fh-file" type="file" className="block" onChange={async (e)=>{ const f = (e.target as HTMLInputElement).files?.[0]; if(!f) return; const res = await hashFile(f); (document.getElementById('fh-256') as HTMLInputElement).value = res.sha256; (document.getElementById('fh-512') as HTMLInputElement).value = res.sha512 }} />
            <div className="relative"><input id="fh-256" readOnly placeholder="SHA-256 (hex)" className="w-full rounded-xl border p-3 font-mono text-xs dark:bg-slate-900 pr-12" /><div className="absolute top-2 right-2"><CopyButton getValue={()=> (document.getElementById('fh-256') as HTMLInputElement)?.value || ''} /></div></div>
            <div className="relative"><input id="fh-512" readOnly placeholder="SHA-512 (hex)" className="w-full rounded-xl border p-3 font-mono text-xs dark:bg-slate-900 pr-12" /><div className="absolute top-2 right-2"><CopyButton getValue={()=> (document.getElementById('fh-512') as HTMLInputElement)?.value || ''} /></div></div>
            <div className="mt-6 text-sm leading-6 text-slate-700 dark:text-slate-300 space-y-2">
              <h3 className="text-base font-semibold">Integrity check</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Compute a file hash locally and compare with a publisher-provided checksum.</li>
                <li>Different algorithms produce different outputs; SHA-256 is commonly published.</li>
              </ul>
            </div>
          </ToolCard>
        )
      case 'aes':
        return (
          <ToolCard title="AES-GCM Encrypt/Decrypt (Password)" description="PBKDF2 100k, Base64 payload (salt+IV+cipher).">
            <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Plaintext…" className="w-full h-28 rounded-xl border p-3 dark:bg-slate-900" />
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password…" className="w-full rounded-xl border p-3 dark:bg-slate-900" />
            <div className="grid md:grid-cols-2 gap-3">
              <button onClick={async ()=>setCipher(await aesEncrypt(text, password))} className="px-4 py-2 rounded-xl bg-slate-900 text-white">Encrypt →</button>
              <button onClick={async ()=>setText(await aesDecrypt(cipher, password).catch(()=> 'Decryption failed'))} className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">← Decrypt</button>
            </div>
            <div className="relative">
              <textarea value={cipher} onChange={e=>setCipher(e.target.value)} placeholder="Cipher (Base64)…" className="w-full h-28 rounded-xl border p-3 font-mono text-xs dark:bg-slate-900 pr-12" />
              <div className="absolute top-2 right-2"><CopyButton value={cipher} /></div>
            </div>
            <div className="mt-6 text-sm leading-6 text-slate-700 dark:text-slate-300 space-y-3">
              <h3 className="text-base font-semibold">How AES‑GCM with password works</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Key derivation: password + random salt → PBKDF2 (100k) → 256‑bit key.</li>
                <li>Encryption: AES‑GCM with a random 96‑bit IV; output includes salt, IV, cipher, tag.</li>
                <li>Encoding: bytes packed and Base64‑encoded for copy/paste.</li>
              </ul>
              <p className="text-xs text-slate-500 dark:text-slate-400">Security tip: Use a strong unique password; GCM provides integrity via its auth tag.</p>
            </div>
          </ToolCard>
        )
      case 'jwt':
        return (
          <ToolCard title="JWT Decoder" description="Decodes header & payload (no signature verification).">
            <input value={jwt} onChange={e=>setJwt(e.target.value)} placeholder="Paste JWT…" className="w-full rounded-xl border p-3 font-mono text-xs dark:bg-slate-900" />
            <div className="relative">
              <pre id="jwt-decoded" className="rounded-xl border p-3 overflow-auto text-xs dark:bg-slate-900 pr-12">{decoded ? JSON.stringify(decoded, null, 2) : 'Invalid or empty JWT'}</pre>
              <div className="absolute top-2 right-2"><CopyButton getValue={()=> (document.getElementById('jwt-decoded') as HTMLElement)?.textContent || ''} /></div>
            </div>
            <div className="mt-6 text-sm leading-6 text-slate-700 dark:text-slate-300 space-y-2">
              <h3 className="text-base font-semibold">JWT structure</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>header.payload.signature (Base64URL each)</li>
                <li>Header: alg, typ; Payload: claims (iss, sub, exp…)</li>
                <li>Signature = sign( base64url(header)+'.'+base64url(payload) )</li>
              </ul>
              <p className="text-xs text-slate-500 dark:text-slate-400">This decoder does not verify signatures. Use "JWT Verify" to validate.</p>
            </div>
          </ToolCard>
        )
      case 'pw':
        return (
          <ToolCard title="Password Hashing (bcrypt, Argon2)" description="Hash passwords and verify bcrypt hashes.">
            <input id="pw-in" placeholder="Password..." className="w-full rounded-xl border p-3 dark:bg-slate-900" />
            <div className="flex flex-wrap gap-2">
              <button onClick={() => { const v = (document.getElementById('pw-in') as HTMLInputElement).value; (document.getElementById('pw-out') as HTMLInputElement).value = bcryptHash(v) }} className="px-3 py-2 rounded-xl bg-slate-900 text-white">bcrypt Hash</button>
              <button onClick={async () => { const v = (document.getElementById('pw-in') as HTMLInputElement).value; (document.getElementById('pw-out') as HTMLInputElement).value = await argon2Hash(v) }} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">Argon2 Hash</button>
              <button onClick={() => { const v = (document.getElementById('pw-in') as HTMLInputElement).value; const h = (document.getElementById('pw-out') as HTMLInputElement).value; (document.getElementById('pw-verify') as HTMLInputElement).value = bcryptCompare(v, h) ? 'OK' : 'NO' }} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">Verify bcrypt</button>
            </div>
            <div className="relative"><input id="pw-out" readOnly className="w-full rounded-xl border p-3 dark:bg-slate-900 pr-12" placeholder="Hash output" /><div className="absolute top-2 right-2"><CopyButton getValue={()=> (document.getElementById('pw-out') as HTMLInputElement)?.value || ''} /></div></div>
            <div className="relative"><input id="pw-verify" readOnly className="w-full rounded-xl border p-3 dark:bg-slate-900 pr-12" placeholder="Verify result" /><div className="absolute top-2 right-2"><CopyButton getValue={()=> (document.getElementById('pw-verify') as HTMLInputElement)?.value || ''} /></div></div>
            <div className="mt-6 text-sm leading-6 text-slate-700 dark:text-slate-300 space-y-3">
              <h3 className="text-base font-semibold">Why bcrypt/Argon2 for passwords</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Both are intentionally slow and use salt to resist rainbow tables.</li>
                <li>Argon2 adds memory hardness against GPU/ASIC cracking.</li>
                <li>Never use MD5/SHA directly for password storage.</li>
              </ul>
            </div>
          </ToolCard>
        )
      case 'jwtv':
        return (
          <ToolCard title="JWT Verify (HS256 / RS256)" description="Verify JWT signatures using an HS secret or RSA public key.">
            <input id="jwt-verify-in" placeholder="JWT..." className="w-full rounded-xl border p-3 font-mono text-xs dark:bg-slate-900" />
            <input id="jwt-secret" placeholder="HS secret (for HS256)..." className="w-full rounded-xl border p-3 font-mono text-xs dark:bg-slate-900" />
            <textarea id="jwt-pem" placeholder="PEM public key (for RS256)..." className="w-full h-28 rounded-xl border p-3 font-mono text-xs dark:bg-slate-900" />
            <div className="flex gap-2">
              <button onClick={async () => { const token = (document.getElementById('jwt-verify-in') as HTMLInputElement).value; const secret = (document.getElementById('jwt-secret') as HTMLInputElement).value; const ok = await verifyHS256(token, secret); (document.getElementById('jwt-verify-out') as HTMLInputElement).value = ok ? 'Valid (HS256)' : 'Invalid' }} className="px-3 py-2 rounded-xl bg-slate-900 text-white">Verify HS256</button>
              <button onClick={async () => { const token = (document.getElementById('jwt-verify-in') as HTMLInputElement).value; const pem = (document.getElementById('jwt-pem') as HTMLInputElement).value; const ok = await verifyRS256(token, pem); (document.getElementById('jwt-verify-out') as HTMLInputElement).value = ok ? 'Valid (RS256)' : 'Invalid' }} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">Verify RS256</button>
            </div>
            <div className="relative"><input id="jwt-verify-out" readOnly className="w-full rounded-xl border p-3 dark:bg-slate-900 pr-12" /><div className="absolute top-2 right-2"><CopyButton getValue={()=> (document.getElementById('jwt-verify-out') as HTMLInputElement)?.value || ''} /></div></div>
            <div className="mt-6 text-sm leading-6 text-slate-700 dark:text-slate-300 space-y-2">
              <h3 className="text-base font-semibold">Verification steps</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Parse token and decode header/payload.</li>
                <li>Recompute signature on header.payload with the provided key.</li>
                <li>Compare signature and validate exp/nbf/iss/aud as needed.</li>
              </ul>
            </div>
          </ToolCard>
        )
      case 'rsa':
        return (
          <ToolCard title="RSA Key Pair (PEM)" description="Generate an RSA public/private key pair in PEM format.">
            <div className="flex gap-2 items-center">
              <label className="text-sm">Modulus length</label>
              <select id="rsa-mod" defaultValue={"2048"} className="px-2 py-2 rounded-xl border dark:bg-slate-900">
                <option value="2048">2048</option>
                <option value="3072">3072</option>
                <option value="4096">4096</option>
              </select>
              <button onClick={async ()=>{ const bits = parseInt((document.getElementById('rsa-mod') as HTMLSelectElement).value,10) || 2048; const { publicKey, privateKey } = await generateRSAKeyPairPEM(bits); (document.getElementById('rsa-pub') as HTMLTextAreaElement).value = publicKey; (document.getElementById('rsa-priv') as HTMLTextAreaElement).value = privateKey }} className="px-3 py-2 rounded-xl bg-slate-900 text-white">Generate</button>
            </div>
            <div className="relative"><textarea id="rsa-pub" readOnly placeholder="Public Key (PEM)" className="w-full h-40 rounded-xl border p-3 font-mono text-xs dark:bg-slate-900 pr-12" /><div className="absolute top-2 right-2"><CopyButton getValue={()=> (document.getElementById('rsa-pub') as HTMLTextAreaElement)?.value || ''} /></div></div>
            <div className="relative"><textarea id="rsa-priv" readOnly placeholder="Private Key (PEM)" className="w-full h-40 rounded-xl border p-3 font-mono text-xs dark:bg-slate-900 pr-12" /><div className="absolute top-2 right-2"><CopyButton getValue={()=> (document.getElementById('rsa-priv') as HTMLTextAreaElement)?.value || ''} /></div></div>
            <div className="mt-6 text-sm leading-6 text-slate-700 dark:text-slate-300 space-y-2">
              <h3 className="text-base font-semibold">RSA overview</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Public key (n,e) and private key (n,d) over large primes p,q.</li>
                <li>Key size controls security; 2048 is baseline, 3072/4096 stronger.</li>
                <li>PEM is just Base64 of ASN.1 structures with header/footer.</li>
              </ul>
            </div>
          </ToolCard>
        )
      case 'x509':
        return (
          <ToolCard title="X.509 Certificate Decoder" description="Paste PEM or Base64 DER to inspect basic fields.">
            <textarea id="x509-in" placeholder="-----BEGIN CERTIFICATE----- ..." className="w-full h-40 rounded-xl border p-3 font-mono text-xs dark:bg-slate-900" />
            <button onClick={()=>{ const v=(document.getElementById('x509-in') as HTMLTextAreaElement).value; const info = decodeX509(v); (document.getElementById('x509-out') as HTMLPreElement).textContent = JSON.stringify(info, null, 2) }} className="px-3 py-2 rounded-xl bg-slate-900 text-white">Decode</button>
            <div className="relative">
              <pre id="x509-out" className="rounded-xl border p-3 overflow-auto text-xs dark:bg-slate-900 pr-12"></pre>
              <div className="absolute top-2 right-2"><CopyButton getValue={()=> (document.getElementById('x509-out') as HTMLElement)?.textContent || ''} /></div>
            </div>
            <div className="mt-6 text-sm leading-6 text-slate-700 dark:text-slate-300 space-y-2">
              <h3 className="text-base font-semibold">What is in a certificate</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Subject/Issuer names, public key, validity (NotBefore/NotAfter).</li>
                <li>Extensions: SAN, Key Usage, Basic Constraints, etc.</li>
                <li>Signature over TBSCertificate by issuer using its private key.</li>
              </ul>
            </div>
          </ToolCard>
        )
      case 'saml':
        return (
          <ToolCard title="SAML Response Decoder" description="Decode Base64 POST binding or deflated URL Redirect binding into XML text.">
            <textarea id="saml-in" placeholder="Paste SAMLResponse (Base64) or SAMLRequest/SAMLResponse URL param value" className="w-full h-40 rounded-xl border p-3 font-mono text-xs dark:bg-slate-900" />
            <div className="flex gap-2">
              <button onClick={()=>{ const v=(document.getElementById('saml-in') as HTMLTextAreaElement).value; (document.getElementById('saml-out') as HTMLTextAreaElement).value = decodeSAMLResponse(v) }} className="px-3 py-2 rounded-xl bg-slate-900 text-white">Decode (POST)</button>
              <button onClick={()=>{ const v=(document.getElementById('saml-in') as HTMLTextAreaElement).value; (document.getElementById('saml-out') as HTMLTextAreaElement).value = decodeSAMLRedirect(v) }} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">Decode (Redirect)</button>
            </div>
            <div className="relative"><textarea id="saml-out" readOnly className="w-full h-40 rounded-xl border p-3 font-mono text-xs dark:bg-slate-900 pr-12" /><div className="absolute top-2 right-2"><CopyButton getValue={()=> (document.getElementById('saml-out') as HTMLTextAreaElement)?.value || ''} /></div></div>
            <div className="mt-6 text-sm leading-6 text-slate-700 dark:text-slate-300 space-y-2">
              <h3 className="text-base font-semibold">Bindings overview</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>POST binding: Base64 XML in form field SAMLResponse.</li>
                <li>Redirect binding: deflate + base64 + URL-encode in query param.</li>
                <li>Signatures may be present via XML DSig or query-param sigs.</li>
              </ul>
            </div>
          </ToolCard>
        )
      case 'jwtSign':
        return (
          <ToolCard title="JWT Signer" description="Create and sign JWTs with HS256 or RS256.">
            <div className="grid md:grid-cols-2 gap-3">
              <textarea id="jwt-hdr" defaultValue={JSON.stringify({alg:'HS256',typ:'JWT'}, null, 2)} placeholder="Header JSON" className="w-full h-32 rounded-xl border p-3 font-mono text-xs dark:bg-slate-900" />
              <textarea id="jwt-pl" defaultValue={JSON.stringify({sub:'1234567890',name:'John Doe',iat:Math.floor(Date.now()/1000)}, null, 2)} placeholder="Payload JSON" className="w-full h-32 rounded-xl border p-3 font-mono text-xs dark:bg-slate-900" />
            </div>
            <div className="grid gap-2">
              <div className="flex gap-2 items-center">
                <label className="text-sm">Algorithm</label>
                <select id="jwt-alg" defaultValue={"HS256"} className="px-2 py-2 rounded-xl border dark:bg-slate-900">
                  <option>HS256</option>
                  <option>RS256</option>
                </select>
              </div>
              <input id="jwt-secret-in" placeholder="Secret (HS256)" className="w-full rounded-xl border p-3 font-mono text-xs dark:bg-slate-900" />
              <textarea id="jwt-priv-in" placeholder="Private Key (PKCS#8 PEM for RS256)" className="w-full h-28 rounded-xl border p-3 font-mono text-xs dark:bg-slate-900" />
              <button onClick={async ()=>{
                (document.getElementById('jwt-signed-out') as HTMLTextAreaElement).value = 'JWT signing is under development'
              }} className="px-3 py-2 rounded-xl bg-slate-900 text-white">Sign</button>
            </div>
            <div className="relative"><textarea id="jwt-signed-out" readOnly placeholder="JWT (compact)" className="w-full h-28 rounded-xl border p-3 font-mono text-xs dark:bg-slate-900 pr-12" /><div className="absolute top-2 right-2"><CopyButton getValue={()=> (document.getElementById('jwt-signed-out') as HTMLTextAreaElement)?.value || ''} /></div></div>
            <div className="mt-6 text-sm leading-6 text-slate-700 dark:text-slate-300 space-y-2">
              <h3 className="text-base font-semibold">HS256 vs RS256</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>HS256: shared secret (HMAC-SHA256). Fast, symmetric.</li>
                <li>RS256: RSA private key signs; public key verifies. Asymmetric.</li>
                <li>Both sign base64url(header)+"."+base64url(payload).</li>
              </ul>
            </div>
          </ToolCard>
        )
      case 'hmac':
        return (
          <ToolCard title="HMAC Generator" description="Compute keyed-hash MACs (HMAC) with SHA-256 or SHA-512.">
            <textarea id="hmac-msg" placeholder="Message" className="w-full h-24 rounded-xl border p-3 font-mono text-xs dark:bg-slate-900" />
            <input id="hmac-key" placeholder="Secret" className="w-full rounded-xl border p-3 font-mono text-xs dark:bg-slate-900" />
            <div className="flex gap-2 items-center">
              <label className="text-sm">Hash</label>
              <select id="hmac-hash" defaultValue={"SHA-256"} className="px-2 py-2 rounded-xl border dark:bg-slate-900">
                <option>SHA-256</option>
                <option>SHA-512</option>
              </select>
              <button onClick={()=>{ (document.getElementById('hmac-out') as HTMLInputElement).value = 'HMAC is under development' }} className="px-3 py-2 rounded-xl bg-slate-900 text-white">Compute</button>
            </div>
            <div className="relative"><input id="hmac-out" readOnly className="w-full rounded-xl border p-3 font-mono text-xs dark:bg-slate-900 pr-12" placeholder="HMAC (hex)" /><div className="absolute top-2 right-2"><CopyButton getValue={()=> (document.getElementById('hmac-out') as HTMLInputElement)?.value || ''} /></div></div>
            <div className="mt-6 text-sm leading-6 text-slate-700 dark:text-slate-300 space-y-2">
              <h3 className="text-base font-semibold">What HMAC provides</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Integrity and authenticity using a shared secret.</li>
                <li>HMAC = hash(key ⊕ opad, hash(key ⊕ ipad, message)).</li>
                <li>Use different keys for different purposes (KDF separates keys).</li>
              </ul>
            </div>
          </ToolCard>
        )
      // case 'totp':
      //   return (
      //     <ToolCard title="TOTP / HOTP" description="One-time password generators (time-based and counter-based).">
      //       ... feature removed ...
      //     </ToolCard>
      //   )
      case 'pkce':
        return (
          <ToolCard title="PKCE Generator (S256)" description="Create OAuth 2.0 PKCE code_verifier and S256 code_challenge.">
            <div className="flex flex-wrap gap-2 items-center">
              <button onClick={()=>{ const chars='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'; let s=''; const arr=new Uint32Array(64); crypto.getRandomValues(arr); for(let i=0;i<arr.length;i++){ s+=chars[arr[i]%chars.length] } (document.getElementById('pkce-verifier') as HTMLInputElement).value = s }} className="px-3 py-2 rounded-xl bg-slate-900 text-white">Generate verifier</button>
              <button onClick={async ()=>{ const v=(document.getElementById('pkce-verifier') as HTMLInputElement).value; const data=new TextEncoder().encode(v); const hash=new Uint8Array(await crypto.subtle.digest('SHA-256', data)); let bin=''; for(let i=0;i<hash.length;i++) bin+=String.fromCharCode(hash[i]); const b64=btoa(bin).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); (document.getElementById('pkce-challenge') as HTMLInputElement).value = b64 }} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">Derive challenge</button>
            </div>
            <div className="relative mt-2"><input id="pkce-verifier" placeholder="code_verifier" className="w-full rounded-xl border p-3 font-mono text-xs dark:bg-slate-900 pr-12" /><div className="absolute top-2 right-2"><CopyButton getValue={()=> (document.getElementById('pkce-verifier') as HTMLInputElement)?.value || ''} /></div></div>
            <div className="relative mt-2"><input id="pkce-challenge" readOnly placeholder="code_challenge (S256)" className="w-full rounded-xl border p-3 font-mono text-xs dark:bg-slate-900 pr-12" /><div className="absolute top-2 right-2"><CopyButton getValue={()=> (document.getElementById('pkce-challenge') as HTMLInputElement)?.value || ''} /></div></div>
            <div className="mt-6 text-sm leading-6 text-slate-700 dark:text-slate-300 space-y-2">
              <h3 className="text-base font-semibold">PKCE flow (S256)</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Client creates random code_verifier and S256 code_challenge.</li>
                <li>Authorize request includes code_challenge (+method=S256).</li>
                <li>Token request proves possession by sending the original code_verifier.</li>
              </ul>
            </div>
          </ToolCard>
        )
      case 'certconv':
        return (
          <ToolCard title="Certificate Format Converter" description="Upload a certificate and convert between PEM and DER formats.">
            <div className="grid gap-2">
              <input id="cc-file" type="file" accept=".pem,.der,.cer,.crt,.p7b,.p7c,.pfx,.p12" className="block" onChange={async (e)=>{
                const f = (e.target as HTMLInputElement).files?.[0]
                if (!f) return
                ;(document.getElementById('cc-infmt') as HTMLInputElement).value = detectCertFormatByExt(f.name)
                const arr = new Uint8Array(await f.arrayBuffer())
                ;(document.getElementById('cc-bytes') as HTMLTextAreaElement).value = Array.from(arr).slice(0,64).map(b=>b.toString(16).padStart(2,'0')).join(' ') + (arr.length>64? ' …' : '')
              }} />
              <div className="grid sm:grid-cols-2 gap-2 items-center">
                <input id="cc-infmt" readOnly placeholder="Detected input format" className="w-full rounded-xl border p-3 text-sm dark:bg-slate-900" />
                <select id="cc-outfmt" className="w-full rounded-xl border p-3 text-sm dark:bg-slate-900">
                  <option value="PEM">PEM (.pem)</option>
                  <option value="DER">DER (.der)</option>
                  <option value="CER">DER (.cer)</option>
                  <option value="CRT">DER (.crt)</option>
                </select>
              </div>
              <div className="relative"><textarea id="cc-bytes" readOnly className="w-full h-24 rounded-xl border p-3 font-mono text-xs dark:bg-slate-900" placeholder="Input preview (first bytes)…" /></div>
              <button className="px-3 py-2 rounded-xl bg-slate-900 text-white w-fit" onClick={async ()=>{
                const file = (document.getElementById('cc-file') as HTMLInputElement).files?.[0]
                if (!file) { alert('Upload a file first'); return }
                const inFmt = (document.getElementById('cc-infmt') as HTMLInputElement).value as any
                const outSel = (document.getElementById('cc-outfmt') as HTMLSelectElement).value as 'PEM'|'DER'|'CER'|'CRT'
                const outType = outSel === 'PEM' ? 'PEM' : 'DER'
                const bytes = new Uint8Array(await file.arrayBuffer())
                try {
                  const converted = await convertCert(bytes, inFmt, outType)
                  const ext = outSel === 'PEM' ? '.pem' : outSel === 'DER' ? '.der' : outSel === 'CER' ? '.cer' : '.crt'
                  const outName = file.name.replace(/\.[^.]+$/, '') + ext
                  downloadBlob(converted as any, outName)
                } catch (e:any){
                  alert((e && e.message) || 'Conversion failed')
                }
              }}>Convert & Download</button>
            </div>
            <div className="mt-6 text-sm leading-6 text-slate-700 dark:text-slate-300 space-y-3">
              <div>
                <h3 className="text-base font-semibold">How formats work</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li><span className="font-medium">PEM</span>: Base64 text wrapping of the certificate bytes with BEGIN/END headers. Human‑readable; convenient for copy/paste.</li>
                  <li><span className="font-medium">DER</span>: Raw binary ASN.1 encoding of the same certificate. Compact; commonly used on Windows and certain tooling.</li>
                  <li><span className="font-medium">Extensions</span>: .cer and .crt are often just aliases for DER; the content is identical to .der. Some systems also use .crt for PEM; the extension alone doesn’t guarantee encoding.</li>
                </ul>
              </div>
              <div>
                <h3 className="text-base font-semibold">Scope and limitations</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Supported: lossless conversion between <span className="font-medium">PEM</span> and <span className="font-medium">DER</span> for a single X.509 certificate.</li>
                  <li>Out of scope: PKCS#7 bundles (.p7b/.p7c), PKCS#12 keystores (.pfx/.p12), private keys, CSR files, and multi‑cert chains inside containers.</li>
                  <li>Detection uses filename extension for UX. If the extension is wrong (e.g., DER bytes named .pem), pick the correct output/try the other encoding.</li>
                  <li>Privacy: conversion runs 100% in your browser; no files are uploaded.</li>
                </ul>
              </div>
            </div>
          </ToolCard>
        )
      case 'ecc':
        return (
          <ToolCard title="ECC Key Pair (P-256, PEM)" description="Generate an ECDSA P-256 key pair in PEM format.">
            <button onClick={async ()=>{ const { publicKey, privateKey } = await generateECDSAKeyPairPEM(); (document.getElementById('ecc-pub') as HTMLTextAreaElement).value = publicKey; (document.getElementById('ecc-priv') as HTMLTextAreaElement).value = privateKey }} className="px-3 py-2 rounded-xl bg-slate-900 text-white">Generate</button>
            <div className="relative mt-2"><textarea id="ecc-pub" readOnly placeholder="Public Key (PEM)" className="w-full h-40 rounded-xl border p-3 font-mono text-xs dark:bg-slate-900 pr-12" /><div className="absolute top-2 right-2"><CopyButton getValue={()=> (document.getElementById('ecc-pub') as HTMLTextAreaElement)?.value || ''} /></div></div>
            <div className="relative mt-2"><textarea id="ecc-priv" readOnly placeholder="Private Key (PEM)" className="w-full h-40 rounded-xl border p-3 font-mono text-xs dark:bg-slate-900 pr-12" /><div className="absolute top-2 right-2"><CopyButton getValue={()=> (document.getElementById('ecc-priv') as HTMLTextAreaElement)?.value || ''} /></div></div>
          </ToolCard>
        )
    }
  }

  const navItems: { key: typeof active, label: string }[] = [
    { key: 'hash', label: 'Hashing' },
    { key: 'filehash', label: 'File Hashing' },
    { key: 'aes', label: 'AES-GCM (PBKDF2)' },
    { key: 'jwt', label: 'JWT Decoder' },
    { key: 'pw', label: 'Password Hashing' },
    { key: 'jwtv', label: 'JWT Verify' },
    { key: 'rsa', label: 'RSA Keygen' },
    { key: 'x509', label: 'X.509 Decoder' },
    { key: 'saml', label: 'SAML Decoder' },
    { key: 'jwtSign', label: 'JWT Signer' },
    { key: 'hmac', label: 'HMAC Generator' },
    // { key: 'totp', label: 'TOTP / HOTP' },
    { key: 'pkce', label: 'PKCE Generator' },
    { key: 'ecc', label: 'ECC Keygen (P-256)' },
    { key: 'certconv', label: 'Cert Converter' },
  ]

  return (
    <>
      <Head title="String Ninja — Security Tools (Hashing, AES, JWT, RSA, X.509, SAML)" description="Hashing (MD5/SHA), AES-GCM, JWT decode/verify/sign, bcrypt/Argon2, RSA/ECC keygen, X.509/SAML decoders, HMAC, PKCE, TOTP/HOTP, file hashing." />
      <div className="grid gap-6 md:grid-cols-[260px_1fr]">
      <div className="bg-white dark:bg-slate-950 rounded-2xl p-3 shadow-sm border border-slate-200 dark:border-slate-800 h-fit md:sticky md:top-24">
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm font-semibold px-2 pb-2 md:pb-2">Security Tools</div>
          <div className="md:hidden w-full">
            <select
              value={active}
              onChange={e=>selectTool(e.target.value as any)}
              className="w-full mt-2 px-3 py-2 rounded-xl border dark:bg-slate-900"
            >
              {navItems.map(item => (
                <option key={item.key} value={item.key}>{item.label}</option>
              ))}
            </select>
          </div>
        </div>
        <ul className="grid gap-1 hidden md:block">
          {navItems.map(item => (
            <li key={item.key}>
              <button
                onClick={()=>selectTool(item.key)}
                className={
                  'w-full text-left px-3 py-2 rounded-lg text-sm transition ' +
                  (active===item.key
                    ? 'bg-slate-900 text-white'
                    : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200')
                }
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="min-w-0">
        {renderPanel()}
      </div>
    </div>
    </>
  )
}
