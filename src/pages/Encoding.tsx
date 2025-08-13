import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ToolCard from '../components/ToolCard'
import CopyButton from '../components/CopyButton'
import { base32Decode, base32Encode, binaryToHex, binaryToText, hexToBinary, htmlDecode, htmlEncode, rotN, textToBinary, textToHex, hexToText, base58Encode, base58Decode, ascii85Encode, ascii85Decode, utf16ToHex, hexToUtf16, utf32ToHex, hexToUtf32 } from '../utils/conversions'
import { deflate, inflate, gzip, ungzip } from 'pako'

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
  const [active, setActive] = useState<'b64'|'b32'|'url'|'html'|'hexbin'|'rot'|'zip'|'b58'|'b85'|'utf'>(
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
  const [b64UrlSafe, setB64UrlSafe] = useState(true)
  const [b64NoPad, setB64NoPad] = useState(true)
  const [b32, setB32] = useState('')
  const [urlEnc, setUrlEnc] = useState('')
  const [html, setHtml] = useState('')
  const [rot, setRot] = useState('')
  const [hexUpper, setHexUpper] = useState(false)

  const navItems: { key: typeof active, label: string }[] = [
    { key: 'b64', label: 'Base64' },
    { key: 'b32', label: 'Base32' },
    { key: 'url', label: 'URL Encode/Decode' },
    { key: 'html', label: 'HTML Entities' },
    { key: 'hexbin', label: 'Hex / Binary / Text' },
    { key: 'rot', label: 'ROT13 / Caesar' },
    { key: 'zip', label: 'Gzip / Deflate' },
    { key: 'b58', label: 'Base58' },
    { key: 'b85', label: 'Ascii85 (Base85)' },
    { key: 'utf', label: 'UTF-16 / UTF-32' },
  ]

  function renderPanel() {
    switch (active) {
      case 'b64':
        return (
          <ToolCard title="Base64">
            <textarea value={input} onChange={e=>setInput(e.target.value)} placeholder="Enter text…" className="w-full h-28 rounded-xl border p-3 dark:bg-slate-900" />
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400 mb-2">
              <label className="inline-flex items-center gap-2"><input type="checkbox" checked={b64UrlSafe} onChange={e=>setB64UrlSafe(e.target.checked)} /> URL-safe (-/_)</label>
              <label className="inline-flex items-center gap-2"><input type="checkbox" checked={b64NoPad} onChange={e=>setB64NoPad(e.target.checked)} /> Strip padding (=)</label>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <button onClick={()=>{ let v = safeBase64Encode(input); if (b64UrlSafe) v = v.replace(/\+/g,'-').replace(/\//g,'_'); if (b64NoPad) v = v.replace(/=+$/,''); setB64(v) }} className="px-4 py-2 rounded-xl bg-slate-900 text-white">Encode →</button>
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
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400 mb-2">
              <label className="inline-flex items-center gap-2"><input type="checkbox" checked={hexUpper} onChange={e=>setHexUpper(e.target.checked)} /> Uppercase hex</label>
            </div>
            <div className="grid md:grid-cols-3 gap-3">
              <button onClick={()=>{ const v=textToHex(input); setHtml(hexUpper? v.toUpperCase(): v) }} className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">Text → Hex</button>
              <button onClick={()=>setHtml(textToBinary(input))} className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">Text → Binary</button>
              <button onClick={()=>setHtml(hexToText(html))} className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">Hex → Text</button>
              <button onClick={()=>setHtml(binaryToText(html))} className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">Binary → Text</button>
              <button onClick={()=>setHtml(hexToBinary(html))} className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">Hex → Binary</button>
              <button onClick={()=>{ const v=binaryToHex(html); setHtml(hexUpper? v.toUpperCase(): v) }} className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">Binary → Hex</button>
            </div>
            <div className="relative">
              <textarea value={html} onChange={e=>setHtml(e.target.value)} placeholder="Output…" className="w-full h-28 rounded-xl border p-3 dark:bg-slate-900 pr-12" />
              <div className="absolute top-2 right-2"><CopyButton value={html} /></div>
            </div>
          </ToolCard>
        )
      case 'zip':
        function u8ToB64(u8: Uint8Array){ let bin=''; for (let i=0;i<u8.length;i++) bin += String.fromCharCode(u8[i]); return btoa(bin) }
        function b64ToU8(b64: string){ const bin = atob(b64.trim()); const u8 = new Uint8Array(bin.length); for (let i=0;i<bin.length;i++) u8[i] = bin.charCodeAt(i); return u8 }
        return (
          <ToolCard title="Gzip / Deflate">
            <textarea value={input} onChange={e=>setInput(e.target.value)} placeholder="Text…" className="w-full h-28 rounded-xl border p-3 dark:bg-slate-900" />
            <div className="grid md:grid-cols-2 gap-3">
              {/* <button onClick={()=>{ const out = gzip(input, { to: 'uint8array' }) as unknown as Uint8Array; setHtml(u8ToB64(out)) }} className="px-4 py-2 rounded-xl bg-slate-900 text-white">Gzip → Base64</button> */}
              {/* <button onClick={()=>{ const out = deflate(input, { to: 'uint8array' }) as unknown as Uint8Array; setHtml(u8ToB64(out)) }} className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">Deflate → Base64</button> */}
            </div>
            <div className="grid md:grid-cols-2 gap-3 mt-2">
              <button onClick={()=>{ try { const u8 = b64ToU8(html); const txt = new TextDecoder().decode(ungzip(u8)); setHtml(txt) } catch { setHtml('Invalid gzip/Base64') } }} className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">Gunzip (Base64) → Text</button>
              <button onClick={()=>{ try { const u8 = b64ToU8(html); const txt = new TextDecoder().decode(inflate(u8)); setHtml(txt) } catch { setHtml('Invalid deflate/Base64') } }} className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">Inflate (Base64) → Text</button>
            </div>
            <div className="relative mt-2">
              <textarea value={html} onChange={e=>setHtml(e.target.value)} placeholder="Output…" className="w-full h-28 rounded-xl border p-3 dark:bg-slate-900 pr-12" />
              <div className="absolute top-2 right-2"><CopyButton value={html} /></div>
            </div>
          </ToolCard>
        )
      case 'b58':
        return (
          <ToolCard title="Base58 (Bitcoin alphabet)">
            <textarea value={input} onChange={e=>setInput(e.target.value)} placeholder="Enter text…" className="w-full h-28 rounded-xl border p-3 dark:bg-slate-900" />
            <div className="grid md:grid-cols-2 gap-3">
              <button onClick={()=>setB32(base58Encode(input))} className="px-4 py-2 rounded-xl bg-slate-900 text-white">Encode →</button>
              <button onClick={()=>setB32(base58Decode(b32))} className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">← Decode</button>
            </div>
            <div className="relative">
              <textarea value={b32} onChange={e=>setB32(e.target.value)} placeholder="Output…" className="w-full h-28 rounded-xl border p-3 dark:bg-slate-900 pr-12" />
              <div className="absolute top-2 right-2"><CopyButton value={b32} /></div>
            </div>
          </ToolCard>
        )
      case 'b85':
        return (
          <ToolCard title="Ascii85 (Base85)">
            <textarea value={input} onChange={e=>setInput(e.target.value)} placeholder="Enter text…" className="w-full h-28 rounded-xl border p-3 dark:bg-slate-900" />
            <div className="grid md:grid-cols-2 gap-3">
              <button onClick={()=>setB32(ascii85Encode(input))} className="px-4 py-2 rounded-xl bg-slate-900 text-white">Encode →</button>
              <button onClick={()=>setB32(ascii85Decode(b32))} className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">← Decode</button>
            </div>
            <div className="relative">
              <textarea value={b32} onChange={e=>setB32(e.target.value)} placeholder="Output…" className="w-full h-28 rounded-xl border p-3 dark:bg-slate-900 pr-12" />
              <div className="absolute top-2 right-2"><CopyButton value={b32} /></div>
            </div>
          </ToolCard>
        )
      case 'utf':
        return (
          <ToolCard title="UTF-16 / UTF-32 ↔ Hex">
            <textarea value={input} onChange={e=>setInput(e.target.value)} placeholder="Text or Hex…" className="w-full h-28 rounded-xl border p-3 dark:bg-slate-900" />
            <div className="grid md:grid-cols-3 gap-3">
              <div className="flex items-center gap-2"><label className="text-sm">Type</label><select id="utf-type" className="px-2 py-2 rounded-xl border dark:bg-slate-900"><option>UTF-16</option><option>UTF-32</option></select></div>
              <div className="flex items-center gap-2"><label className="text-sm">Endian</label><select id="utf-end" className="px-2 py-2 rounded-xl border dark:bg-slate-900"><option>LE</option><option>BE</option></select></div>
            </div>
            <div className="grid md:grid-cols-2 gap-3 mt-2">
              <button onClick={()=>{ const t=(document.getElementById('utf-type') as HTMLSelectElement).value; const e=(document.getElementById('utf-end') as HTMLSelectElement).value as 'LE'|'BE'; const v = t==='UTF-16'? utf16ToHex(input, e) : utf32ToHex(input, e); setHtml(v) }} className="px-4 py-2 rounded-xl bg-slate-900 text-white">Text → Hex</button>
              <button onClick={()=>{ const t=(document.getElementById('utf-type') as HTMLSelectElement).value; const e=(document.getElementById('utf-end') as HTMLSelectElement).value as 'LE'|'BE'; const v = t==='UTF-16'? hexToUtf16(html, e) : hexToUtf32(html, e); setHtml(v) }} className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">Hex → Text</button>
            </div>
            <div className="relative mt-2">
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
