import React, { useMemo, useState } from 'react'
import ToolCard from '../components/ToolCard'

function slugify(str: string) {
  return str.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}
function toCamel(s: string){ return s.replace(/[-_\s]+(.)?/g, (_,c)=> c? c.toUpperCase(): '').replace(/^(.)/, m=> m.toLowerCase()) }
function toPascal(s: string){ const c = toCamel(s); return c.charAt(0).toUpperCase()+c.slice(1) }
function toSnake(s: string){ return s.trim().replace(/\s+/g,'_').replace(/([a-z])([A-Z])/g,'$1_$2').toLowerCase() }
function toKebab(s: string){ return s.trim().replace(/\s+/g,'-').replace(/([a-z])([A-Z])/g,'$1-$2').toLowerCase() }

export default function Strings() {
  const [active, setActive] = useState<'basic'|'case'|'unicode'>('basic')

  const [text, setText] = useState('')
  const words = useMemo(()=> text.trim() ? text.trim().split(/\s+/).length : 0, [text])
  const chars = text.length

  const [out, setOut] = useState('')
  const [codepoints, setCodepoints] = useState('')

  function renderPanel(){
    switch (active) {
      case 'basic':
        return (
          <ToolCard title="Basic operations">
            <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Enter text…" className="w-full h-40 rounded-xl border p-3 dark:bg-slate-900" />
            <div className="flex flex-wrap gap-2">
              <button onClick={()=>setText(text.trim())} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">Trim</button>
              <button onClick={()=>setText(text.toUpperCase())} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">UPPERCASE</button>
              <button onClick={()=>setText(text.toLowerCase())} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">lowercase</button>
              <button onClick={()=>setText(text.split('').reverse().join(''))} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">Reverse</button>
              <button onClick={()=>setText(slugify(text))} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">Slugify</button>
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Chars: {chars} • Words: {words}</div>
          </ToolCard>
        )
      case 'case':
        return (
          <ToolCard title="Case converters">
            <div className="flex flex-wrap gap-2">
              <button onClick={()=>setOut(toCamel(text))} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">camelCase</button>
              <button onClick={()=>setOut(toPascal(text))} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">PascalCase</button>
              <button onClick={()=>setOut(toSnake(text))} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">snake_case</button>
              <button onClick={()=>setOut(toKebab(text))} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">kebab-case</button>
            </div>
            <input value={out} onChange={e=>setOut(e.target.value)} placeholder="Output…" className="w-full rounded-xl border p-3 dark:bg-slate-900" />
          </ToolCard>
        )
      case 'unicode':
        return (
          <ToolCard title="Unicode / ASCII / Code Points">
            <button onClick={()=>setCodepoints(Array.from(text).map(ch=> ch+` U+${ch.codePointAt(0)!.toString(16).toUpperCase().padStart(4,'0')}`).join('\n'))} className="px-3 py-2 rounded-xl bg-slate-900 text-white">Show code points</button>
            <textarea value={codepoints} onChange={e=>setCodepoints(e.target.value)} className="w-full h-32 rounded-xl border p-3 font-mono text-xs dark:bg-slate-900" />
          </ToolCard>
        )
    }
  }

  const navItems: { key: typeof active, label: string }[] = [
    { key: 'basic', label: 'Basic operations' },
    { key: 'case', label: 'Case converters' },
    { key: 'unicode', label: 'Unicode / Code Points' },
  ]

  return (
    <div className="grid gap-6 md:grid-cols-[220px_1fr]">
      <div className="bg-white dark:bg-slate-950 rounded-2xl p-3 shadow-sm border border-slate-200 dark:border-slate-800 h-fit sticky top-24">
        <div className="text-sm font-semibold px-2 pb-2">String Tools</div>
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
  )
}
