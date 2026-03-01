import React from 'react'
import { Link, Outlet } from 'react-router-dom'
import Header from './components/Header'

export default function App() {
  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100 break-words">
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-6xl mx-auto px-4 grid gap-3">
          <div>100% client-side. No data leaves your device.</div>
          <nav className="flex flex-wrap justify-center gap-x-4 gap-y-2">
            <Link to="/tools" className="underline">Tools</Link>
            <Link to="/learn" className="underline">Learn</Link>
            <Link to="/resources" className="underline">Resources</Link>
            <Link to="/about" className="underline">About</Link>
            <Link to="/privacy" className="underline">Privacy</Link>
            <Link to="/terms" className="underline">Terms</Link>
            <Link to="/contact" className="underline">Contact</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
