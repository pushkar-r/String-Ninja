import React, { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
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
  const navigate = useNavigate()
  const [q, setQ] = useState('')

  const tools = [
    // Encoding
    { label: 'Encoding: Base64', path: '/?tool=b64' },
    { label: 'Encoding: Base32', path: '/?tool=b32' },
    { label: 'Encoding: URL Encode/Decode', path: '/?tool=url' },
    { label: 'Encoding: HTML Entities', path: '/?tool=html' },
    { label: 'Encoding: Hex / Binary / Text', path: '/?tool=hexbin' },
    { label: 'Encoding: ROT13 / Caesar', path: '/?tool=rot' },
    // Strings
    { label: 'Strings: Basic operations', path: '/strings?tool=basic' },
    { label: 'Strings: Case converters', path: '/strings?tool=case' },
    { label: 'Strings: Unicode / Code Points', path: '/strings?tool=unicode' },
    // Compare
    { label: 'Compare: String Compare', path: '/compare?tool=diff' },
    // Security
    { label: 'Security: Hashing', path: '/security?tool=hash' },
    { label: 'Security: AES-GCM (PBKDF2)', path: '/security?tool=aes' },
    { label: 'Security: JWT Decoder', path: '/security?tool=jwt' },
    { label: 'Security: Password Hashing', path: '/security?tool=pw' },
    { label: 'Security: JWT Verify', path: '/security?tool=jwtv' },
    { label: 'Security: RSA Keygen', path: '/security?tool=rsa' },
    { label: 'Security: X.509 Decoder', path: '/security?tool=x509' },
    { label: 'Security: SAML Decoder', path: '/security?tool=saml' },
    // Data
    { label: 'Data: JSON Formatter / Minifier', path: '/data?tool=json' },
    { label: 'Data: CSV ↔ JSON', path: '/data?tool=csv' },
    { label: 'Data: Markdown → HTML', path: '/data?tool=md' },
    { label: 'Data: QR Tools', path: '/data?tool=qr' },
    { label: 'Data: Beautify / Minify', path: '/data?tool=code' },
    { label: 'Data: XML ↔ JSON', path: '/data?tool=xml' },
    { label: 'Data: Unicode Normalizer', path: '/data?tool=norm' },
    // Misc
    { label: 'Misc: Timestamp Converter', path: '/misc?tool=ts' },
    { label: 'Misc: Random & UUID', path: '/misc?tool=rand' },
    { label: 'Misc: Regex Tester', path: '/misc?tool=regex' },
    { label: 'Misc: Steganography', path: '/misc?tool=stego' },
    { label: 'Misc: CSV Import Options', path: '/misc?tool=csv' },
    { label: 'Misc: Regex Save / Reuse', path: '/misc?tool=saved' },
  ]

  function goTo(query: string){
    const t = tools.find(t => t.label.toLowerCase() === query.toLowerCase()) ||
              tools.find(t => t.label.toLowerCase().includes(query.toLowerCase()))
    if (t){ navigate(t.path) }
  }

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100">
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={`${import.meta.env.BASE_URL}logo1-nobg.png`} alt="String Ninja" className="h-10 w-auto object-contain" />
            <div className="flex items-baseline gap-1 select-none">
              <span className="text-xl md:text-2xl font-extrabold italic tracking-wide text-slate-900 dark:text-slate-100">String</span>
              <span className="text-xl md:text-2xl font-black italic tracking-wider text-slate-900 dark:text-emerald-300">Ninja</span>
            </div>
          </div>
          <nav className="flex gap-2">
            <NavItem to="/">Encoding</NavItem>
            <NavItem to="/strings">Strings</NavItem>
            <NavItem to="/compare">Compare</NavItem>
            <NavItem to="/security">Security</NavItem>
            <NavItem to="/data">Data</NavItem>
            <NavItem to="/misc">Misc</NavItem>
          </nav>
          <div className="hidden md:block">
            <input
              list="tool-suggestions"
              value={q}
              onChange={e => {
                const v = e.target.value
                setQ(v)
                const exact = tools.find(t => t.label.toLowerCase() === v.toLowerCase())
                if (exact) { navigate(exact.path); setQ(''); e.currentTarget.blur() }
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  setTimeout(() => {
                    const v = e.currentTarget.value.trim()
                    const exact = tools.find(t => t.label.toLowerCase() === v.toLowerCase())
                    if (exact) { navigate(exact.path); setQ(''); e.currentTarget.blur(); return }
                    goTo(v); setQ(''); e.currentTarget.blur()
                  }, 0)
                }
              }}
              placeholder="Search features..."
              className="px-3 py-2 rounded-xl text-sm border dark:bg-slate-900 w-64"
            />
            <datalist id="tool-suggestions">
              {tools.map(t => <option key={t.path} value={t.label} />)}
            </datalist>
          </div>
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
