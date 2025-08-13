import React from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useTheme } from './theme'

function NavItem({ to, children }: { to: string, children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `px-3 py-2 rounded-xl text-sm font-medium transition hover:bg-slate-200 dark:hover:bg-slate-700 ${
          isActive ? 'bg-slate-900 text-white hover:bg-slate-900' : 'text-slate-800 dark:text-slate-200'
        }`
      }
      end
    >
      {children}
    </NavLink>
  )
}

export default function App() {
  const { theme, toggle } = useTheme()
  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100">
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-sky-500 grid place-items-center text-white font-bold">忍</div>
            <div className="font-semibold text-lg">String Ninja</div>
          </div>
          <nav className="flex gap-2">
            <NavItem to="/">Encoding</NavItem>
            <NavItem to="/strings">Strings</NavItem>
            <NavItem to="/compare">Compare</NavItem>
            <NavItem to="/security">Security</NavItem>
            <NavItem to="/data">Data</NavItem>
            <NavItem to="/misc">Misc</NavItem>
          </nav>
          <button onClick={toggle} className="px-3 py-2 rounded-xl text-sm bg-slate-900 text-white dark:bg-slate-200 dark:text-slate-900">
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
        100% client-side. No data leaves your device.
      </footer>
    </div>
  )
}
