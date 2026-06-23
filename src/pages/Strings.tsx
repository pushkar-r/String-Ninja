import React, { useEffect, useMemo, useState } from 'react'
import ToolCard from '../components/ToolCard'
import ToolLayout from '../components/ToolLayout'
import CopyButton from '../components/CopyButton'
import Head from '../components/Head'
import { useSearchParams } from 'react-router-dom'
import * as Diff from 'diff'

function slugify(str: string) {
  return str.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}
function toCamel(s: string){ return s.replace(/[-_\s]+(.)?/g, (_,c)=> c? c.toUpperCase(): '').replace(/^(.)/, m=> m.toLowerCase()) }
function toPascal(s: string){ const c = toCamel(s); return c.charAt(0).toUpperCase()+c.slice(1) }
function toSnake(s: string){ return s.trim().replace(/\s+/g,'_').replace(/([a-z])([A-Z])/g,'$1_$2').toLowerCase() }
function toKebab(s: string){ return s.trim().replace(/\s+/g,'-').replace(/([a-z])([A-Z])/g,'$1-$2').toLowerCase() }
function titleCase(s: string){
  return s.toLowerCase().replace(/\b([a-z])(\w*)/g, (_,f,r) => f.toUpperCase()+r)
}
function sentenceCase(s: string){
  return s.replace(/(^\s*[a-z])|([\.!?]\s+[a-z])/g, m => m.toUpperCase())
}
function removeDiacritics(s: string){
  return s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
}

export default function Strings() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [active, setActive] = useState<'basic'|'count'|'case'|'unicode'|'delimiter'|'split'|'diff'|'lines'|'find'|'wrap'|'freq'|'diacritics'|'escape'|'numbase'|'color'>(
    (searchParams.get('tool') as any) || 'basic'
  )

  const [text, setText] = useState('')
  const words = useMemo(()=> text.trim() ? text.trim().split(/\s+/).length : 0, [text])
  const chars = text.length

  const [out, setOut] = useState('')
  const [codepoints, setCodepoints] = useState('')
  const [delimiter, setDelimiter] = useState(', ')
  const [trimItems, setTrimItems] = useState(true)
  const [ignoreEmpty, setIgnoreEmpty] = useState(true)
  const [prefix, setPrefix] = useState('')
  const [suffix, setSuffix] = useState('')
  const [diffA, setDiffA] = useState('')
  const [diffB, setDiffB] = useState('')
  const [diffMode, setDiffMode] = useState<'words'|'chars'|'lines'>('words')
  const [diffView, setDiffView] = useState<'inline'|'side'>('inline')

  // String escape
  const [escIn, setEscIn] = useState('')
  const [escOut, setEscOut] = useState('')
  const [escMode, setEscMode] = useState<'js'|'json'|'html'|'url'>('js')
  // Number base converter
  const [numIn, setNumIn] = useState('')
  const [numFromBase, setNumFromBase] = useState(10)
  const [numResults, setNumResults] = useState<{label:string,value:string}[]>([])
  // Color converter
  const [colorIn, setColorIn] = useState('')
  const [colorResults, setColorResults] = useState<{label:string,value:string}[]>([])
  const [colorPreview, setColorPreview] = useState('')

  useEffect(()=>{
    const t = searchParams.get('tool') as any
    if (t && t !== active) setActive(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])
  // Clear input/output when switching tools for predictable UX
  useEffect(()=>{ setText(''); setOut('') }, [active])
  function selectTool(key: typeof active){ setActive(key); setSearchParams({ tool: key }) }

  function parseEscapes(s: string){ return s.replace(/\\n/g, '\n').replace(/\\t/g, '\t') }

  function convertNumber(){
    const raw = numIn.trim()
    if (!raw) { setNumResults([]); return }
    try {
      const decimal = parseInt(raw, numFromBase)
      if (isNaN(decimal)) { setNumResults([{label:'Error',value:'Invalid number for selected base'}]); return }
      setNumResults([
        { label: 'Decimal (base 10)', value: decimal.toString(10) },
        { label: 'Hexadecimal (base 16)', value: '0x' + decimal.toString(16).toUpperCase() },
        { label: 'Octal (base 8)', value: '0o' + decimal.toString(8) },
        { label: 'Binary (base 2)', value: decimal.toString(2) },
        { label: 'Base 36', value: decimal.toString(36).toUpperCase() },
      ])
    } catch {
      setNumResults([{label:'Error',value:'Conversion failed'}])
    }
  }

  function convertColor(raw: string){
    setColorIn(raw)
    raw = raw.trim()
    if (!raw) { setColorResults([]); setColorPreview(''); return }
    const results: {label:string,value:string}[] = []
    let r = 0, g = 0, b = 0, valid = false
    // Parse hex
    const hex6 = raw.match(/^#?([0-9a-f]{6})$/i)
    const hex3 = raw.match(/^#?([0-9a-f]{3})$/i)
    const rgbMatch = raw.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i)
    const hslMatch = raw.match(/^hsla?\(\s*(\d+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%/i)
    if (hex6) {
      const h = hex6[1]
      r = parseInt(h.slice(0,2),16); g = parseInt(h.slice(2,4),16); b = parseInt(h.slice(4,6),16); valid = true
    } else if (hex3) {
      const h = hex3[1]
      r = parseInt(h[0]+h[0],16); g = parseInt(h[1]+h[1],16); b = parseInt(h[2]+h[2],16); valid = true
    } else if (rgbMatch) {
      r = parseInt(rgbMatch[1]); g = parseInt(rgbMatch[2]); b = parseInt(rgbMatch[3]); valid = true
    } else if (hslMatch) {
      const hh = parseInt(hslMatch[1]); const ss = parseFloat(hslMatch[2])/100; const ll = parseFloat(hslMatch[3])/100
      const c = (1 - Math.abs(2*ll-1)) * ss; const x = c * (1 - Math.abs((hh/60)%2-1)); const m = ll - c/2
      let rr=0,gg=0,bb=0
      if(hh<60){rr=c;gg=x}else if(hh<120){rr=x;gg=c}else if(hh<180){gg=c;bb=x}else if(hh<240){gg=x;bb=c}else if(hh<300){rr=x;bb=c}else{rr=c;bb=x}
      r=Math.round((rr+m)*255);g=Math.round((gg+m)*255);b=Math.round((bb+m)*255); valid=true
    }
    if (valid) {
      const hex = '#' + [r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('').toUpperCase()
      const toH = ()=>{ const rr=r/255,gg=g/255,bb=b/255; const mx=Math.max(rr,gg,bb),mn=Math.min(rr,gg,bb); let h=0,s=0; const l=(mx+mn)/2; if(mx!==mn){ const d=mx-mn; s=l>0.5?d/(2-mx-mn):d/(mx+mn); if(mx===rr)h=((gg-bb)/d+(gg<bb?6:0))/6; else if(mx===gg)h=((bb-rr)/d+2)/6; else h=((rr-gg)/d+4)/6 } return `hsl(${Math.round(h*360)}, ${Math.round(s*100)}%, ${Math.round(l*100)}%)` }
      results.push({label:'HEX',value:hex})
      results.push({label:'RGB',value:`rgb(${r}, ${g}, ${b})`})
      results.push({label:'HSL',value:toH()})
      results.push({label:'CSS rgba',value:`rgba(${r}, ${g}, ${b}, 1)`})
      results.push({label:'Tailwind-like',value:`r=${r} g=${g} b=${b}`})
      setColorPreview(hex)
    } else {
      results.push({label:'Error',value:'Could not parse colour. Try: #FF5733, rgb(255,87,51), or hsl(11,100%,60%)'})
      setColorPreview('')
    }
    setColorResults(results)
  }

  function renderPanel(){
    switch (active) {
      case 'basic':
        return (
          <ToolCard title="Basic operations" description="Quick text cleanup and case transformations.">
            <div className="relative">
              <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Enter text…" className="w-full h-40 rounded-xl border p-3 dark:bg-slate-900 pr-12" />
              <div className="absolute top-2 right-2"><CopyButton value={text} /></div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={()=>setText(text.trim())} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">Trim</button>
              <button onClick={()=>setText(text.split(/\r?\n/).map(l => l.replace(/[ \t]+/g,' ').trim()).join('\n'))} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">Remove redundant spaces</button>
              
              <button onClick={()=>setText(text.split('').reverse().join(''))} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">Reverse</button>
              <button onClick={()=>setText(slugify(text))} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">Slugify</button>
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Chars: {chars} • Words: {words}</div>
            <div className="mt-6 text-sm leading-6 text-slate-700 dark:text-slate-300 space-y-2">
              <h3 className="text-base font-semibold">What this tool is good for</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Clean copied text from emails, spreadsheets, and log viewers.</li>
                <li>Normalize text before indexing or comparing content.</li>
                <li>Create URL-friendly slugs by removing symbols and accents.</li>
              </ul>
            </div>
          </ToolCard>
        )
      case 'count':
        return (
          <ToolCard title="Count characters / words" description="Get counts for characters, words, lines, and bytes.">
            <div className="relative">
              <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Enter text…" className="w-full h-40 rounded-xl border p-3 dark:bg-slate-900 pr-12" />
              <div className="absolute top-2 right-2"><CopyButton value={text} /></div>
            </div>
            {(() => {
              const lineCount = text.length ? text.split(/\r?\n/).length : 0
              const nonSpaceChars = Array.from(text).filter(ch => !/\s/.test(ch)).length
              const bytes = new TextEncoder().encode(text).length
              return (
                <div className="grid sm:grid-cols-2 gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <div className="rounded-xl border p-3 dark:border-slate-800">
                    <div className="font-medium">Characters</div>
                    <div className="text-slate-600 dark:text-slate-400">Total: {chars}</div>
                    <div className="text-slate-600 dark:text-slate-400">Without whitespace: {nonSpaceChars}</div>
                  </div>
                  <div className="rounded-xl border p-3 dark:border-slate-800">
                    <div className="font-medium">Words and lines</div>
                    <div className="text-slate-600 dark:text-slate-400">Words: {words}</div>
                    <div className="text-slate-600 dark:text-slate-400">Lines: {lineCount}</div>
                  </div>
                  <div className="rounded-xl border p-3 dark:border-slate-800">
                    <div className="font-medium">Size</div>
                    <div className="text-slate-600 dark:text-slate-400">Bytes (UTF-8): {bytes}</div>
                  </div>
                </div>
              )
            })()}
            <div className="mt-6 text-sm leading-6 text-slate-700 dark:text-slate-300 space-y-2">
              <h3 className="text-base font-semibold">Counting rules used here</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Word count is whitespace-based, so punctuation remains part of the token.</li>
                <li>Character count uses Unicode-aware iteration for non-space count.</li>
                <li>Byte size is UTF-8 encoded length, which can be larger than character count.</li>
              </ul>
            </div>
          </ToolCard>
        )
      case 'case':
        return (
          <ToolCard title="Case converters" description="Convert text between different cases and naming styles.">
            <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Enter text…" className="w-full h-28 rounded-xl border p-3 dark:bg-slate-900" />
            <div className="flex flex-wrap gap-2">
              <button onClick={()=>setOut(toCamel(text))} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">camelCase</button>
              <button onClick={()=>setOut(toPascal(text))} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">PascalCase</button>
              <button onClick={()=>setOut(toSnake(text))} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">snake_case</button>
              <button onClick={()=>setOut(toKebab(text))} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">kebab-case</button>
              <button onClick={()=>setOut(text.toUpperCase())} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">UPPERCASE</button>
              <button onClick={()=>setOut(text.toLowerCase())} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">lowercase</button>
              <button onClick={()=>setOut(titleCase(text))} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">Title Case</button>
              <button onClick={()=>setOut(sentenceCase(text))} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">Sentence case</button>
            </div>
            <div className="relative">
              <textarea readOnly value={out} placeholder="Output…" className="w-full h-20 rounded-xl border p-3 dark:bg-slate-900 pr-12" />
              <div className="absolute top-2 right-2"><CopyButton value={out} /></div>
            </div>
            <div className="mt-6 text-sm leading-6 text-slate-700 dark:text-slate-300 space-y-2">
              <h3 className="text-base font-semibold">Naming style guidance</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Use camelCase and PascalCase mostly in JavaScript and TypeScript codebases.</li>
                <li>Use snake_case often for SQL columns and environment variables.</li>
                <li>Use kebab-case for URL paths and CSS utility naming.</li>
              </ul>
            </div>
          </ToolCard>
        )
      case 'unicode':
        return (
          <ToolCard title="Unicode / ASCII / Code Points" description="Show each character with its Unicode code point.">
            <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Enter text…" className="w-full h-28 rounded-xl border p-3 dark:bg-slate-900" />
            <button onClick={()=>setCodepoints(Array.from(text).map(ch=> ch+` U+${ch.codePointAt(0)!.toString(16).toUpperCase().padStart(4,'0')}`).join('\n'))} className="px-3 py-2 rounded-xl bg-slate-900 text-white">Show code points</button>
            <div className="relative">
              <textarea readOnly value={codepoints} className="w-full h-32 rounded-xl border p-3 font-mono text-xs dark:bg-slate-900 pr-12" />
              <div className="absolute top-2 right-2"><CopyButton value={codepoints} /></div>
            </div>
            <div className="mt-6 text-sm leading-6 text-slate-700 dark:text-slate-300 space-y-2">
              <h3 className="text-base font-semibold">When code points help</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Detect hidden whitespace and look-alike characters in user input.</li>
                <li>Troubleshoot Unicode issues in identifiers and filenames.</li>
                <li>Verify exact symbols before applying security or normalization rules.</li>
              </ul>
            </div>
          </ToolCard>
        )
      case 'delimiter':
        return (
          <ToolCard title="Add delimiter / Join lines" description="Join lines using a chosen delimiter with options to trim/skip blanks and add per-line prefix/suffix.">
            <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Paste one item per line…" className="w-full h-40 rounded-xl border p-3 dark:bg-slate-900" />
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-sm text-slate-600 dark:text-slate-400">Delimiter:</label>
              <input value={delimiter} onChange={e=>setDelimiter(e.target.value)} placeholder=", " className="px-3 py-2 rounded-xl border dark:bg-slate-900" />
              <button onClick={()=>setDelimiter(', ')} className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-sm">,</button>
              <button onClick={()=>setDelimiter('|')} className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-sm">|</button>
              <button onClick={()=>setDelimiter('\\t')} className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-sm">Tab</button>
              <button onClick={()=>setDelimiter('; ')} className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-sm">;</button>
            </div>
            <div className="grid md:grid-cols-2 gap-2 mt-2">
              <input value={prefix} onChange={e=>setPrefix(e.target.value)} placeholder="Prefix for each line (optional)" className="w-full rounded-xl border p-2 dark:bg-slate-900" />
              <input value={suffix} onChange={e=>setSuffix(e.target.value)} placeholder="Suffix for each line (optional)" className="w-full rounded-xl border p-2 dark:bg-slate-900" />
            </div>
            <div className="flex flex-wrap gap-4 my-2 text-sm">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={trimItems} onChange={e=>setTrimItems(e.target.checked)} />
                Trim entries
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={ignoreEmpty} onChange={e=>setIgnoreEmpty(e.target.checked)} />
                Ignore empty lines
              </label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={()=>{
                  const dlm = parseEscapes(delimiter)
                  const parts = text.split(/\r?\n/)
                    .map(s => trimItems ? s.trim() : s)
                  const filtered = ignoreEmpty ? parts.filter(s => s.length>0) : parts
                  const wrapped = filtered.map(s => `${prefix}${s}${suffix}`)
                  setOut(wrapped.join(dlm))
                }}
                className="px-3 py-2 rounded-xl bg-slate-900 text-white"
              >Join</button>
            </div>
            <div className="relative mt-2">
              <textarea value={out} onChange={e=>setOut(e.target.value)} placeholder="Output…" className="w-full h-28 rounded-xl border p-3 font-mono text-xs dark:bg-slate-900 pr-12" />
              <div className="absolute top-2 right-2"><CopyButton value={out} /></div>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Tip: Use \\t for tab, \\n for newline in the delimiter.</div>
            <div className="mt-6 text-sm leading-6 text-slate-700 dark:text-slate-300 space-y-2">
              <h3 className="text-base font-semibold">Practical examples</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Convert newline lists into comma-separated values for SQL IN clauses.</li>
                <li>Add quote wrappers using prefix and suffix (for example single quotes).</li>
                <li>Generate pipe-delimited rows for quick import experiments.</li>
              </ul>
            </div>
          </ToolCard>
        )
      case 'split':
        return (
          <ToolCard title="Split string by delimiter" description="Break a string on a chosen delimiter into separate lines.">
            <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Input string…" className="w-full h-40 rounded-xl border p-3 dark:bg-slate-900" />
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-sm text-slate-600 dark:text-slate-400">Delimiter:</label>
              <input value={delimiter} onChange={e=>setDelimiter(e.target.value)} placeholder=", " className="px-3 py-2 rounded-xl border dark:bg-slate-900" />
              <button onClick={()=>setDelimiter(', ')} className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-sm">,</button>
              <button onClick={()=>setDelimiter('|')} className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-sm">|</button>
              <button onClick={()=>setDelimiter('\\t')} className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-sm">Tab</button>
              <button onClick={()=>setDelimiter('; ')} className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-sm">;</button>
            </div>
            <div className="flex flex-wrap gap-4 my-2 text-sm">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={trimItems} onChange={e=>setTrimItems(e.target.checked)} />
                Trim entries
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={ignoreEmpty} onChange={e=>setIgnoreEmpty(e.target.checked)} />
                Ignore empty results
              </label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={()=>{
                  const dlm = parseEscapes(delimiter)
                  let parts = dlm ? text.split(dlm) : [text]
                  if (trimItems) parts = parts.map(s=>s.trim())
                  if (ignoreEmpty) parts = parts.filter(s=>s.length>0)
                  setOut(parts.join('\n'))
                }}
                className="px-3 py-2 rounded-xl bg-slate-900 text-white"
              >Split</button>
            </div>
            <div className="relative mt-2">
              <textarea value={out} onChange={e=>setOut(e.target.value)} placeholder="Output (one item per line)…" className="w-full h-28 rounded-xl border p-3 font-mono text-xs dark:bg-slate-900 pr-12" />
              <div className="absolute top-2 right-2"><CopyButton value={out} /></div>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Tip: Use \\t for tab, \\n for newline in the delimiter.</div>
            <div className="mt-6 text-sm leading-6 text-slate-700 dark:text-slate-300 space-y-2">
              <h3 className="text-base font-semibold">Use this before cleanup steps</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Split CSV-like fields into line-by-line records for review.</li>
                <li>Trim and ignore empty values to normalize inconsistent input.</li>
                <li>Pair with Line operations for sort and dedupe workflows.</li>
              </ul>
            </div>
          </ToolCard>
        )
      case 'diff':
        return (
          <ToolCard title="String Compare (Diff)" description="Visual diff between two texts by words, characters, or lines; inline or side-by-side.">
            <div className="flex flex-wrap gap-3 items-center mb-2">
              <div className="flex gap-2 items-center">
                <label className="text-sm">Mode</label>
                <select value={diffMode} onChange={e=>setDiffMode(e.target.value as any)} className="px-2 py-2 rounded-xl border dark:bg-slate-900">
                  <option value="words">Words</option>
                  <option value="chars">Chars</option>
                  <option value="lines">Lines</option>
                </select>
              </div>
              <div className="flex gap-2 items-center">
                <label className="text-sm">View</label>
                <select value={diffView} onChange={e=>setDiffView(e.target.value as any)} className="px-2 py-2 rounded-xl border dark:bg-slate-900">
                  <option value="inline">Inline</option>
                  <option value="side">Side-by-side</option>
                </select>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <textarea value={diffA} onChange={e=>setDiffA(e.target.value)} placeholder="Text A…" className="w-full h-40 rounded-xl border p-3 dark:bg-slate-900" />
              <textarea value={diffB} onChange={e=>setDiffB(e.target.value)} placeholder="Text B…" className="w-full h-40 rounded-xl border p-3 dark:bg-slate-900" />
            </div>
            <div className="mt-3">
              {diffView === 'inline' ? (() => {
                const diffs = diffMode==='words' ? Diff.diffWords(diffA,diffB) : diffMode==='chars' ? Diff.diffChars(diffA,diffB) : Diff.diffLines(diffA,diffB)
                const plain = diffs.map(d=>d.value).join('')
                return (
                  <div className="relative">
                    <div className="absolute top-2 right-2 z-10"><CopyButton value={plain} /></div>
                    <div className="rounded-xl border p-3 text-sm leading-7 dark:bg-slate-900">
                      {diffs.map((part, i) => (
                        <span key={i} className={part.added ? 'bg-green-200 dark:bg-green-900 rounded px-1' : part.removed ? 'bg-red-200 dark:bg-red-900 rounded px-1 line-through' : ''}>
                          {part.value}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })() : (() => {
                const diffs = Diff.diffLines(diffA, diffB)
                const left: { text: string; type: 'ctx'|'rem' }[] = []
                const right: { text: string; type: 'ctx'|'add' }[] = []
                for (const part of diffs){
                  const lines = part.value.split('\n')
                  if (lines[lines.length-1] === '') lines.pop()
                  if (part.added){ for (const line of lines){ right.push({ text: line, type: 'add' }); left.push({ text: '', type: 'ctx' }) } }
                  else if (part.removed){ for (const line of lines){ left.push({ text: line, type: 'rem' }); right.push({ text: '', type: 'ctx' }) } }
                  else { for (const line of lines){ left.push({ text: line, type: 'ctx' }); right.push({ text: line, type: 'ctx' }) } }
                }
                return (
                  <div className="grid gap-1">
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-500"><div>Original</div><div>Changed</div></div>
                    {left.map((l, idx) => (
                      <div key={idx} className="grid grid-cols-2 gap-2 text-sm">
                        <div className="relative">
                          <div className="absolute top-2 right-2"><CopyButton value={l.text} /></div>
                          <pre className={`rounded-lg border p-2 overflow-auto dark:bg-slate-900 ${l.type==='rem' ? 'bg-red-50 dark:bg-red-950' : ''}`}>{l.text || ' '}</pre>
                        </div>
                        <div className="relative">
                          <div className="absolute top-2 right-2"><CopyButton value={right[idx].text} /></div>
                          <pre className={`rounded-lg border p-2 overflow-auto dark:bg-slate-900 ${right[idx].type==='add' ? 'bg-green-50 dark:bg-green-950' : ''}`}>{right[idx].text || ' '}</pre>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>
            <div className="mt-6 text-sm leading-6 text-slate-700 dark:text-slate-300 space-y-2">
              <h3 className="text-base font-semibold">How this diff works</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>`words` mode compares token-by-token, useful for prose and documentation edits.</li>
                <li>`chars` mode shows fine-grained changes, useful for IDs, code snippets, and short strings.</li>
                <li>`lines` mode compares line blocks, useful for logs and config files.</li>
              </ul>
            </div>
          </ToolCard>
        )
      case 'lines':
        return (
          <ToolCard title="Line operations" description="Sort, deduplicate, and remove blank lines.">
            <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Enter text (one item per line)…" className="w-full h-40 rounded-xl border p-3 dark:bg-slate-900" />
            <div className="flex flex-wrap gap-2">
              <button onClick={()=>{ const res = text.split(/\r?\n/).sort((a,b)=> a.localeCompare(b)).join('\n'); setOut(res) }} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">Sort A→Z</button>
              <button onClick={()=>{ const res = text.split(/\r?\n/).sort((a,b)=> b.localeCompare(a)).join('\n'); setOut(res) }} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">Sort Z→A</button>
              <button onClick={()=>{ const seen = new Set<string>(); const res = text.split(/\r?\n/).filter(l=>{ const k=l; if(seen.has(k)) return false; seen.add(k); return true }).join('\n'); setOut(res) }} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">Unique</button>
              <button onClick={()=>{ const res = text.split(/\r?\n/).filter(l=>l.trim().length>0).join('\n'); setOut(res) }} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">Remove blank lines</button>
            </div>
            <div className="relative mt-2">
              <textarea value={out} onChange={e=>setOut(e.target.value)} placeholder="Output…" className="w-full h-28 rounded-xl border p-3 font-mono text-xs dark:bg-slate-900 pr-12" />
              <div className="absolute top-2 right-2"><CopyButton value={out} /></div>
            </div>
            <div className="mt-6 text-sm leading-6 text-slate-700 dark:text-slate-300 space-y-2">
              <h3 className="text-base font-semibold">Line-order caveats</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Sort uses locale-aware string comparison, not numeric sorting.</li>
                <li>Unique keeps the first occurrence and removes later duplicates.</li>
                <li>Blank-line removal helps normalize pasted logs and config blocks.</li>
              </ul>
            </div>
          </ToolCard>
        )
      case 'find':
        return (
          <ToolCard title="Find / Replace (Regex)" description="Search and replace using regular expressions with flags.">
            <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Text…" className="w-full h-40 rounded-xl border p-3 dark:bg-slate-900" />
            <div className="grid md:grid-cols-3 gap-2">
              <input id="re-pat" placeholder="Pattern (regex)" className="w-full rounded-xl border p-3 dark:bg-slate-900" />
              <input id="re-flags" placeholder="Flags (e.g., gi)" className="w-full rounded-xl border p-3 dark:bg-slate-900" />
              <input id="re-repl" placeholder="Replace with" className="w-full rounded-xl border p-3 dark:bg-slate-900" />
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={()=>{ try { const p=(document.getElementById('re-pat') as HTMLInputElement).value; const f=(document.getElementById('re-flags') as HTMLInputElement).value; const re=new RegExp(p,f); const matches=Array.from(text.matchAll(re)).map(m=> ({ match: m[0], index: m.index })); setOut(JSON.stringify(matches, null, 2)) } catch { setOut('Invalid regex') } }} className="px-3 py-2 rounded-xl bg-slate-900 text-white">Find</button>
              <button onClick={()=>{ try { const p=(document.getElementById('re-pat') as HTMLInputElement).value; const f=(document.getElementById('re-flags') as HTMLInputElement).value; const r=(document.getElementById('re-repl') as HTMLInputElement).value; const re=new RegExp(p,f); setOut(text.replace(re, r)) } catch { setOut('Invalid regex') } }} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">Replace</button>
            </div>
            <div className="relative mt-2">
              <textarea value={out} onChange={e=>setOut(e.target.value)} placeholder="Output…" className="w-full h-40 rounded-xl border p-3 font-mono text-xs dark:bg-slate-900 pr-12" />
              <div className="absolute top-2 right-2"><CopyButton value={out} /></div>
            </div>
            <div className="mt-6 text-sm leading-6 text-slate-700 dark:text-slate-300 space-y-2">
              <h3 className="text-base font-semibold">Regex safety tips</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Start with small test input before running broad global replacements.</li>
                <li>Use explicit flags like `g`, `i`, and `m` based on expected behavior.</li>
                <li>Escape special characters when matching literal symbols.</li>
              </ul>
            </div>
          </ToolCard>
        )
      case 'wrap':
        return (
          <ToolCard title="Wrap / Reflow text" description="Rewrap text to a fixed column width.">
            <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Text…" className="w-full h-40 rounded-xl border p-3 dark:bg-slate-900" />
            <div className="flex items-center gap-2">
              <label className="text-sm">Width</label>
              <input id="wrap-width" type="number" defaultValue={80} className="w-24 rounded-xl border p-2 dark:bg-slate-900" />
              <button onClick={()=>{ const w=parseInt((document.getElementById('wrap-width') as HTMLInputElement).value,10)||80; const words=text.split(/\s+/); const lines:string[]=[]; let line=''; for(const word of words){ if(!word) continue; if((line+ (line? ' ':'') + word).length> w){ if(line) lines.push(line); line=word; } else { line += (line? ' ':'') + word } } if(line) lines.push(line); setOut(lines.join('\n')) }} className="px-3 py-2 rounded-xl bg-slate-900 text-white">Wrap</button>
            </div>
            <div className="relative mt-2">
              <textarea value={out} onChange={e=>setOut(e.target.value)} placeholder="Output…" className="w-full h-40 rounded-xl border p-3 font-mono text-xs dark:bg-slate-900 pr-12" />
              <div className="absolute top-2 right-2"><CopyButton value={out} /></div>
            </div>
            <div className="mt-6 text-sm leading-6 text-slate-700 dark:text-slate-300 space-y-2">
              <h3 className="text-base font-semibold">Wrap behavior</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Wrapping is token-based and preserves words where possible.</li>
                <li>Very long tokens longer than width stay as-is and may exceed the limit.</li>
                <li>Useful for commit messages, markdown notes, and readable plaintext output.</li>
              </ul>
            </div>
          </ToolCard>
        )
      case 'freq':
        return (
          <ToolCard title="Frequency Analysis" description="Count occurrences of words or characters.">
            <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Text…" className="w-full h-40 rounded-xl border p-3 dark:bg-slate-900" />
            <div className="flex items-center gap-4">
              <label className="inline-flex items-center gap-2 text-sm"><input type="radio" name="freq-mode" defaultChecked value="words" onChange={()=>{}} /> Words</label>
              <label className="inline-flex items-center gap-2 text-sm"><input type="radio" name="freq-mode" value="chars" onChange={()=>{}} /> Chars</label>
              <button onClick={()=>{ const mode = (Array.from(document.getElementsByName('freq-mode')) as HTMLInputElement[]).find(i=>i.checked)?.value || 'words'; if(mode==='chars'){ const map = new Map<string,number>(); for(const ch of text){ map.set(ch, (map.get(ch)||0)+1) } const arr = Array.from(map.entries()).sort((a,b)=> b[1]-a[1]); setOut(JSON.stringify(arr, null, 2)) } else { const words = text.trim().toLowerCase().split(/\s+/).filter(Boolean); const map = new Map<string,number>(); for(const w of words){ map.set(w, (map.get(w)||0)+1) } const arr = Array.from(map.entries()).sort((a,b)=> b[1]-a[1]); setOut(JSON.stringify(arr, null, 2)) } }} className="px-3 py-2 rounded-xl bg-slate-900 text-white">Analyze</button>
            </div>
            <div className="relative mt-2">
              <textarea value={out} onChange={e=>setOut(e.target.value)} placeholder="[ [token, count], ... ]" className="w-full h-40 rounded-xl border p-3 font-mono text-xs dark:bg-slate-900 pr-12" />
              <div className="absolute top-2 right-2"><CopyButton value={out} /></div>
            </div>
            <div className="mt-6 text-sm leading-6 text-slate-700 dark:text-slate-300 space-y-2">
              <h3 className="text-base font-semibold">Analysis notes</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Word mode lowercases text before counting for simpler grouping.</li>
                <li>Character mode includes whitespace and punctuation as separate characters.</li>
                <li>Output is sorted by frequency descending for quick hotspot inspection.</li>
              </ul>
            </div>
          </ToolCard>
        )
      case 'diacritics':
        return (
          <ToolCard title="Remove diacritics (accents)" description="Strip accent marks from characters.">
            <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Text…" className="w-full h-40 rounded-xl border p-3 dark:bg-slate-900" />
            <div className="flex gap-2"><button onClick={()=> setOut(removeDiacritics(text))} className="px-3 py-2 rounded-xl bg-slate-900 text-white">Remove</button></div>
            <div className="relative mt-2">
              <textarea value={out} onChange={e=>setOut(e.target.value)} placeholder="Output…" className="w-full h-28 rounded-xl border p-3 font-mono text-xs dark:bg-slate-900 pr-12" />
              <div className="absolute top-2 right-2"><CopyButton value={out} /></div>
            </div>
            <div className="mt-6 text-sm leading-6 text-slate-700 dark:text-slate-300 space-y-2">
              <h3 className="text-base font-semibold">Why diacritic removal is useful</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Improve search matching when users type plain ASCII keyboards.</li>
                <li>Create stable slugs and identifiers across mixed language inputs.</li>
                <li>Keep in mind this can change meaning in some languages.</li>
              </ul>
            </div>
          </ToolCard>
        )
      case 'escape':
        return (
          <ToolCard title="String Escape / Unescape" description="Escape and unescape strings for JavaScript, JSON, HTML, and URL contexts — essential when debugging API payloads, writing test fixtures, or embedding strings in code.">
            <div className="flex flex-wrap gap-2 mb-2">
              {(['js','json','html','url'] as const).map(m => (
                <button key={m} onClick={()=>setEscMode(m)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${escMode===m ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-800'}`}>{m.toUpperCase()}</button>
              ))}
            </div>
            <textarea value={escIn} onChange={e=>setEscIn(e.target.value)} placeholder="Enter text to escape or unescape…" className="w-full h-28 rounded-xl border p-3 font-mono text-xs dark:bg-slate-900" />
            <div className="flex gap-2">
              <button onClick={()=>{
                let out = escIn
                if (escMode==='js') out = escIn.replace(/\\/g,'\\\\').replace(/"/g,'\\"').replace(/'/g,"\\'").replace(/\n/g,'\\n').replace(/\r/g,'\\r').replace(/\t/g,'\\t')
                else if (escMode==='json') out = JSON.stringify(escIn).slice(1,-1)
                else if (escMode==='html') out = escIn.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')
                else out = encodeURIComponent(escIn)
                setEscOut(out)
              }} className="px-3 py-2 rounded-xl bg-slate-900 text-white">Escape</button>
              <button onClick={()=>{
                try {
                  let out = escIn
                  if (escMode==='js' || escMode==='json') out = JSON.parse('"' + escIn.replace(/'/g,"\\'") + '"')
                  else if (escMode==='html') { const el = document.createElement('div'); el.innerHTML = escIn; out = el.textContent || '' }
                  else out = decodeURIComponent(escIn)
                  setEscOut(out)
                } catch { setEscOut('Error: invalid escape sequence') }
              }} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">Unescape</button>
            </div>
            <div className="relative">
              <textarea readOnly value={escOut} placeholder="Output…" className="w-full h-28 rounded-xl border p-3 font-mono text-xs pr-12 dark:bg-slate-900" />
              <div className="absolute top-2 right-2"><CopyButton value={escOut} /></div>
            </div>
            <div className="mt-6 text-sm leading-6 text-slate-700 dark:text-slate-300 space-y-2">
              <h3 className="text-base font-semibold">When to use each mode</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>JS</strong> — Escapes double quotes, single quotes, backslashes, and control characters (\\n, \\r, \\t). Use when embedding strings in JavaScript source code or test fixtures.</li>
                <li><strong>JSON</strong> — Follows RFC 8259 exactly: only double-quote strings, escapes \\, \\", and control chars. Use when building JSON payloads manually or in templates.</li>
                <li><strong>HTML</strong> — Converts &amp;, &lt;, &gt;, " and ' to named entities (&amp;amp;, &amp;lt;, etc.). Essential for safely inserting user content into HTML without XSS risk.</li>
                <li><strong>URL</strong> — Percent-encodes every character that is not a letter, digit, or one of: - _ . ! ~ * ' ( ). Use for query parameter values and path segments.</li>
                <li>Tip: when debugging API responses, paste the raw string in JSON mode and unescape to reveal the actual content.</li>
              </ul>
            </div>
          </ToolCard>
        )
      case 'numbase':
        return (
          <ToolCard title="Number Base Converter" description="Convert integers between decimal, hexadecimal, octal, binary, and base 36 — useful for bit manipulation, memory addresses, colour codes, and encoding work.">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <label className="text-sm font-medium">Input base:</label>
              {[2,8,10,16].map(b => (
                <button key={b} onClick={()=>setNumFromBase(b)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${numFromBase===b ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-800'}`}>
                  {b===2?'Binary':b===8?'Octal':b===10?'Decimal':'Hex'}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={numIn} onChange={e=>{ setNumIn(e.target.value); }} onKeyDown={e=>{ if(e.key==='Enter') convertNumber() }} placeholder={numFromBase===16 ? 'e.g. FF or 0xFF' : numFromBase===2 ? 'e.g. 1010' : numFromBase===8 ? 'e.g. 17' : 'e.g. 255'} className="flex-1 rounded-xl border p-3 font-mono dark:bg-slate-900" />
              <button onClick={convertNumber} className="px-4 py-2 rounded-xl bg-slate-900 text-white">Convert</button>
            </div>
            {numResults.length > 0 && (
              <div className="grid sm:grid-cols-2 gap-2">
                {numResults.map(r => (
                  <div key={r.label} className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{r.label}</div>
                      <div className="font-mono text-sm font-semibold break-all">{r.value}</div>
                    </div>
                    <CopyButton value={r.value} />
                  </div>
                ))}
              </div>
            )}
            <div className="mt-6 text-sm leading-6 text-slate-700 dark:text-slate-300 space-y-2">
              <h3 className="text-base font-semibold">Number bases quick reference</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Binary (base 2)</strong> — digits 0–1. Used in bitwise operations, network masks (e.g. /24 = 11111111.11111111.11111111.00000000), and CPU instruction encoding.</li>
                <li><strong>Octal (base 8)</strong> — digits 0–7. Common in Unix file permissions (chmod 755 = 111 101 101 in binary) and some legacy protocols.</li>
                <li><strong>Decimal (base 10)</strong> — standard human-readable integers.</li>
                <li><strong>Hexadecimal (base 16)</strong> — digits 0–9 and A–F. Used everywhere: memory addresses, colour codes (#FF5733), byte representation in logs, UUIDs, and cryptographic hashes.</li>
                <li><strong>Base 36</strong> — digits 0–9 and A–Z. Used for compact IDs (e.g. URL shorteners) because it is case-insensitive and URL-safe.</li>
                <li>Tip: prefix hex with 0x (e.g. 0xFF) — the tool strips it automatically.</li>
              </ul>
            </div>
          </ToolCard>
        )
      case 'color':
        return (
          <ToolCard title="Color Format Converter" description="Convert between HEX, RGB, HSL and CSS colour formats — useful for frontend development, design systems, and Tailwind CSS work.">
            <div className="flex gap-3 items-start">
              <div className="flex-1">
                <input value={colorIn} onChange={e=>convertColor(e.target.value)} placeholder="e.g. #FF5733  or  rgb(255,87,51)  or  hsl(11,100%,60%)" className="w-full rounded-xl border p-3 font-mono dark:bg-slate-900" />
                <p className="text-xs text-slate-400 mt-1">Accepts: #RGB, #RRGGBB, rgb(), rgba(), hsl(), hsla()</p>
              </div>
              {colorPreview && (
                <div className="w-12 h-12 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0" style={{backgroundColor: colorPreview}} />
              )}
            </div>
            {colorResults.length > 0 && (
              <div className="grid sm:grid-cols-2 gap-2">
                {colorResults.map(r => (
                  <div key={r.label} className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{r.label}</div>
                      <div className="font-mono text-sm font-semibold">{r.value}</div>
                    </div>
                    <CopyButton value={r.value} />
                  </div>
                ))}
              </div>
            )}
            <div className="mt-6 text-sm leading-6 text-slate-700 dark:text-slate-300 space-y-2">
              <h3 className="text-base font-semibold">Colour format reference</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>HEX (#RRGGBB)</strong> — the most common format in CSS and design tools. Each pair is a hex byte 00–FF representing red, green, and blue channels. Shorthand #RGB expands each digit (e.g. #F80 = #FF8800).</li>
                <li><strong>RGB (red, green, blue)</strong> — decimal values 0–255 per channel. Used in CSS, Canvas, and image processing APIs. RGBA adds an alpha (opacity) channel 0–1.</li>
                <li><strong>HSL (hue, saturation, lightness)</strong> — more intuitive for designers. Hue is 0–360° on the colour wheel; saturation and lightness are percentages. HSLA adds alpha.</li>
                <li><strong>Tailwind CSS</strong> — Tailwind v3 uses an RGB tuple as its color config format, e.g. <code>200 100 50</code> for arbitrary colour utilities.</li>
                <li>Tip: type a Tailwind hex value (from the Tailwind docs) to get the RGB values needed for your <code>tailwind.config.js</code> custom colour.</li>
              </ul>
            </div>
          </ToolCard>
        )
    }
  }

  const navItems: { key: typeof active, label: string }[] = [
    { key: 'basic', label: 'Basic operations' },
    { key: 'count', label: 'Count characters / words' },
    { key: 'case', label: 'Case converters' },
    { key: 'unicode', label: 'Unicode / Code Points' },
    { key: 'delimiter', label: 'Add delimiter / Join lines' },
    { key: 'split', label: 'Split by delimiter' },
    { key: 'diff', label: 'String Compare (Diff)' },
    { key: 'lines', label: 'Line operations' },
    { key: 'find', label: 'Find / Replace (Regex)' },
    { key: 'wrap', label: 'Wrap / Reflow' },
    { key: 'freq', label: 'Frequency Analysis' },
    { key: 'diacritics', label: 'Remove diacritics' },
    { key: 'escape', label: 'String Escape / Unescape' },
    { key: 'numbase', label: 'Number Base Converter' },
    { key: 'color', label: 'Color Format Converter' },
  ]

  return (
    <>
      <Head title="String Ninja — String Utilities: Transform, Regex, Wrap" description="Trim and clean text, convert between camel/snake/kebab/Title/sentence cases, join and split lines by delimiter, sort, deduplicate, regex find/replace, word/character wrap, frequency analysis, and remove diacritics from strings." />
      <ToolLayout
        title="String Tools"
        activeKey={active}
        navItems={navItems}
        onSelect={key => selectTool(key as any)}
      >
        {renderPanel()}
      </ToolLayout>
    </>
  )
}
