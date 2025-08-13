import React, { useState } from 'react'
import ToolCard from '../components/ToolCard'
import * as Diff from 'diff'

export default function Compare() {
  const [a, setA] = useState('')
  const [b, setB] = useState('')
  const [mode, setMode] = useState<'words'|'chars'|'lines'>('words')
  const diffs = mode==='words' ? Diff.diffWords(a,b) : mode==='chars' ? Diff.diffChars(a,b) : Diff.diffLines(a,b)

  return (
    <div className="grid gap-6">
      <ToolCard title="String Compare (Diff)">
        <div className="flex gap-2 items-center mb-2">
          <label className="text-sm">Mode</label>
          <select value={mode} onChange={e=>setMode(e.target.value as any)} className="px-2 py-2 rounded-xl border dark:bg-slate-900">
            <option value="words">Words</option>
            <option value="chars">Chars</option>
            <option value="lines">Lines</option>
          </select>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <textarea value={a} onChange={e=>setA(e.target.value)} placeholder="Text A…" className="w-full h-40 rounded-xl border p-3 dark:bg-slate-900" />
          <textarea value={b} onChange={e=>setB(e.target.value)} placeholder="Text B…" className="w-full h-40 rounded-xl border p-3 dark:bg-slate-900" />
        </div>
        <div className="rounded-xl border p-3 text-sm leading-7 dark:bg-slate-900">
          {diffs.map((part, i) => (
            <span key={i} className={part.added ? 'bg-green-200 dark:bg-green-900 rounded px-1' : part.removed ? 'bg-red-200 dark:bg-red-900 rounded px-1 line-through' : ''}>
              {part.value}
            </span>
          ))}
        </div>
      </ToolCard>
    </div>
  )
}
