import React, { useState } from 'react'
import ToolCard from '../components/ToolCard'
import { base32Decode, base32Encode, binaryToText, htmlDecode, htmlEncode, rotN, textToBinary, textToHex, hexToText } from '../utils/conversions'

function safeBase64Encode(input: string) { return btoa(unescape(encodeURIComponent(input))) }
function safeBase64Decode(input: string) {
  try { return decodeURIComponent(escape(atob(input))) } catch { return 'Invalid Base64' }
}

export default function Encoding() {
  const [input, setInput] = useState('')
  const [b64, setB64] = useState('')
  const [b32, setB32] = useState('')
  const [urlEnc, setUrlEnc] = useState('')
  const [html, setHtml] = useState('')
  const [rot, setRot] = useState('')

  return (
    <div className="grid gap-6">
      <ToolCard title="Base64">
        <textarea value={input} onChange={e=>setInput(e.target.value)} placeholder="Enter text…" className="w-full h-28 rounded-xl border p-3 dark:bg-slate-900" />
        <div className="grid md:grid-cols-2 gap-3">
          <button onClick={()=>setB64(safeBase64Encode(input))} className="px-4 py-2 rounded-xl bg-slate-900 text-white">Encode →</button>
          <button onClick={()=>setInput(safeBase64Decode(b64))} className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">← Decode</button>
        </div>
        <textarea value={b64} onChange={e=>setB64(e.target.value)} placeholder="Base64…" className="w-full h-28 rounded-xl border p-3 dark:bg-slate-900" />
      </ToolCard>

      <ToolCard title="Base32">
        <textarea value={input} onChange={e=>setInput(e.target.value)} placeholder="Enter text…" className="w-full h-28 rounded-xl border p-3 dark:bg-slate-900" />
        <div className="grid md:grid-cols-2 gap-3">
          <button onClick={()=>setB32(base32Encode(input))} className="px-4 py-2 rounded-xl bg-slate-900 text-white">Encode →</button>
          <button onClick={()=>setInput(base32Decode(b32))} className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">← Decode</button>
        </div>
        <textarea value={b32} onChange={e=>setB32(e.target.value)} placeholder="Base32…" className="w-full h-28 rounded-xl border p-3 dark:bg-slate-900" />
      </ToolCard>

      <ToolCard title="URL Encode/Decode">
        <textarea value={input} onChange={e=>setInput(e.target.value)} placeholder="Enter text…" className="w-full h-28 rounded-xl border p-3 dark:bg-slate-900" />
        <div className="grid md:grid-cols-2 gap-3">
          <button onClick={()=>setUrlEnc(encodeURIComponent(input))} className="px-4 py-2 rounded-xl bg-slate-900 text-white">Encode →</button>
          <button onClick={()=>setInput(decodeURIComponent(urlEnc))} className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">← Decode</button>
        </div>
        <textarea value={urlEnc} onChange={e=>setUrlEnc(e.target.value)} placeholder="URL encoded…" className="w-full h-28 rounded-xl border p-3 dark:bg-slate-900" />
      </ToolCard>

      <ToolCard title="HTML Entities">
        <textarea value={input} onChange={e=>setInput(e.target.value)} placeholder="Enter text…" className="w-full h-28 rounded-xl border p-3 dark:bg-slate-900" />
        <div className="grid md:grid-cols-2 gap-3">
          <button onClick={()=>setHtml(htmlEncode(input))} className="px-4 py-2 rounded-xl bg-slate-900 text-white">Encode →</button>
          <button onClick={()=>setInput(htmlDecode(html))} className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">← Decode</button>
        </div>
        <textarea value={html} onChange={e=>setHtml(e.target.value)} placeholder="HTML…" className="w-full h-28 rounded-xl border p-3 dark:bg-slate-900" />
      </ToolCard>

      <ToolCard title="Hex ↔ Binary ↔ Text">
        <textarea value={input} onChange={e=>setInput(e.target.value)} placeholder="Text…" className="w-full h-28 rounded-xl border p-3 dark:bg-slate-900" />
        <div className="grid md:grid-cols-3 gap-3">
          <button onClick={()=>setHtml(textToHex(input))} className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">Text → Hex</button>
          <button onClick={()=>setHtml(textToBinary(input))} className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">Text → Binary</button>
          <button onClick={()=>setInput(hexToText(html))} className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">Hex → Text</button>
        </div>
        <textarea value={html} onChange={e=>setHtml(e.target.value)} placeholder="Hex or Binary output…" className="w-full h-28 rounded-xl border p-3 dark:bg-slate-900" />
      </ToolCard>

      <ToolCard title="ROT13 / Caesar">
        <textarea value={input} onChange={e=>setInput(e.target.value)} placeholder="Enter text…" className="w-full h-28 rounded-xl border p-3 dark:bg-slate-900" />
        <div className="grid md:grid-cols-2 gap-3">
          <button onClick={()=>setRot(rotN(input, 13))} className="px-4 py-2 rounded-xl bg-slate-900 text-white">ROT13</button>
          <button onClick={()=>setRot(rotN(input, 3))} className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">Caesar (3)</button>
        </div>
        <textarea value={rot} onChange={e=>setRot(e.target.value)} placeholder="Output…" className="w-full h-28 rounded-xl border p-3 dark:bg-slate-900" />
      </ToolCard>
    </div>
  )
}
