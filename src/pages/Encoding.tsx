import React, { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ToolCard from '../components/ToolCard'
import CopyButton from '../components/CopyButton'
import Head from '../components/Head'
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

type ToolKey = 'b64'|'b32'|'url'|'html'|'hexbin'|'rot'|'zip'|'b58'|'b85'|'utf'

type ToolState = {
  input: string
  output: string
  options?: Record<string, any>
}

export default function Encoding() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [active, setActive] = useState<ToolKey>(
    (searchParams.get('tool') as ToolKey) || 'b64'
  )
  useEffect(()=>{
    const t = searchParams.get('tool') as ToolKey
    if (t && t !== active) setActive(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])
  function selectTool(key: ToolKey){ setActive(key); setSearchParams({ tool: key }) }

  // Per-tool state map. Each tool stores its own input/output/options.
  const [store, setStore] = useState<Record<ToolKey, ToolState>>({})

  const current: ToolState = useMemo(() => (
    store[active] || { input: '', output: '', options: {} }
  ), [store, active])

  function updateCurrent(patch: Partial<ToolState>) {
    setStore(prev => {
      const prevForTool = prev[active] || { input: '', output: '', options: {} }
      return { ...prev, [active]: { ...prevForTool, ...patch, options: { ...(prevForTool.options||{}), ...(patch.options||{}) } } }
    })
  }

  const navItems: { key: ToolKey, label: string }[] = [
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
      case 'b64': {
        const urlSafe = !!current.options?.b64UrlSafe
        const noPad = !!current.options?.b64NoPad
        return (
          <ToolCard title="Base64" description="Base64 encodes data into a 64-character text alphabet so it can be safely stored or transmitted in text systems.">
            <textarea value={current.input} onChange={e=>updateCurrent({ input: e.target.value })} placeholder="Enter text…" className="w-full h-28 rounded-xl border p-3 dark:bg-slate-900" />
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400 mb-2">
              <label className="inline-flex items-center gap-2"><input type="checkbox" checked={urlSafe} onChange={e=>updateCurrent({ options: { b64UrlSafe: e.target.checked } })} /> URL-safe (-/_)</label>
              <label className="inline-flex items-center gap-2"><input type="checkbox" checked={noPad} onChange={e=>updateCurrent({ options: { b64NoPad: e.target.checked } })} /> Strip padding (=)</label>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <button onClick={()=>{ let v = safeBase64Encode(current.input); if (urlSafe) v = v.replace(/\+/g,'-').replace(/\//g,'_'); if (noPad) v = v.replace(/=+$/,''); updateCurrent({ output: v }) }} className="px-4 py-2 rounded-xl bg-slate-900 text-white">Encode →</button>
              <button onClick={()=>updateCurrent({ output: safeBase64Decode(current.input) })} className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">← Decode</button>
            </div>
            <div className="relative">
              <textarea readOnly value={current.output} placeholder="Output…" className="w-full h-28 rounded-xl border p-3 dark:bg-slate-900 pr-12" />
              <div className="absolute top-2 right-2"><CopyButton value={current.output} /></div>
            </div>
            <div className="mt-6 text-sm leading-6 text-slate-700 dark:text-slate-300 space-y-3">
              <h3 className="text-base font-semibold">How Base64 works (algorithm and math)</h3>
              <p>
                Base64 is a binary-to-text encoding. It takes raw bytes and maps them to a 64‑symbol alphabet so data can safely travel through text‑only systems.
                The standard alphabet is A–Z (26), a–z (26), 0–9 (10), plus + and /. A URL‑safe variant replaces + with - and / with _.
              </p>
              <p className="font-semibold">Bit grouping</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Group input bytes into blocks of 3 bytes = 24 bits.</li>
                <li>Split 24 bits into four 6‑bit chunks. Each 6‑bit value is between 0 and 63.</li>
                <li>Map each 6‑bit value to a Base64 character using the alphabet.</li>
              </ul>
              <p className="font-semibold">Padding (=)</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>If the input length is not a multiple of 3, we add 1 or 2 '=' characters so the output length becomes a multiple of 4.</li>
                <li>Example: 1 leftover byte (8 bits) becomes two 6‑bit symbols plus two '=' pads. 2 leftover bytes become three symbols plus one '='.</li>
              </ul>
              <p className="font-semibold">Mathematical view</p>
              <p>
                Let the three bytes be b0, b1, b2. Create a 24‑bit number: N = (b0 &lt;&lt; 16) | (b1 &lt;&lt; 8) | b2. Then extract indices:
              </p>
              <pre className="bg-slate-100 dark:bg-slate-800 rounded p-3 overflow-auto text-xs">
{`i0 = (N >> 18) & 0x3F
i1 = (N >> 12) & 0x3F
i2 = (N >>  6) & 0x3F
i3 =  N        & 0x3F`}
              </pre>
              <p>
                Finally, output chars = alphabet[i0] alphabet[i1] alphabet[i2] alphabet[i3], applying '=' padding if b1/b2 were missing. URL‑safe mode swaps +→- and /→_.
              </p>
              <p className="font-semibold">Decoding</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Reverse the mapping to recover 6‑bit values, pack them back into 24‑bit blocks, and split into the original 8‑bit bytes.</li>
                <li>Ignore padding '=' during reconstruction.</li>
              </ul>
              <p className="text-xs text-slate-500 dark:text-slate-400">Note: This tool encodes/decodes UTF‑8 text, supports optional URL‑safe alphabet and optional padding removal.</p>
            </div>
          </ToolCard>
        )
      }
      case 'b32':
        return (
          <ToolCard title="Base32" description="Base32 encodes data using A–Z and 2–7, useful in case-insensitive or restricted text environments.">
            <textarea value={current.input} onChange={e=>updateCurrent({ input: e.target.value })} placeholder="Enter text…" className="w-full h-28 rounded-xl border p-3 dark:bg-slate-900" />
            <div className="grid md:grid-cols-2 gap-3">
              <button onClick={()=>updateCurrent({ output: base32Encode(current.input) })} className="px-4 py-2 rounded-xl bg-slate-900 text-white">Encode →</button>
              <button onClick={()=>updateCurrent({ output: base32Decode(current.input) })} className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">← Decode</button>
            </div>
            <div className="relative">
              <textarea readOnly value={current.output} placeholder="Output…" className="w-full h-28 rounded-xl border p-3 dark:bg-slate-900 pr-12" />
              <div className="absolute top-2 right-2"><CopyButton value={current.output} /></div>
            </div>
          </ToolCard>
        )
      case 'url':
        return (
          <ToolCard title="URL Encode/Decode" description="Percent-encoding for URLs and HTTP so special characters are safely represented.">
            <textarea value={current.input} onChange={e=>updateCurrent({ input: e.target.value })} placeholder="Enter text…" className="w-full h-28 rounded-xl border p-3 dark:bg-slate-900" />
            <div className="grid md:grid-cols-2 gap-3">
              <button onClick={()=>updateCurrent({ output: encodeURIComponent(current.input) })} className="px-4 py-2 rounded-xl bg-slate-900 text-white">Encode →</button>
              <button onClick={()=>{ try { updateCurrent({ output: decodeURIComponent(current.input) }) } catch { updateCurrent({ output: 'Invalid percent-encoding' }) } }} className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">← Decode</button>
            </div>
            <div className="relative">
              <textarea readOnly value={current.output} placeholder="Output…" className="w-full h-28 rounded-xl border p-3 dark:bg-slate-900 pr-12" />
              <div className="absolute top-2 right-2"><CopyButton value={current.output} /></div>
            </div>
          </ToolCard>
        )
      case 'html':
        return (
          <ToolCard
            title="HTML Entities"
            description="Convert characters to and from HTML entity forms (e.g., &lt;, &gt;, &amp;)."
          >
            <textarea
              value={current.input}
              onChange={e=>updateCurrent({ input: e.target.value })}
              placeholder="Enter text…"
              className="w-full h-28 rounded-xl border p-3 dark:bg-slate-900"
            />
            <div className="grid md:grid-cols-2 gap-3">
              <button
                onClick={()=>updateCurrent({ output: htmlEncode(current.input) })}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white"
              >
                Encode →
              </button>
              <button
                onClick={()=>updateCurrent({ output: htmlDecode(current.input) })}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800"
              >
                ← Decode
              </button>
            </div>
            <div className="relative">
              <textarea
                readOnly
                value={current.output}
                placeholder="Output…"
                className="w-full h-28 rounded-xl border p-3 dark:bg-slate-900 pr-12"
              />
              <div className="absolute top-2 right-2">
                <CopyButton value={current.output} />
              </div>
            </div>
          </ToolCard>
        )
      case 'hexbin': {
        const hexUpper = !!current.options?.hexUpper
        return (
          <ToolCard title="Hex ↔ Binary ↔ Text" description="Convert between plain text, hexadecimal, and binary representations of data bytes.">
            <textarea value={current.input} onChange={e=>updateCurrent({ input: e.target.value })} placeholder="Text…" className="w-full h-28 rounded-xl border p-3 dark:bg-slate-900" />
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400 mb-2">
              <label className="inline-flex items-center gap-2"><input type="checkbox" checked={hexUpper} onChange={e=>updateCurrent({ options: { hexUpper: e.target.checked } })} /> Uppercase hex</label>
            </div>
            <div className="grid md:grid-cols-3 gap-3">
              <button onClick={()=>{ const v=textToHex(current.input); updateCurrent({ output: hexUpper? v.toUpperCase(): v }) }} className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">Text → Hex</button>
              <button onClick={()=>updateCurrent({ output: textToBinary(current.input) })} className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">Text → Binary</button>
              <button onClick={()=>updateCurrent({ output: hexToText(current.input) })} className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">Hex → Text</button>
              <button onClick={()=>updateCurrent({ output: binaryToText(current.input) })} className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">Binary → Text</button>
              <button onClick={()=>updateCurrent({ output: hexToBinary(current.input) })} className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">Hex → Binary</button>
              <button onClick={()=>{ const v=binaryToHex(current.input); updateCurrent({ output: hexUpper? v.toUpperCase(): v }) }} className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">Binary → Hex</button>
            </div>
            <div className="relative">
              <textarea readOnly value={current.output} placeholder="Output…" className="w-full h-28 rounded-xl border p-3 dark:bg-slate-900 pr-12" />
              <div className="absolute top-2 right-2"><CopyButton value={current.output} /></div>
            </div>
          </ToolCard>
        )
      }
      case 'zip': {
        function u8ToB64(u8: Uint8Array){ let bin=''; for (let i=0;i<u8.length;i++) bin += String.fromCharCode(u8[i]); return btoa(bin) }
        function b64ToU8(b64: string){ const bin = atob(b64.trim()); const u8 = new Uint8Array(bin.length); for (let i=0;i<bin.length;i++) u8[i] = bin.charCodeAt(i); return u8 }
        return (
          <ToolCard title="Gzip / Deflate" description="Gzip and Deflate are compression formats for reducing data size.">
            <textarea value={current.input} onChange={e=>updateCurrent({ input: e.target.value })} placeholder="Text…" className="w-full h-28 rounded-xl border p-3 dark:bg-slate-900" />
            <div className="grid md:grid-cols-2 gap-3">
              <button onClick={()=>{ try { const u8in = new TextEncoder().encode(current.input); const out = gzip(u8in); updateCurrent({ output: u8ToB64(out) }) } catch { updateCurrent({ output: 'Gzip failed' }) } }} className="px-4 py-2 rounded-xl bg-slate-900 text-white">Gzip → Base64</button>
              <button onClick={()=>{ try { const u8in = new TextEncoder().encode(current.input); const out = deflate(u8in); updateCurrent({ output: u8ToB64(out) }) } catch { updateCurrent({ output: 'Deflate failed' }) } }} className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">Deflate → Base64</button>
            </div>
            <div className="grid md:grid-cols-2 gap-3 mt-2">
              <button onClick={()=>{ try { const u8 = b64ToU8(current.input); const txt = new TextDecoder().decode(ungzip(u8)); updateCurrent({ output: txt }) } catch { updateCurrent({ output: 'Invalid gzip/Base64' }) } }} className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">Gunzip (Base64) → Text</button>
              <button onClick={()=>{ try { const u8 = b64ToU8(current.input); const txt = new TextDecoder().decode(inflate(u8)); updateCurrent({ output: txt }) } catch { updateCurrent({ output: 'Invalid deflate/Base64' }) } }} className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">Inflate (Base64) → Text</button>
            </div>
            <div className="relative mt-2">
              <textarea readOnly value={current.output} placeholder="Output…" className="w-full h-28 rounded-xl border p-3 dark:bg-slate-900 pr-12" />
              <div className="absolute top-2 right-2"><CopyButton value={current.output} /></div>
            </div>
          </ToolCard>
        )
      }
      case 'b58':
        return (
          <ToolCard title="Base58 (Bitcoin alphabet)" description="Base58 is a text encoding that avoids ambiguous characters (used by Bitcoin).">
            <textarea value={current.input} onChange={e=>updateCurrent({ input: e.target.value })} placeholder="Enter text…" className="w-full h-28 rounded-xl border p-3 dark:bg-slate-900" />
            <div className="grid md:grid-cols-2 gap-3">
              <button onClick={()=>updateCurrent({ output: base58Encode(current.input) })} className="px-4 py-2 rounded-xl bg-slate-900 text-white">Encode →</button>
              <button onClick={()=>updateCurrent({ output: base58Decode(current.input) })} className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">← Decode</button>
            </div>
            <div className="relative">
              <textarea readOnly value={current.output} placeholder="Output…" className="w-full h-28 rounded-xl border p-3 dark:bg-slate-900 pr-12" />
              <div className="absolute top-2 right-2"><CopyButton value={current.output} /></div>
            </div>
          </ToolCard>
        )
      case 'b85':
        return (
          <ToolCard title="Ascii85 (Base85)" description="Ascii85/Base85 encodes binary data into a compact ASCII representation.">
            <textarea value={current.input} onChange={e=>updateCurrent({ input: e.target.value })} placeholder="Enter text…" className="w-full h-28 rounded-xl border p-3 dark:bg-slate-900" />
            <div className="grid md:grid-cols-2 gap-3">
              <button onClick={()=>updateCurrent({ output: ascii85Encode(current.input) })} className="px-4 py-2 rounded-xl bg-slate-900 text-white">Encode →</button>
              <button onClick={()=>updateCurrent({ output: ascii85Decode(current.input) })} className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">← Decode</button>
            </div>
            <div className="relative">
              <textarea readOnly value={current.output} placeholder="Output…" className="w-full h-28 rounded-xl border p-3 dark:bg-slate-900 pr-12" />
              <div className="absolute top-2 right-2"><CopyButton value={current.output} /></div>
            </div>
          </ToolCard>
        )
      case 'utf':
        return (
          <ToolCard title="UTF-16 / UTF-32 ↔ Hex" description="Represent Unicode text as UTF-16 or UTF-32 and convert to/from hexadecimal bytes.">
            <textarea value={current.input} onChange={e=>updateCurrent({ input: e.target.value })} placeholder="Text or Hex…" className="w-full h-28 rounded-xl border p-3 dark:bg-slate-900" />
            <div className="grid md:grid-cols-3 gap-3">
              <div className="flex items-center gap-2"><label className="text-sm">Type</label><select id="utf-type" className="px-2 py-2 rounded-xl border dark:bg-slate-900"><option>UTF-16</option><option>UTF-32</option></select></div>
              <div className="flex items-center gap-2"><label className="text-sm">Endian</label><select id="utf-end" className="px-2 py-2 rounded-xl border dark:bg-slate-900"><option>LE</option><option>BE</option></select></div>
            </div>
            <div className="grid md:grid-cols-2 gap-3 mt-2">
              <button onClick={()=>{ const t=(document.getElementById('utf-type') as HTMLSelectElement).value; const e=(document.getElementById('utf-end') as HTMLSelectElement).value as 'LE'|'BE'; const v = t==='UTF-16'? utf16ToHex(current.input, e) : utf32ToHex(current.input, e); updateCurrent({ output: v }) }} className="px-4 py-2 rounded-xl bg-slate-900 text-white">Text → Hex</button>
              <button onClick={()=>{ const t=(document.getElementById('utf-type') as HTMLSelectElement).value; const e=(document.getElementById('utf-end') as HTMLSelectElement).value as 'LE'|'BE'; const v = t==='UTF-16'? hexToUtf16(current.input, e) : hexToUtf32(current.input, e); updateCurrent({ output: v }) }} className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">Hex → Text</button>
            </div>
            <div className="relative mt-2">
              <textarea readOnly value={current.output} placeholder="Output…" className="w-full h-28 rounded-xl border p-3 dark:bg-slate-900 pr-12" />
              <div className="absolute top-2 right-2"><CopyButton value={current.output} /></div>
            </div>
          </ToolCard>
        )
      case 'rot':
        return (
          <ToolCard title="ROT13 / Caesar">
            <textarea value={current.input} onChange={e=>updateCurrent({ input: e.target.value })} placeholder="Enter text…" className="w-full h-28 rounded-xl border p-3 dark:bg-slate-900" />
            <div className="grid md:grid-cols-2 gap-3">
              <button onClick={()=>updateCurrent({ output: rotN(current.input, 13) })} className="px-4 py-2 rounded-xl bg-slate-900 text-white">ROT13</button>
              <button onClick={()=>updateCurrent({ output: rotN(current.input, 3) })} className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">Caesar (3)</button>
            </div>
            <div className="relative">
              <textarea readOnly value={current.output} placeholder="Output…" className="w-full h-28 rounded-xl border p-3 dark:bg-slate-900 pr-12" />
              <div className="absolute top-2 right-2"><CopyButton value={current.output} /></div>
            </div>
          </ToolCard>
        )
    }
  }

  return (
    <>
      <Head title="String Ninja — Encoding Tools (Base64, Base32, URL, HTML, Hex/Binary)" description="Encode/decode Base64, Base32, URL, HTML entities; convert Hex/Binary/Text; ROT13/Caesar; gzip/deflate; Base58/Base85; UTF-16/UTF-32." />
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
    </>
  )
}
