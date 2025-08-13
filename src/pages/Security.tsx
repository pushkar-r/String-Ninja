import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ToolCard from '../components/ToolCard'
import CopyButton from '../components/CopyButton'
import { hashString, aesEncrypt, aesDecrypt, jwtDecode, generateRSAKeyPairPEM } from '../utils/crypto'
import { bcryptHash, bcryptCompare, argon2Hash } from '../utils/passwords'
import { verifyHS256, verifyRS256 } from '../utils/jwt'
import { decodeX509 } from '../utils/x509'
import { decodeSAMLResponse, decodeSAMLRedirect } from '../utils/saml'
import { base32Decode } from '../utils/conversions'

export default function Security() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [active, setActive] = useState<'hash'|'aes'|'jwt'|'pw'|'jwtv'|'rsa'|'x509'|'saml'|'jwtSign'|'hmac'|'filehash'|'totp'|'pkce'|'ecc'>(
    (searchParams.get('tool') as any) || 'hash'
  )
  useEffect(()=>{
    const t = searchParams.get('tool') as any
    if (t && t !== active) setActive(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])
  function selectTool(key: typeof active){ setActive(key); setSearchParams({ tool: key }) }

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
    const header = b64url(strToUint8(headerJson))
    const payload = b64url(strToUint8(payloadJson))
    const data = strToUint8(`${header}.${payload}`)
    const key = await crypto.subtle.importKey('raw', strToUint8(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, data))
    return `${header}.${payload}.${b64url(sig)}`
  }
  async function signJwtRS256(headerJson: string, payloadJson: string, privatePem: string){
    const header = b64url(strToUint8(headerJson))
    const payload = b64url(strToUint8(payloadJson))
    const data = strToUint8(`${header}.${payload}`)
    const key = await crypto.subtle.importKey('pkcs8', pemToArrayBuffer(privatePem), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign'])
    const sig = new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, data))
    return `${header}.${payload}.${b64url(sig)}`
  }
  async function hmacCompute(message: string, secret: string, hash: 'SHA-256'|'SHA-512'){
    const key = await crypto.subtle.importKey('raw', strToUint8(secret), { name: 'HMAC', hash }, false, ['sign'])
    const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, strToUint8(message)))
    // hex
    return Array.from(mac).map(b=> b.toString(16).padStart(2,'0')).join('')
  }
  async function hashFile(file: File){
    const buf = await file.arrayBuffer()
    const sha256 = new Uint8Array(await crypto.subtle.digest('SHA-256', buf))
    const sha512 = new Uint8Array(await crypto.subtle.digest('SHA-512', buf))
    const toHex = (arr: Uint8Array)=> Array.from(arr).map(b=> b.toString(16).padStart(2,'0')).join('')
    return { sha256: toHex(sha256), sha512: toHex(sha512) }
  }

  async function hmacSha1Bytes(key: Uint8Array, msg: Uint8Array){
    const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign'])
    return new Uint8Array(await crypto.subtle.sign('HMAC', cryptoKey, msg))
  }
  function intToBytesBE(n: number){
    const buf = new Uint8Array(8)
    for (let i=7;i>=0;i--){ buf[i] = n & 0xff; n = Math.floor(n/256) }
    return buf
  }
  async function hotpGenerate(secretBytes: Uint8Array, counter: number, digits=6){
    const mac = await hmacSha1Bytes(secretBytes, intToBytesBE(counter))
    const offset = mac[mac.length - 1] & 0x0f
    const code = ((mac[offset] & 0x7f) << 24) | (mac[offset+1] << 16) | (mac[offset+2] << 8) | (mac[offset+3])
    const mod = 10 ** digits
    return (code % mod).toString().padStart(digits, '0')
  }
  async function totpGenerate(secretBytes: Uint8Array, period=30, digits=6, now=Date.now()){
    const counter = Math.floor(now/1000/period)
    return hotpGenerate(secretBytes, counter, digits)
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

  function renderPanel(){
    switch (active) {
      case 'hash':
        return (
          <ToolCard title="Hash (MD5, SHA-1, SHA-256, SHA-512)">
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
          </ToolCard>
        )
      case 'aes':
        return (
          <ToolCard title="AES-GCM Encrypt/Decrypt (Password)" description="PBKDF2 100k, Base64 payload (salt+IV+cipher).">
            <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Plaintext��" className="w-full h-28 rounded-xl border p-3 dark:bg-slate-900" />
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password…" className="w-full rounded-xl border p-3 dark:bg-slate-900" />
            <div className="grid md:grid-cols-2 gap-3">
              <button onClick={async ()=>setCipher(await aesEncrypt(text, password))} className="px-4 py-2 rounded-xl bg-slate-900 text-white">Encrypt →</button>
              <button onClick={async ()=>setText(await aesDecrypt(cipher, password).catch(()=> 'Decryption failed'))} className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">← Decrypt</button>
            </div>
            <div className="relative">
              <textarea value={cipher} onChange={e=>setCipher(e.target.value)} placeholder="Cipher (Base64)…" className="w-full h-28 rounded-xl border p-3 font-mono text-xs dark:bg-slate-900 pr-12" />
              <div className="absolute top-2 right-2"><CopyButton value={cipher} /></div>
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
          </ToolCard>
        )
      case 'pw':
        return (
          <ToolCard title="Password Hashing (bcrypt, Argon2)">
            <input id="pw-in" placeholder="Password..." className="w-full rounded-xl border p-3 dark:bg-slate-900" />
            <div className="flex flex-wrap gap-2">
              <button onClick={() => { const v = (document.getElementById('pw-in') as HTMLInputElement).value; (document.getElementById('pw-out') as HTMLInputElement).value = bcryptHash(v) }} className="px-3 py-2 rounded-xl bg-slate-900 text-white">bcrypt Hash</button>
              <button onClick={async () => { const v = (document.getElementById('pw-in') as HTMLInputElement).value; (document.getElementById('pw-out') as HTMLInputElement).value = await argon2Hash(v) }} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">Argon2 Hash</button>
              <button onClick={() => { const v = (document.getElementById('pw-in') as HTMLInputElement).value; const h = (document.getElementById('pw-out') as HTMLInputElement).value; (document.getElementById('pw-verify') as HTMLInputElement).value = bcryptCompare(v, h) ? 'OK' : 'NO' }} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">Verify bcrypt</button>
            </div>
            <div className="relative"><input id="pw-out" readOnly className="w-full rounded-xl border p-3 dark:bg-slate-900 pr-12" placeholder="Hash output" /><div className="absolute top-2 right-2"><CopyButton getValue={()=> (document.getElementById('pw-out') as HTMLInputElement)?.value || ''} /></div></div>
            <div className="relative"><input id="pw-verify" readOnly className="w-full rounded-xl border p-3 dark:bg-slate-900 pr-12" placeholder="Verify result" /><div className="absolute top-2 right-2"><CopyButton getValue={()=> (document.getElementById('pw-verify') as HTMLInputElement)?.value || ''} /></div></div>
          </ToolCard>
        )
      case 'jwtv':
        return (
          <ToolCard title="JWT Verify (HS256 / RS256)">
            <input id="jwt-verify-in" placeholder="JWT..." className="w-full rounded-xl border p-3 font-mono text-xs dark:bg-slate-900" />
            <input id="jwt-secret" placeholder="HS secret (for HS256)..." className="w-full rounded-xl border p-3 font-mono text-xs dark:bg-slate-900" />
            <textarea id="jwt-pem" placeholder="PEM public key (for RS256)..." className="w-full h-28 rounded-xl border p-3 font-mono text-xs dark:bg-slate-900" />
            <div className="flex gap-2">
              <button onClick={async () => { const token = (document.getElementById('jwt-verify-in') as HTMLInputElement).value; const secret = (document.getElementById('jwt-secret') as HTMLInputElement).value; const ok = await verifyHS256(token, secret); (document.getElementById('jwt-verify-out') as HTMLInputElement).value = ok ? 'Valid (HS256)' : 'Invalid' }} className="px-3 py-2 rounded-xl bg-slate-900 text-white">Verify HS256</button>
              <button onClick={async () => { const token = (document.getElementById('jwt-verify-in') as HTMLInputElement).value; const pem = (document.getElementById('jwt-pem') as HTMLInputElement).value; const ok = await verifyRS256(token, pem); (document.getElementById('jwt-verify-out') as HTMLInputElement).value = ok ? 'Valid (RS256)' : 'Invalid' }} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">Verify RS256</button>
            </div>
            <div className="relative"><input id="jwt-verify-out" readOnly className="w-full rounded-xl border p-3 dark:bg-slate-900 pr-12" /><div className="absolute top-2 right-2"><CopyButton getValue={()=> (document.getElementById('jwt-verify-out') as HTMLInputElement)?.value || ''} /></div></div>
          </ToolCard>
        )
      case 'rsa':
        return (
          <ToolCard title="RSA Key Pair (PEM)">
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
                const h = (document.getElementById('jwt-hdr') as HTMLTextAreaElement).value
                const p = (document.getElementById('jwt-pl') as HTMLTextAreaElement).value
                const alg = (document.getElementById('jwt-alg') as HTMLSelectElement).value
                try {
                  let token = ''
                  if (alg === 'HS256') token = await signJwtHS256(h, p, (document.getElementById('jwt-secret-in') as HTMLInputElement).value)
                  else token = await signJwtRS256(h, p, (document.getElementById('jwt-priv-in') as HTMLTextAreaElement).value)
                  ;(document.getElementById('jwt-signed-out') as HTMLTextAreaElement).value = token
                } catch (e) {
                  (document.getElementById('jwt-signed-out') as HTMLTextAreaElement).value = String(e)
                }
              }} className="px-3 py-2 rounded-xl bg-slate-900 text-white">Sign</button>
            </div>
            <div className="relative"><textarea id="jwt-signed-out" readOnly placeholder="JWT (compact)" className="w-full h-28 rounded-xl border p-3 font-mono text-xs dark:bg-slate-900 pr-12" /><div className="absolute top-2 right-2"><CopyButton getValue={()=> (document.getElementById('jwt-signed-out') as HTMLTextAreaElement)?.value || ''} /></div></div>
          </ToolCard>
        )
      case 'hmac':
        return (
          <ToolCard title="HMAC Generator">
            <textarea id="hmac-msg" placeholder="Message" className="w-full h-24 rounded-xl border p-3 font-mono text-xs dark:bg-slate-900" />
            <input id="hmac-key" placeholder="Secret" className="w-full rounded-xl border p-3 font-mono text-xs dark:bg-slate-900" />
            <div className="flex gap-2 items-center">
              <label className="text-sm">Hash</label>
              <select id="hmac-hash" defaultValue={"SHA-256"} className="px-2 py-2 rounded-xl border dark:bg-slate-900">
                <option>SHA-256</option>
                <option>SHA-512</option>
              </select>
              <button onClick={async ()=>{ const m=(document.getElementById('hmac-msg') as HTMLTextAreaElement).value; const k=(document.getElementById('hmac-key') as HTMLInputElement).value; const h=(document.getElementById('hmac-hash') as HTMLSelectElement).value as 'SHA-256'|'SHA-512'; (document.getElementById('hmac-out') as HTMLInputElement).value = await hmacCompute(m,k,h) }} className="px-3 py-2 rounded-xl bg-slate-900 text-white">Compute</button>
            </div>
            <div className="relative"><input id="hmac-out" readOnly className="w-full rounded-xl border p-3 font-mono text-xs dark:bg-slate-900 pr-12" placeholder="HMAC (hex)" /><div className="absolute top-2 right-2"><CopyButton getValue={()=> (document.getElementById('hmac-out') as HTMLInputElement)?.value || ''} /></div></div>
          </ToolCard>
        )
      case 'filehash':
        return (
          <ToolCard title="File Hashing" description="Compute SHA-256 and SHA-512 of an uploaded file in the browser.">
            <input id="fh-file" type="file" className="block" onChange={async (e)=>{ const f = (e.target as HTMLInputElement).files?.[0]; if(!f) return; const res = await hashFile(f); (document.getElementById('fh-256') as HTMLInputElement).value = res.sha256; (document.getElementById('fh-512') as HTMLInputElement).value = res.sha512 }} />
            <div className="relative"><input id="fh-256" readOnly placeholder="SHA-256 (hex)" className="w-full rounded-xl border p-3 font-mono text-xs dark:bg-slate-900 pr-12" /><div className="absolute top-2 right-2"><CopyButton getValue={()=> (document.getElementById('fh-256') as HTMLInputElement)?.value || ''} /></div></div>
            <div className="relative"><input id="fh-512" readOnly placeholder="SHA-512 (hex)" className="w-full rounded-xl border p-3 font-mono text-xs dark:bg-slate-900 pr-12" /><div className="absolute top-2 right-2"><CopyButton getValue={()=> (document.getElementById('fh-512') as HTMLInputElement)?.value || ''} /></div></div>
          </ToolCard>
        )
      case 'totp':
        return (
          <ToolCard title="TOTP / HOTP">
            <div className="grid md:grid-cols-2 gap-3">
              <input id="otp-secret" placeholder="Secret (Base32 by default)" className="w-full rounded-xl border p-3 font-mono text-xs dark:bg-slate-900" />
              <div className="flex items-center gap-2">
                <label className="text-sm">Format</label>
                <select id="otp-format" defaultValue={'base32'} className="px-2 py-2 rounded-xl border dark:bg-slate-900">
                  <option value="base32">Base32</option>
                  <option value="hex">Hex</option>
                  <option value="text">Text</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm">Digits</label>
                <select id="otp-digits" defaultValue={'6'} className="px-2 py-2 rounded-xl border dark:bg-slate-900"><option>6</option><option>8</option></select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm">Period</label>
                <input id="otp-period" type="number" defaultValue={30} className="w-24 rounded-xl border p-2 dark:bg-slate-900" />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              <button onClick={async ()=>{ const s=(document.getElementById('otp-secret') as HTMLInputElement).value; const f=(document.getElementById('otp-format') as HTMLSelectElement).value as any; const d=parseInt((document.getElementById('otp-digits') as HTMLSelectElement).value,10)||6; const p=parseInt((document.getElementById('otp-period') as HTMLInputElement).value,10)||30; const code = await totpGenerate(parseSecret(s,f), p, d); (document.getElementById('totp-out') as HTMLInputElement).value = code }} className="px-3 py-2 rounded-xl bg-slate-900 text-white">Generate TOTP</button>
              <div className="relative w-full"><input id="totp-out" readOnly placeholder="TOTP" className="w-full rounded-xl border p-3 font-mono text-xs dark:bg-slate-900 pr-12" /><div className="absolute top-2 right-2"><CopyButton getValue={()=> (document.getElementById('totp-out') as HTMLInputElement)?.value || ''} /></div></div>
            </div>
            <div className="grid md:grid-cols-3 gap-2 mt-2">
              <input id="hotp-counter" type="number" placeholder="HOTP counter" className="w-full rounded-xl border p-3 font-mono text-xs dark:bg-slate-900" />
              <button onClick={async ()=>{ const s=(document.getElementById('otp-secret') as HTMLInputElement).value; const f=(document.getElementById('otp-format') as HTMLSelectElement).value as any; const d=parseInt((document.getElementById('otp-digits') as HTMLSelectElement).value,10)||6; const cnt=parseInt((document.getElementById('hotp-counter') as HTMLInputElement).value,10)||0; const code = await hotpGenerate(parseSecret(s,f), cnt, d); (document.getElementById('hotp-out') as HTMLInputElement).value = code }} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">Generate HOTP</button>
              <div className="relative w-full"><input id="hotp-out" readOnly placeholder="HOTP" className="w-full rounded-xl border p-3 font-mono text-xs dark:bg-slate-900 pr-12" /><div className="absolute top-2 right-2"><CopyButton getValue={()=> (document.getElementById('hotp-out') as HTMLInputElement)?.value || ''} /></div></div>
            </div>
          </ToolCard>
        )
      case 'pkce':
        return (
          <ToolCard title="PKCE Generator (S256)">
            <div className="flex flex-wrap gap-2 items-center">
              <button onClick={()=>{ const chars='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'; let s=''; const arr=new Uint32Array(64); crypto.getRandomValues(arr); for(let i=0;i<arr.length;i++){ s+=chars[arr[i]%chars.length] } (document.getElementById('pkce-verifier') as HTMLInputElement).value = s }} className="px-3 py-2 rounded-xl bg-slate-900 text-white">Generate verifier</button>
              <button onClick={async ()=>{ const v=(document.getElementById('pkce-verifier') as HTMLInputElement).value; const data=new TextEncoder().encode(v); const hash=new Uint8Array(await crypto.subtle.digest('SHA-256', data)); let bin=''; for(let i=0;i<hash.length;i++) bin+=String.fromCharCode(hash[i]); const b64=btoa(bin).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); (document.getElementById('pkce-challenge') as HTMLInputElement).value = b64 }} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">Derive challenge</button>
            </div>
            <div className="relative mt-2"><input id="pkce-verifier" placeholder="code_verifier" className="w-full rounded-xl border p-3 font-mono text-xs dark:bg-slate-900 pr-12" /><div className="absolute top-2 right-2"><CopyButton getValue={()=> (document.getElementById('pkce-verifier') as HTMLInputElement)?.value || ''} /></div></div>
            <div className="relative mt-2"><input id="pkce-challenge" readOnly placeholder="code_challenge (S256)" className="w-full rounded-xl border p-3 font-mono text-xs dark:bg-slate-900 pr-12" /><div className="absolute top-2 right-2"><CopyButton getValue={()=> (document.getElementById('pkce-challenge') as HTMLInputElement)?.value || ''} /></div></div>
          </ToolCard>
        )
      case 'ecc':
        return (
          <ToolCard title="ECC Key Pair (P-256, PEM)">
            <button onClick={async ()=>{ const { publicKey, privateKey } = await generateECDSAKeyPairPEM(); (document.getElementById('ecc-pub') as HTMLTextAreaElement).value = publicKey; (document.getElementById('ecc-priv') as HTMLTextAreaElement).value = privateKey }} className="px-3 py-2 rounded-xl bg-slate-900 text-white">Generate</button>
            <div className="relative mt-2"><textarea id="ecc-pub" readOnly placeholder="Public Key (PEM)" className="w-full h-40 rounded-xl border p-3 font-mono text-xs dark:bg-slate-900 pr-12" /><div className="absolute top-2 right-2"><CopyButton getValue={()=> (document.getElementById('ecc-pub') as HTMLTextAreaElement)?.value || ''} /></div></div>
            <div className="relative mt-2"><textarea id="ecc-priv" readOnly placeholder="Private Key (PEM)" className="w-full h-40 rounded-xl border p-3 font-mono text-xs dark:bg-slate-900 pr-12" /><div className="absolute top-2 right-2"><CopyButton getValue={()=> (document.getElementById('ecc-priv') as HTMLTextAreaElement)?.value || ''} /></div></div>
          </ToolCard>
        )
    }
  }

  const navItems: { key: typeof active, label: string }[] = [
    { key: 'hash', label: 'Hashing' },
    { key: 'aes', label: 'AES-GCM (PBKDF2)' },
    { key: 'jwt', label: 'JWT Decoder' },
    { key: 'pw', label: 'Password Hashing' },
    { key: 'jwtv', label: 'JWT Verify' },
    { key: 'rsa', label: 'RSA Keygen' },
    { key: 'x509', label: 'X.509 Decoder' },
    { key: 'saml', label: 'SAML Decoder' },
    { key: 'jwtSign', label: 'JWT Signer' },
    { key: 'hmac', label: 'HMAC Generator' },
    { key: 'filehash', label: 'File Hashing' },
    { key: 'totp', label: 'TOTP / HOTP' },
    { key: 'pkce', label: 'PKCE Generator' },
    { key: 'ecc', label: 'ECC Keygen (P-256)' },
  ]

  return (
    <div className="grid gap-6 md:grid-cols-[260px_1fr]">
      <div className="bg-white dark:bg-slate-950 rounded-2xl p-3 shadow-sm border border-slate-200 dark:border-slate-800 h-fit sticky top-24">
        <div className="text-sm font-semibold px-2 pb-2">Security Tools</div>
        <ul className="grid gap-1">
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
  )
}
