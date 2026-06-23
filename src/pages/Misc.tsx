import React, { useState } from 'react'
import ToolCard from '../components/ToolCard'
import ToolLayout from '../components/ToolLayout'
import CopyButton from '../components/CopyButton'
import Head from '../components/Head'
import { v4 as uuidv4 } from 'uuid'
import Papa from 'papaparse'
export default function Misc() {
  const [active, setActive] = useState<'ts'|'rand'|'regex'|'saved'>('ts')

  const [unix, setUnix] = useState<string>('')
  const [readable, setReadable] = useState<string>('')
  const [rand, setRand] = useState('')
  const [uuid, setUuid] = useState('')
  const [regex, setRegex] = useState('')
  const [sample, setSample] = useState('')
  const [matches, setMatches] = useState('')
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
            <div className="mt-6 text-sm leading-6 text-slate-700 dark:text-slate-300">
              <h3 className="text-base font-semibold">How timestamps map</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Unix timestamp is seconds since 1970-01-01T00:00:00Z (or ms variant); ISO strings are timezone-aware.</li>
                <li>Parsing ISO uses the browser Date; invalid inputs return “Invalid”.</li>
                <li>When ambiguous, values ≤ 10 digits treated as seconds, &gt;10 as milliseconds.</li>
              </ul>
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
            <div className="mt-6 text-sm leading-6 text-slate-700 dark:text-slate-300">
              <h3 className="text-base font-semibold">Randomness and UUIDs</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Random strings use crypto.getRandomValues for cryptographic randomness.</li>
                <li>UUID v4 is 128-bit with fixed version/variant bits; it’s not a hash of input.</li>
                <li>UUIDs are unique enough for most IDs but not for security tokens; use random bytes for secrets.</li>
              </ul>
            </div>
          </ToolCard>
        )
      case 'regex':
        return (
          <ToolCard title="Regex Tester" description="Test a regular expression against sample text and view matches.">
            <textarea value={regex} onChange={e=>setRegex(e.target.value)} placeholder="Enter regex, e.g. \\b\\w+\\b" className="w-full h-20 rounded-xl border p-3 font-mono text-xs dark:bg-slate-900" />
            <textarea value={sample} onChange={e=>setSample(e.target.value)} placeholder="Sample text..." className="w-full h-28 rounded-xl border p-3 font-mono text-xs dark:bg-slate-900" />
            <button onClick={testRegex} className="px-3 py-2 rounded-xl bg-slate-900 text-white">Test</button>
            <div className="relative"><pre id="regex-matches" className="rounded-xl border p-3 overflow-auto text-xs dark:bg-slate-900 pr-12">{matches}</pre><div className="absolute top-2 right-2"><CopyButton getValue={()=> (document.getElementById('regex-matches') as HTMLElement)?.textContent || ''} /></div></div>
            <div className="mt-6 text-sm leading-6 text-slate-700 dark:text-slate-300">
              <h3 className="text-base font-semibold">Regex notes</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Flags: g (global), i (case-insensitive), m (multiline), s (dotAll), u (Unicode), y (sticky).</li>
                <li>Use non-greedy quantifiers (e.g., .*?) when matching minimal spans.</li>
                <li>Escape special characters (e.g., \\., \\*, \\?, \\+) to match them literally.</li>
              </ul>
            </div>
          </ToolCard>
        )
      // CSV Import feature removed
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
            <div className="mt-6 text-sm leading-6 text-slate-700 dark:text-slate-300">
              <h3 className="text-base font-semibold">Storage details</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Patterns are stored under localStorage key “savedRegex” on this browser only.</li>
                <li>Use unique names to avoid overwriting; clear all removes the entire key.</li>
                <li>Consider exporting patterns manually if you need backups or sync.</li>
              </ul>
            </div>
          </ToolCard>
        )
    }
  }

  const navItems: { key: typeof active, label: string }[] = [
    { key: 'ts', label: 'Timestamp Converter' },
    { key: 'rand', label: 'Random & UUID' },
    { key: 'regex', label: 'Regex Tester' },
    { key: 'saved', label: 'Regex Save / Reuse' },
  ]

  return (
    <>
      <Head title="String Ninja — Timestamp, Password, Random, Regex, Stego" description="Convert Unix timestamps to ISO dates and back, generate strong cryptographically secure passwords with custom options, create random strings and UUID v4 identifiers, test regular expressions against sample text, and hide/extract text in PNG images using steganography." />
      <ToolLayout
        title="Misc Tools"
        activeKey={active}
        navItems={navItems}
        onSelect={key => setActive(key as any)}
      >
        {renderPanel()}
      </ToolLayout>
    </>
  )
}
