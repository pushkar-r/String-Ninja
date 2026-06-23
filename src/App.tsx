import React from 'react'
import { Link, Outlet } from 'react-router-dom'
import Header from './components/Header'
import CookieBanner from './components/CookieBanner'

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
    >
      {children}
    </Link>
  )
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col text-slate-900 dark:text-slate-100 break-words bg-slate-50 dark:bg-slate-950">
      <Header />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        <Outlet />
      </main>
      <footer className="mt-8 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 text-sm mb-8">
            {/* Brand */}
            <div className="sm:col-span-2 md:col-span-1">
              <div className="mb-2">
                <img src="/logo1-nobg.png" alt="String Ninja" className="h-10 w-auto object-contain dark:[filter:brightness(0)_invert(1)]" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-xs leading-5">
                Free, open-source developer tools. 100% client-side — no data leaves your browser.
              </p>
            </div>
            {/* Tools */}
            <div>
              <p className="font-semibold text-slate-700 dark:text-slate-300 mb-2 text-xs uppercase tracking-wide">Tools</p>
              <ul className="space-y-1.5">
                <li><FooterLink to="/">Encoding</FooterLink></li>
                <li><FooterLink to="/strings/">Strings</FooterLink></li>
                <li><FooterLink to="/security/">Security</FooterLink></li>
                <li><FooterLink to="/data/">Data</FooterLink></li>
                <li><FooterLink to="/misc/">Misc</FooterLink></li>
                <li><FooterLink to="/tools/">All Tools</FooterLink></li>
              </ul>
            </div>
            {/* Learn */}
            <div>
              <p className="font-semibold text-slate-700 dark:text-slate-300 mb-2 text-xs uppercase tracking-wide">Learn</p>
              <ul className="space-y-1.5">
                <li><FooterLink to="/learn/">Guides Hub</FooterLink></li>
                <li><FooterLink to="/learn/base64-guide/">Base64 Guide</FooterLink></li>
                <li><FooterLink to="/learn/jwt-security-guide/">JWT Guide</FooterLink></li>
                <li><FooterLink to="/learn/hashing-password-guide/">Hashing Guide</FooterLink></li>
                <li><FooterLink to="/learn/regex-text-guide/">Regex Guide</FooterLink></li>
              </ul>
            </div>
            {/* Company */}
            <div>
              <p className="font-semibold text-slate-700 dark:text-slate-300 mb-2 text-xs uppercase tracking-wide">Info</p>
              <ul className="space-y-1.5">
                <li><FooterLink to="/about/">About</FooterLink></li>
                <li><FooterLink to="/contact/">Contact</FooterLink></li>
                <li><FooterLink to="/privacy/">Privacy Policy</FooterLink></li>
                <li><FooterLink to="/terms/">Terms of Use</FooterLink></li>
                <li><FooterLink to="/resources/">Resources</FooterLink></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-200 dark:border-slate-800 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400 dark:text-slate-500">
            <span>© {new Date().getFullYear()} String Ninja. MIT Licensed.</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
              100% client-side · No tracking · No data storage
            </span>
          </div>
        </div>
      </footer>
      <CookieBanner />
    </div>
  )
}
