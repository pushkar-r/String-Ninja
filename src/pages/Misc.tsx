import React, { useState } from 'react'
import ToolCard from '../components/ToolCard'
import CopyButton from '../components/CopyButton'
import Head from '../components/Head'
import { v4 as uuidv4 } from 'uuid'
import Papa from 'papaparse'
import { hideTextInImage, extractTextFromImage } from '../utils/stego'

export default function Misc() {
  const [active, setActive] = useState<'ts'|'rand'|'regex'|'stego'|'csv'|'saved'>('ts')

  const [unix, setUnix] = useState<string>('')
  const [readable, setReadable] = useState<string>('')
  const [rand, setRand] = useState('')
  const [uuid, setUuid] = useState('')
  const [regex, setRegex] = useState('')
  const [sample, setSample] = useState('')
  const [matches, setMatches] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [text, setText] = useState('')
  const [outUrl, setOutUrl] = useState('')

  function toReadable(u: string){
    const num = Number(u)
    if (!Number.isFinite(num)) return setReadable('Invalid')
    const d = new Date((num.toString().length > 10 ? num : num*1000))
    setReadable(d.toISOString())
  }
  function toUnix(r: string){
    const d = new Date(r)
    if (isNaN(d.getTime())) setUnix('Invalid')
    else setUnix(Math.floor(d.getTime()/1000).toString())
  }

  function randomString(len=16){
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let s=''; const arr = new Uint32Array(len); crypto.getRandomValues(arr)
    for(let i=0;i<len;i++){ s += chars[arr[i]%chars.length] }
    return s
  }

  function testRegex(){
    try {
      const re = new RegExp(regex, 'g')
      const res = Array.from(sample.matchAll(re)).map(m=> m[0])
      setMatches(JSON.stringify(res, null, 2))
    } catch {
      setMatches('Invalid regex')
    }
  }

  function renderPanel(){
    switch (active) {
      case 'ts':
        return (
          <ToolCard title="Timestamp Converter" description="Convert Unix time (seconds/ms) and ISO date-time.">
            <div className="grid md:grid-cols-2 gap-3">
              <input value={unix} onChange={e=>setUnix(e.target.value)} placeholder="Unix (seconds or ms)" className="w-full rounded-xl border p-3 dark:bg-slate-900" />
              <button onClick={()=>toReadable(unix)} className="px-3 py-2 rounded-xl bg-slate-900 text-white">Unix → ISO</button>
              <input value={readable} onChange={e=>setReadable(e.target.value)} placeholder="YYYY-MM-DD..." className="w-full rounded-xl border p-3 dark:bg-slate-900" />
              <button onClick={()=>toUnix(readable)} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">ISO → Unix</button>
            </div>
          </ToolCard>
        )
      case 'rand':
        return (
          <ToolCard title="Random & UUID" description="Generate random strings and UUID v4 identifiers.">
            <div className="flex flex-wrap gap-2">
              <button onClick={()=>setRand(randomString(16))} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">Random 16</button>
              <button onClick={()=>setUuid(uuidv4())} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">UUID v4</button>
            </div>
            <div className="relative"><input readOnly value={rand} className="w-full rounded-xl border p-3 dark:bg-slate-900 pr-12" placeholder="Random" /><div className="absolute top-2 right-2"><CopyButton value={rand} /></div></div>
            <div className="relative"><input readOnly value={uuid} className="w-full rounded-xl border p-3 dark:bg-slate-900 pr-12" placeholder="UUID" /><div className="absolute top-2 right-2"><CopyButton value={uuid} /></div></div>
          </ToolCard>
        )
      case 'regex':
        return (
          <ToolCard title="Regex Tester" description="Test a regular expression against sample text and view matches.">
            <textarea value={regex} onChange={e=>setRegex(e.target.value)} placeholder="Enter regex, e.g. \\b\\w+\\b" className="w-full h-20 rounded-xl border p-3 font-mono text-xs dark:bg-slate-900" />
            <textarea value={sample} onChange={e=>setSample(e.target.value)} placeholder="Sample text..." className="w-full h-28 rounded-xl border p-3 font-mono text-xs dark:bg-slate-900" />
            <button onClick={testRegex} className="px-3 py-2 rounded-xl bg-slate-900 text-white">Test</button>
            <div className="relative"><pre id="regex-matches" className="rounded-xl border p-3 overflow-auto text-xs dark:bg-slate-900 pr-12">{matches}</pre><div className="absolute top-2 right-2"><CopyButton getValue={()=> (document.getElementById('regex-matches') as HTMLElement)?.textContent || ''} /></div></div>
          </ToolCard>
        )
      case 'stego':
        return (
          <ToolCard title="Steganography (LSB in PNG)" description="Hide short text in image pixels. Demo only.">
            <input type="file" accept="image/png,image/jpeg" onChange={e=>setFile(e.target.files?.[0] || null)} className="block" />
            <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Secret text…" className="w-full h-28 rounded-xl border p-3 dark:bg-slate-900" />
            <div className="grid md:grid-cols-2 gap-3">
              <button className="px-4 py-2 rounded-xl bg-slate-900 text-white disabled:opacity-50" disabled={!file || !text}
                onClick={async ()=>{ if (!file) return; const url = await hideTextInImage(file, text).catch((e)=> String(e)); setOutUrl(url) }}>Hide →</button>
              <button className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 disabled:opacity-50" disabled={!file}
                onClick={async ()=>{ if (!file) return; const t = await extractTextFromImage(file).catch(()=> 'Failed'); setText(t) }}>← Extract</button>
            </div>
            {outUrl && (<div className="grid gap-2"><img src={outUrl} className="max-h-80 rounded-xl border" /><a href={outUrl} download="stego.png" className="underline text-sm">Download stego.png</a></div>)}
          </ToolCard>
        )
      case 'csv':
        return (
          <ToolCard title="CSV Import Options (delimiter)" description="Parse CSV using a chosen delimiter into JSON.">
            <textarea id="csv-in" placeholder="CSV input..." className="w-full h-32 rounded-xl border p-3 font-mono text-xs dark:bg-slate-900" />
            <input id="csv-delim" placeholder="Delimiter (default ,)" className="w-full rounded-xl border p-3 dark:bg-slate-900" />
            <button onClick={()=>{ const v=(document.getElementById('csv-in') as HTMLTextAreaElement).value; const d=(document.getElementById('csv-delim') as HTMLInputElement).value || ','; const res = Papa.parse(v.trim(), { header: true, delimiter: d }); (document.getElementById('csv-out') as HTMLTextAreaElement).value = JSON.stringify(res.data, null, 2) }} className="px-3 py-2 rounded-xl bg-slate-900 text-white">Parse CSV</button>
            <textarea id="csv-out" readOnly className="w-full h-32 rounded-xl border p-3 font-mono text-xs dark:bg-slate-900"></textarea>
          </ToolCard>
        )
      case 'saved':
        return (
          <ToolCard title="Regex Save / Reuse" description="Save named regex patterns in browser storage and reuse them.">
            <input id="regex-name" placeholder="Name..." className="w-full rounded-xl border p-3 dark:bg-slate-900" />
            <input id="regex-pat" placeholder="Pattern..." className="w-full rounded-xl border p-3 dark:bg-slate-900" />
            <div className="flex gap-2">
              <button onClick={()=>{ const n=(document.getElementById('regex-name') as HTMLInputElement).value; const p=(document.getElementById('regex-pat') as HTMLInputElement).value; if(!n||!p) return; const store = JSON.parse(localStorage.getItem('savedRegex')||'{}'); store[n]=p; localStorage.setItem('savedRegex', JSON.stringify(store)); alert('Saved') }} className="px-3 py-2 rounded-xl bg-slate-900 text-white">Save</button>
              <button onClick={()=>{ const store = JSON.parse(localStorage.getItem('savedRegex')||'{}'); (document.getElementById('regex-pat') as HTMLInputElement).value = store[(document.getElementById('regex-name') as HTMLInputElement).value]||'' }} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">Load</button>
              <button onClick={()=>{ localStorage.removeItem('savedRegex'); alert('Cleared') }} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">Clear All</button>
            </div>
          </ToolCard>
        )
    }
  }

  const navItems: { key: typeof active, label: string }[] = [
    { key: 'ts', label: 'Timestamp Converter' },
    { key: 'rand', label: 'Random & UUID' },
    { key: 'regex', label: 'Regex Tester' },
    { key: 'stego', label: 'Steganography' },
    { key: 'csv', label: 'CSV Import Options' },
    { key: 'saved', label: 'Regex Save / Reuse' },
  ]

  return (
    <>
      <Head title="String Ninja — Misc Tools (Timestamps, Random, Regex, Stego, CSV)" description="Convert timestamps, generate random/UUIDs, test regex, basic steganography demo, and CSV parsing with custom delimiters." />
      <div className="grid gap-6 md:grid-cols-[260px_1fr]">
      <div className="bg-white dark:bg-slate-950 rounded-2xl p-3 shadow-sm border border-slate-200 dark:border-slate-800 h-fit sticky top-24">
        <div className="text-sm font-semibold px-2 pb-2">Misc Tools</div>
        <ul className="grid gap-1">
          {navItems.map(item => (
            <li key={item.key}>
              <button
                onClick={()=>setActive(item.key)}
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
