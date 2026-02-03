import React, { useState } from 'react'
import ToolCard from '../components/ToolCard'
import CopyButton from '../components/CopyButton'
import Head from '../components/Head'
import { v4 as uuidv4 } from 'uuid'
import Papa from 'papaparse'
import { hideTextInImage, extractTextFromImage } from '../utils/stego'

export default function Misc() {
  const [active, setActive] = useState<'ts'|'pass'|'rand'|'regex'|'stego'|'saved'>('ts')

  const [unix, setUnix] = useState<string>('')
  const [readable, setReadable] = useState<string>('')
  const [rand, setRand] = useState('')
  const [uuid, setUuid] = useState('')
  // Password generator state
  const [passLen, setPassLen] = useState(16)
  const [useLower, setUseLower] = useState(true)
  const [useUpper, setUseUpper] = useState(true)
  const [useNums, setUseNums] = useState(true)
  const [useCommonSpecial, setUseCommonSpecial] = useState(false)
  const [customSpecial, setCustomSpecial] = useState('')
  const [pwdOut, setPwdOut] = useState('')
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

  function secureRandomInt(max: number){
    if (max <= 0) return 0
    const maxUint = 0xffffffff
    const limit = Math.floor((maxUint + 1) / max) * max
    let r = 0
    const buf = new Uint32Array(1)
    do {
      crypto.getRandomValues(buf)
      r = buf[0]
    } while (r >= limit)
    return r % max
  }
  function generatePassword(){
    const lowers = 'abcdefghijklmnopqrstuvwxyz'
    const uppers = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const nums = '0123456789'
    const common = '!@#$%^&*'
    let pool = ''
    const categories: string[] = []
    if (useLower) { pool += lowers; categories.push(lowers) }
    if (useUpper) { pool += uppers; categories.push(uppers) }
    if (useNums) { pool += nums; categories.push(nums) }
    if (useCommonSpecial) { pool += common; categories.push(common) }
    const custom = (customSpecial || '').replace(/\s/g,'')
    if (custom) { pool += custom; categories.push(custom) }
    if (!pool) { setPwdOut('Select at least one character set'); return }
    const out: string[] = []
    const need = Math.min(categories.length, passLen)
    for (let i=0;i<need;i++){
      const cat = categories[i]
      out.push(cat[secureRandomInt(cat.length)])
    }
    for (let i=out.length;i<passLen;i++){
      out.push(pool[secureRandomInt(pool.length)])
    }
    for (let i=out.length-1;i>0;i--){
      const j = secureRandomInt(i+1)
      const tmp = out[i]; out[i]=out[j]; out[j]=tmp
    }
    setPwdOut(out.join(''))
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
      case 'pass':
        return (
          <ToolCard title="Password Generator" description="Generate cryptographically strong passwords with custom options.">
            <div className="grid gap-3">
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium">Length: {passLen}</label>
                <input type="range" min={4} max={48} value={passLen} onChange={e=>setPassLen(parseInt(e.target.value,10))} className="w-full" />
              </div>
              <div className="grid md:grid-cols-2 gap-2 text-sm">
                <label className="inline-flex items-center gap-2"><input type="checkbox" checked={useLower} onChange={e=>setUseLower(e.target.checked)} /> Lowercase (a-z)</label>
                <label className="inline-flex items-center gap-2"><input type="checkbox" checked={useUpper} onChange={e=>setUseUpper(e.target.checked)} /> Uppercase (A-Z)</label>
                <label className="inline-flex items-center gap-2"><input type="checkbox" checked={useNums} onChange={e=>setUseNums(e.target.checked)} /> Numbers (0-9)</label>
                <label className="inline-flex items-center gap-2"><input type="checkbox" checked={useCommonSpecial} onChange={e=>setUseCommonSpecial(e.target.checked)} /> Common special (!@#$%^&*)</label>
              </div>
              <input value={customSpecial} onChange={e=>setCustomSpecial(e.target.value)} placeholder="Custom special characters (optional)" className="w-full rounded-xl border p-3 font-mono text-xs dark:bg-slate-900" />
              <button onClick={generatePassword} className="px-3 py-2 rounded-xl bg-slate-900 text-white w-fit">Generate</button>
              <div className="relative">
                <input readOnly value={pwdOut} className="w-full rounded-xl border p-3 font-mono text-xs dark:bg-slate-900 pr-12" placeholder="Password" />
                <div className="absolute top-2 right-2"><CopyButton value={pwdOut} /></div>
              </div>
            </div>
            <div className="mt-6 text-sm leading-6 text-slate-700 dark:text-slate-300">
              <h3 className="text-base font-semibold">Password guidance</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Use high entropy: length matters most. 16+ is a good baseline.</li>
                <li>Include multiple character classes or custom special characters where allowed.</li>
                <li>For critical accounts, consider passphrases (4–6 random words) and a password manager.</li>
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
            <div className="mt-6 text-sm leading-6 text-slate-700 dark:text-slate-300">
              <h3 className="text-base font-semibold">How LSB stego works</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Least-significant bits of pixel channels encode message bits; visual changes are minimal.</li>
                <li>Lossy formats (JPEG) can corrupt hidden data; prefer PNG. This demo supports only short text.</li>
                <li>Steganography ≠ encryption; do not rely on it for secrecy without proper cryptography.</li>
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
    { key: 'pass', label: 'Password Generator' },
    { key: 'rand', label: 'Random & UUID' },
    { key: 'regex', label: 'Regex Tester' },
    { key: 'stego', label: 'Steganography' },
    // { key: 'csv', label: 'CSV Import Options' },
    { key: 'saved', label: 'Regex Save / Reuse' },
  ]

  return (
    <>
      <Head title="String Ninja — Misc Tools (Timestamps, Passwords, Random, Regex, Stego)" description="Convert timestamps, generate secure passwords and UUIDs, test regex, and basic steganography demo." />
      <div className="grid gap-6 md:grid-cols-[260px_1fr]">
      <div className="bg-white dark:bg-slate-950 rounded-2xl p-3 shadow-sm border border-slate-200 dark:border-slate-800 h-fit md:sticky md:top-24">
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm font-semibold px-2 pb-2 md:pb-2">Misc Tools</div>
          <div className="md:hidden w-full">
            <select
              value={active}
              onChange={e=>setActive(e.target.value as any)}
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
