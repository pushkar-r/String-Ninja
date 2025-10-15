import React, { useState } from 'react'
import ToolCard from '../components/ToolCard'
import CopyButton from '../components/CopyButton'
import Head from '../components/Head'
import * as Diff from 'diff'

export default function Compare() {
  const [active, setActive] = useState<'diff'>('diff')
  const [a, setA] = useState('')
  const [b, setB] = useState('')
  const [mode, setMode] = useState<'words'|'chars'|'lines'>('words')
  const [view, setView] = useState<'inline'|'side'>('inline')

  const navItems: { key: typeof active, label: string }[] = [
    { key: 'diff', label: 'String Compare' },
  ]

  function InlineDiff(){
    const diffs = mode==='words' ? Diff.diffWords(a,b) : mode==='chars' ? Diff.diffChars(a,b) : Diff.diffLines(a,b)
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
  }

  function SideBySideDiff(){
    // Side-by-side makes most sense at line granularity
    const diffs = Diff.diffLines(a, b)
    const left: { text: string; type: 'ctx'|'rem' }[] = []
    const right: { text: string; type: 'ctx'|'add' }[] = []
    for (const part of diffs){
      const lines = part.value.split('\n')
      // remove the trailing empty line from split when value ends with \n
      if (lines[lines.length-1] === '') lines.pop()
      if (part.added){
        for (const line of lines){ right.push({ text: line, type: 'add' }); left.push({ text: '', type: 'ctx' }) }
      } else if (part.removed){
        for (const line of lines){ left.push({ text: line, type: 'rem' }); right.push({ text: '', type: 'ctx' }) }
      } else {
        for (const line of lines){ left.push({ text: line, type: 'ctx' }); right.push({ text: line, type: 'ctx' }) }
      }
    }
    const Row = ({l, r}:{l: typeof left[number], r: typeof right[number]})=> (
      <div className="grid grid-cols-2 gap-2 text-sm relative">
        <div className="relative">
          <div className="absolute top-2 right-2"><CopyButton value={l.text} /></div>
          <pre className={`rounded-lg border p-2 overflow-auto dark:bg-slate-900 ${l.type==='rem' ? 'bg-red-50 dark:bg-red-950' : ''}`}>{l.text || '\u00A0'}</pre>
        </div>
        <div className="relative">
          <div className="absolute top-2 right-2"><CopyButton value={r.text} /></div>
          <pre className={`rounded-lg border p-2 overflow-auto dark:bg-slate-900 ${r.type==='add' ? 'bg-green-50 dark:bg-green-950' : ''}`}>{r.text || '\u00A0'}</pre>
        </div>
      </div>
    )
    return (
      <div className="grid gap-1">
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-500"><div>Original</div><div>Changed</div></div>
        {left.map((l, i)=> <Row key={i} l={l} r={right[i]} />)}
      </div>
    )
  }

  function renderPanel(){
    return (
      <>
      <Head title="String Ninja — String Compare (Diff)" description="Visual diff between two texts by words, characters, or lines; inline or side-by-side." />
      <ToolCard title="String Compare (Diff)" description="Visual diff between two texts by words, characters, or lines; inline or side-by-side.">
        <div className="flex flex-wrap gap-3 items-center mb-2">
          <div className="flex gap-2 items-center">
            <label className="text-sm">Mode</label>
            <select value={mode} onChange={e=>setMode(e.target.value as any)} className="px-2 py-2 rounded-xl border dark:bg-slate-900">
              <option value="words">Words</option>
              <option value="chars">Chars</option>
              <option value="lines">Lines</option>
            </select>
          </div>
          <div className="flex gap-2 items-center">
            <label className="text-sm">View</label>
            <select value={view} onChange={e=>setView(e.target.value as any)} className="px-2 py-2 rounded-xl border dark:bg-slate-900">
              <option value="inline">Inline</option>
              <option value="side">Side-by-side</option>
            </select>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <textarea value={a} onChange={e=>setA(e.target.value)} placeholder="Text A…" className="w-full h-40 rounded-xl border p-3 dark:bg-slate-900" />
          <textarea value={b} onChange={e=>setB(e.target.value)} placeholder="Text B…" className="w-full h-40 rounded-xl border p-3 dark:bg-slate-900" />
        </div>
        <div className="mt-3">
          {view==='inline' ? <InlineDiff/> : <SideBySideDiff/>}
        </div>
      </ToolCard>
      </>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-[220px_1fr]">
      <div className="bg-white dark:bg-slate-950 rounded-2xl p-3 shadow-sm border border-slate-200 dark:border-slate-800 h-fit sticky top-24">
        <div className="text-sm font-semibold px-2 pb-2">Compare Tools</div>
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
