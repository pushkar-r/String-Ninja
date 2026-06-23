import React from 'react'

export default function ToolCard({
  title,
  description,
  children,
  badge,
}: {
  title: string
  description?: string
  children: React.ReactNode
  badge?: string
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden animate-fade-up">
      <div className="px-5 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
            {description && (
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 leading-5">{description}</p>
            )}
          </div>
          {badge && (
            <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded-full">
              {badge}
            </span>
          )}
        </div>
      </div>
      <div className="p-5 grid gap-3">{children}</div>
    </div>
  )
}
