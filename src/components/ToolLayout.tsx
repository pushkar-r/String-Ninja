import React from 'react'

type NavItem = { key: string; label: string }

type ToolLayoutProps = {
  title: string
  activeKey: string
  navItems: NavItem[]
  onSelect: (key: string) => void
  children: React.ReactNode
}

export default function ToolLayout({ title, activeKey, navItems, onSelect, children }: ToolLayoutProps) {
  return (
    <div className="grid gap-5 md:grid-cols-[200px_1fr] lg:grid-cols-[220px_1fr]">
      {/* Sidebar */}
      <aside className="h-fit md:sticky md:top-20">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{title}</p>
          </div>
          {/* Mobile: dropdown */}
          <div className="p-3 md:hidden">
            <select
              value={activeKey}
              onChange={e => onSelect(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100"
            >
              {navItems.map(item => (
                <option key={item.key} value={item.key}>{item.label}</option>
              ))}
            </select>
          </div>
          {/* Desktop: button list */}
          <nav className="hidden md:block p-2" aria-label={`${title} tools`}>
            {navItems.map(item => (
              <button
                key={item.key}
                onClick={() => onSelect(item.key)}
                className={`tool-nav-item w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-100 ${
                  activeKey === item.key
                    ? 'active bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-medium'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </aside>
      {/* Content */}
      <div className="min-w-0">{children}</div>
    </div>
  )
}
