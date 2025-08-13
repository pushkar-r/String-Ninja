import React from 'react'

export default function ToolCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-950 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800">
      <div className="mb-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        {description && <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{description}</p>}
      </div>
      <div className="grid gap-3">{children}</div>
    </div>
  )
}
