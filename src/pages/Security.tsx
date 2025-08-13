import React, { useState } from 'react'
import ToolCard from '../components/ToolCard'
import { hashString, aesEncrypt, aesDecrypt, jwtDecode } from '../utils/crypto'
import { bcryptHash, bcryptCompare, argon2Hash } from '../utils/passwords'
import { verifyHS256, verifyRS256 } from '../utils/jwt'

export default function Security() {
  const [text, setText] = useState('')
  const [algo, setAlgo] = useState<'MD5' | 'SHA1' | 'SHA256' | 'SHA512'>('SHA256')
  const [password, setPassword] = useState('')
  const [cipher, setCipher] = useState('')
  const [jwt, setJwt] = useState('')
  const decoded = jwt ? jwtDecode(jwt) : null

  return (
    <div className="grid gap-6">
      <ToolCard title="Hash (MD5, SHA-1, SHA-256, SHA-512)">
        <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Enter text…" className="w-full h-28 rounded-xl border p-3 dark:bg-slate-900" />
        <div className="flex gap-2 items-center">
          <label className="text-sm">Algorithm</label>
          <select value={algo} onChange={e=>setAlgo(e.target.value as any)} className="px-2 py-2 rounded-xl border dark:bg-slate-900">
            <option>MD5</option><option>SHA1</option><option>SHA256</option><option>SHA512</option>
          </select>
        </div>
        <input readOnly value={text ? hashString(text, algo) : ''} className="w-full rounded-xl border p-3 font-mono text-xs dark:bg-slate-900" />
      </ToolCard>

      <ToolCard title="AES-GCM Encrypt/Decrypt (Password)" description="PBKDF2 100k, Base64 payload (salt+IV+cipher).">
        <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Plaintext…" className="w-full h-28 rounded-xl border p-3 dark:bg-slate-900" />
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password…" className="w-full rounded-xl border p-3 dark:bg-slate-900" />
        <div className="grid md:grid-cols-2 gap-3">
          <button onClick={async ()=>setCipher(await aesEncrypt(text, password))} className="px-4 py-2 rounded-xl bg-slate-900 text-white">Encrypt →</button>
          <button onClick={async ()=>setText(await aesDecrypt(cipher, password).catch(()=> 'Decryption failed'))} className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">← Decrypt</button>
        </div>
        <textarea value={cipher} onChange={e=>setCipher(e.target.value)} placeholder="Cipher (Base64)…" className="w-full h-28 rounded-xl border p-3 font-mono text-xs dark:bg-slate-900" />
      </ToolCard>

      <ToolCard title="JWT Decoder" description="Decodes header & payload (no signature verification).">
        <input value={jwt} onChange={e=>setJwt(e.target.value)} placeholder="Paste JWT…" className="w-full rounded-xl border p-3 font-mono text-xs dark:bg-slate-900" />
        <pre className="rounded-xl border p-3 overflow-auto text-xs dark:bg-slate-900">{decoded ? JSON.stringify(decoded, null, 2) : 'Invalid or empty JWT'}</pre>
      </ToolCard>
    </div>
  )
}

<ToolCard title="Password Hashing (bcrypt, Argon2)">
  <input id="pw-in" placeholder="Password..." className="w-full rounded-xl border p-3 dark:bg-slate-900" />
  <div className="flex flex-wrap gap-2">
    <button onClick={()=>{ const v=(document.getElementById('pw-in') as HTMLInputElement).value; (document.getElementById('pw-out') as HTMLInputElement).value = bcryptHash(v) }} className="px-3 py-2 rounded-xl bg-slate-900 text-white">bcrypt Hash</button>
    <button onClick={async ()=>{ const v=(document.getElementById('pw-in') as HTMLInputElement).value; (document.getElementById('pw-out') as HTMLInputElement).value = await argon2Hash(v) }} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">Argon2 Hash</button>
    <button onClick={()=>{ const v=(document.getElementById('pw-in') as HTMLInputElement).value; const h=(document.getElementById('pw-out') as HTMLInputElement).value; (document.getElementById('pw-verify') as HTMLInputElement).value = bcryptCompare(v,h) ? 'OK' : 'NO' }} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">Verify bcrypt</button>
  </div>
  <input id="pw-out" readOnly className="w-full rounded-xl border p-3 dark:bg-slate-900" placeholder="Hash output"/>
  <input id="pw-verify" readOnly className="w-full rounded-xl border p-3 dark:bg-slate-900" placeholder="Verify result"/>
</ToolCard>

<ToolCard title="JWT Verify (HS256 / RS256)">
  <input id="jwt-verify-in" placeholder="JWT..." className="w-full rounded-xl border p-3 font-mono text-xs dark:bg-slate-900" />
  <input id="jwt-secret" placeholder="HS secret (for HS256)..." className="w-full rounded-xl border p-3 font-mono text-xs dark:bg-slate-900" />
  <textarea id="jwt-pem" placeholder="PEM public key (for RS256)..." className="w-full h-28 rounded-xl border p-3 font-mono text-xs dark:bg-slate-900" />
  <div className="flex gap-2">
    <button onClick={async ()=>{ const token=(document.getElementById('jwt-verify-in') as HTMLInputElement).value; const secret=(document.getElementById('jwt-secret') as HTMLInputElement).value; const ok = await verifyHS256(token, secret); (document.getElementById('jwt-verify-out') as HTMLInputElement).value = ok ? 'Valid (HS256)' : 'Invalid' }} className="px-3 py-2 rounded-xl bg-slate-900 text-white">Verify HS256</button>
    <button onClick={async ()=>{ const token=(document.getElementById('jwt-verify-in') as HTMLInputElement).value; const pem=(document.getElementById('jwt-pem') as HTMLInputElement).value; const ok = await verifyRS256(token, pem); (document.getElementById('jwt-verify-out') as HTMLInputElement).value = ok ? 'Valid (RS256)' : 'Invalid' }} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">Verify RS256</button>
  </div>
  <input id="jwt-verify-out" readOnly className="w-full rounded-xl border p-3 dark:bg-slate-900" />
</ToolCard>
