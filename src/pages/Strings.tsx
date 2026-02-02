import React, { useEffect, useMemo, useState } from 'react'
import ToolCard from '../components/ToolCard'
import CopyButton from '../components/CopyButton'
import Head from '../components/Head'
import { useSearchParams } from 'react-router-dom'

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
  const [active, setActive] = useState<'basic'|'count'|'case'|'unicode'|'delimiter'|'split'|'lines'|'find'|'wrap'|'freq'|'diacritics'>(
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

  useEffect(()=>{
    const t = searchParams.get('tool') as any
    if (t && t !== active) setActive(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])
  // Clear input/output when switching tools for predictable UX
  useEffect(()=>{ setText(''); setOut('') }, [active])
  function selectTool(key: typeof active){ setActive(key); setSearchParams({ tool: key }) }

  function parseEscapes(s: string){ return s.replace(/\\n/g, '\n').replace(/\\t/g, '\t') }
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
    { key: 'lines', label: 'Line operations' },
    { key: 'find', label: 'Find / Replace (Regex)' },
    { key: 'wrap', label: 'Wrap / Reflow' },
    { key: 'freq', label: 'Frequency Analysis' },
    { key: 'diacritics', label: 'Remove diacritics' },
  ]

  return (
    <>
      <Head title="String Ninja — String Utilities (Transform, Regex, Wrap, Frequency)" description="Trim and clean text, convert cases, join lines, regex find/replace, wrap text, frequency analysis, remove accents, and more." />
      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
      <div className="bg-white dark:bg-slate-950 rounded-2xl p-3 shadow-sm border border-slate-200 dark:border-slate-800 h-fit md:sticky md:top-24">
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm font-semibold px-2 pb-2 md:pb-2">String Tools</div>
          <div className="md:hidden w-full">
            <select
              value={active}
              onChange={e=>selectTool(e.target.value as any)}
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
