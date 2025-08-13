import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ToolCard from '../components/ToolCard'
import CopyButton from '../components/CopyButton'
import { base32Decode, base32Encode, binaryToHex, binaryToText, hexToBinary, htmlDecode, htmlEncode, rotN, textToBinary, textToHex, hexToText } from '../utils/conversions'

function safeBase64Encode(input: string) {
  // UTF-8 safe encode
  const bytes = new TextEncoder().encode(input)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}
function safeBase64Decode(input: string) {
  try {
    // Normalize: strip whitespace, handle URL-safe variants, and fix padding
    const cleaned = input.trim().replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/')
    const padded = cleaned + '==='.slice((cleaned.length + 3) % 4)
    const binary = atob(padded)
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0))
    return new TextDecoder().decode(bytes)
  } catch {
    return 'Invalid Base64'
  }
}

export default function Encoding() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [active, setActive] = useState<'b64'|'b32'|'url'|'html'|'hexbin'|'rot'>(
    (searchParams.get('tool') as any) || 'b64'
  )
  useEffect(()=>{
    const t = searchParams.get('tool') as any
    if (t && t !== active) setActive(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])
  function selectTool(key: typeof active){ setActive(key); setSearchParams({ tool: key }) }

  // Shared state across tools (keeps previous behavior and lets users reuse inputs)
  const [input, setInput] = useState('')
  const [b64, setB64] = useState('')
  const [b32, setB32] = useState('')
  const [urlEnc, setUrlEnc] = useState('')
  const [html, setHtml] = useState('')
  const [rot, setRot] = useState('')

  const navItems: { key: typeof active, label: string }[] = [
    { key: 'b64', label: 'Base64' },
    { key: 'b32', label: 'Base32' },
    { key: 'url', label: 'URL Encode/Decode' },
    { key: 'html', label: 'HTML Entities' },
    { key: 'hexbin', label: 'Hex / Binary / Text' },
    { key: 'rot', label: 'ROT13 / Caesar' },
  ]

  function renderPanel() {
    switch (active) {
      case 'b64':
        return (
          <ToolCard title="Base64">
            <textarea value={input} onChange={e=>setInput(e.target.value)} placeholder="Enter text…" className="w-full h-28 rounded-xl border p-3 dark:bg-slate-900" />
            <div className="grid md:grid-cols-2 gap-3">
              <button onClick={()=>setB64(safeBase64Encode(input))} className="px-4 py-2 rounded-xl bg-slate-900 text-white">Encode →</button>
              <button onClick={()=>setB64(safeBase64Decode(b64))} className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">← Decode</button>
            </div>
            <div className="relative">
              <textarea value={b64} onChange={e=>setB64(e.target.value)} placeholder="Output…" className="w-full h-28 rounded-xl border p-3 dark:bg-slate-900 pr-12" />
              <div className="absolute top-2 right-2"><CopyButton value={b64} /></div>
            </div>
          </ToolCard>
        )
      case 'b32':
        return (
          <ToolCard title="Base32">
            <textarea value={input} onChange={e=>setInput(e.target.value)} placeholder="Enter text…" className="w-full h-28 rounded-xl border p-3 dark:bg-slate-900" />
            <div className="grid md:grid-cols-2 gap-3">
              <button onClick={()=>setB32(base32Encode(input))} className="px-4 py-2 rounded-xl bg-slate-900 text-white">Encode →</button>
              <button onClick={()=>setB32(base32Decode(b32))} className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">← Decode</button>
            </div>
            <div className="relative">
              <textarea value={b32} onChange={e=>setB32(e.target.value)} placeholder="Output…" className="w-full h-28 rounded-xl border p-3 dark:bg-slate-900 pr-12" />
              <div className="absolute top-2 right-2"><CopyButton value={b32} /></div>
            </div>
          </ToolCard>
        )
      case 'url':
        return (
          <ToolCard title="URL Encode/Decode">
            <textarea value={input} onChange={e=>setInput(e.target.value)} placeholder="Enter text…" className="w-full h-28 rounded-xl border p-3 dark:bg-slate-900" />
            <div className="grid md:grid-cols-2 gap-3">
              <button onClick={()=>setUrlEnc(encodeURIComponent(input))} className="px-4 py-2 rounded-xl bg-slate-900 text-white">Encode →</button>
              <button onClick={()=>setUrlEnc(decodeURIComponent(urlEnc))} className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">← Decode</button>
            </div>
            <div className="relative">
              <textarea value={urlEnc} onChange={e=>setUrlEnc(e.target.value)} placeholder="Output…" className="w-full h-28 rounded-xl border p-3 dark:bg-slate-900 pr-12" />
              <div className="absolute top-2 right-2"><CopyButton value={urlEnc} /></div>
            </div>
          </ToolCard>
        )
      case 'html':
        return (
          <ToolCard title="HTML Entities">
            <textarea value={input} onChange={e=>setInput(e.target.value)} placeholder="Enter text…" className="w-full h-28 rounded-xl border p-3 dark:bg-slate-900" />
            <div className="grid md:grid-cols-2 gap-3">
              <button onClick={()=>setHtml(htmlEncode(input))} className="px-4 py-2 rounded-xl bg-slate-900 text-white">Encode →</button>
              <button onClick={()=>setHtml(htmlDecode(html))} className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">← Decode</button>
            </div>
            <div className="relative">
              <textarea value={html} onChange={e=>setHtml(e.target.value)} placeholder="Output…" className="w-full h-28 rounded-xl border p-3 dark:bg-slate-900 pr-12" />
              <div className="absolute top-2 right-2"><CopyButton value={html} /></div>
            </div>
          </ToolCard>
        )
      case 'hexbin':
        return (
          <ToolCard title="Hex ↔ Binary ↔ Text">
            <textarea value={input} onChange={e=>setInput(e.target.value)} placeholder="Text…" className="w-full h-28 rounded-xl border p-3 dark:bg-slate-900" />
            <div className="grid md:grid-cols-3 gap-3">
              <button onClick={()=>setHtml(textToHex(input))} className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">Text → Hex</button>
              <button onClick={()=>setHtml(textToBinary(input))} className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">Text → Binary</button>
              <button onClick={()=>setHtml(hexToText(html))} className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">Hex → Text</button>
              <button onClick={()=>setHtml(binaryToText(html))} className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">Binary → Text</button>
              <button onClick={()=>setHtml(hexToBinary(html))} className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">Hex → Binary</button>
              <button onClick={()=>setHtml(binaryToHex(html))} className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">Binary → Hex</button>
            </div>
            <div className="relative">
              <textarea value={html} onChange={e=>setHtml(e.target.value)} placeholder="Output…" className="w-full h-28 rounded-xl border p-3 dark:bg-slate-900 pr-12" />
              <div className="absolute top-2 right-2"><CopyButton value={html} /></div>
            </div>
          </ToolCard>
        )
      case 'rot':
        return (
          <ToolCard title="ROT13 / Caesar">
            <textarea value={input} onChange={e=>setInput(e.target.value)} placeholder="Enter text…" className="w-full h-28 rounded-xl border p-3 dark:bg-slate-900" />
            <div className="grid md:grid-cols-2 gap-3">
              <button onClick={()=>setRot(rotN(input, 13))} className="px-4 py-2 rounded-xl bg-slate-900 text-white">ROT13</button>
              <button onClick={()=>setRot(rotN(input, 3))} className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">Caesar (3)</button>
            </div>
            <div className="relative">
              <textarea value={rot} onChange={e=>setRot(e.target.value)} placeholder="Output…" className="w-full h-28 rounded-xl border p-3 dark:bg-slate-900 pr-12" />
              <div className="absolute top-2 right-2"><CopyButton value={rot} /></div>
            </div>
          </ToolCard>
        )
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-[220px_1fr]">
      <div className="bg-white dark:bg-slate-950 rounded-2xl p-3 shadow-sm border border-slate-200 dark:border-slate-800 h-fit sticky top-24">
        <div className="text-sm font-semibold px-2 pb-2">Encoding Tools</div>
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
