import React, { useState, useRef, useEffect } from 'react'
import { NavLink, useNavigate, Link } from 'react-router-dom'
import { useTheme } from '../theme'

const tools = [
  // Encoding
  { label: 'Base64 Encoder/Decoder', path: '/?tool=b64', category: 'Encoding' },
  { label: 'Base32 Encoder/Decoder', path: '/?tool=b32', category: 'Encoding' },
  { label: 'URL Encode/Decode', path: '/?tool=url', category: 'Encoding' },
  { label: 'HTML Entities', path: '/?tool=html', category: 'Encoding' },
  { label: 'Hex / Binary / Text', path: '/?tool=hexbin', category: 'Encoding' },
  { label: 'ROT13 / Caesar Cipher', path: '/?tool=rot', category: 'Encoding' },
  { label: 'Gzip / Deflate', path: '/?tool=zip', category: 'Encoding' },
  { label: 'Base58', path: '/?tool=b58', category: 'Encoding' },
  { label: 'Ascii85 / Base85', path: '/?tool=b85', category: 'Encoding' },
  { label: 'UTF-16 / UTF-32 Hex', path: '/?tool=utf', category: 'Encoding' },
  // Strings
  { label: 'String Basic Operations', path: '/strings?tool=basic', category: 'Strings' },
  { label: 'Character / Word Counter', path: '/strings?tool=count', category: 'Strings' },
  { label: 'Count Characters', path: '/strings?tool=count', category: 'Strings' },
  { label: 'Count Words', path: '/strings?tool=count', category: 'Strings' },
  { label: 'Case Converter', path: '/strings?tool=case', category: 'Strings' },
  { label: 'Unicode / Code Points', path: '/strings?tool=unicode', category: 'Strings' },
  { label: 'Add Delimiter / Join Lines', path: '/strings?tool=delimiter', category: 'Strings' },
  { label: 'Split by Delimiter', path: '/strings?tool=split', category: 'Strings' },
  { label: 'Line Operations', path: '/strings?tool=lines', category: 'Strings' },
  { label: 'Find / Replace (Regex)', path: '/strings?tool=find', category: 'Strings' },
  { label: 'Wrap / Reflow Text', path: '/strings?tool=wrap', category: 'Strings' },
  { label: 'Frequency Analysis', path: '/strings?tool=freq', category: 'Strings' },
  { label: 'Remove Diacritics', path: '/strings?tool=diacritics', category: 'Strings' },
  // Compare
  { label: 'Text Compare / Diff', path: '/compare?tool=diff', category: 'Compare' },
  // Security
  { label: 'Hash (MD5, SHA)', path: '/security?tool=hash', category: 'Security' },
  { label: 'AES-GCM Encrypt/Decrypt', path: '/security?tool=aes', category: 'Security' },
  { label: 'JWT Decoder', path: '/security?tool=jwt', category: 'Security' },
  { label: 'JWT Verify', path: '/security?tool=jwtv', category: 'Security' },
  { label: 'JWT Signer', path: '/security?tool=jwtSign', category: 'Security' },
  { label: 'Password Hashing (bcrypt/Argon2)', path: '/security?tool=pw', category: 'Security' },
  { label: 'RSA Key Generator', path: '/security?tool=rsa', category: 'Security' },
  { label: 'ECC Key Generator (P-256)', path: '/security?tool=ecc', category: 'Security' },
  { label: 'X.509 Certificate Decoder', path: '/security?tool=x509', category: 'Security' },
  { label: 'SAML Decoder', path: '/security?tool=saml', category: 'Security' },
  { label: 'HMAC Generator', path: '/security?tool=hmac', category: 'Security' },
  { label: 'File Hashing', path: '/security?tool=filehash', category: 'Security' },
  { label: 'PKCE Generator', path: '/security?tool=pkce', category: 'Security' },
  // Data
  { label: 'JSON Formatter / Minifier', path: '/data?tool=json', category: 'Data' },
  { label: 'Markdown to HTML', path: '/data?tool=md', category: 'Data' },
  { label: 'QR Code Generator', path: '/data?tool=qr', category: 'Data' },
  { label: 'Beautify / Minify Code', path: '/data?tool=code', category: 'Data' },
  { label: 'XML to JSON Converter', path: '/data?tool=xml', category: 'Data' },
  { label: 'Unicode Normalizer', path: '/data?tool=norm', category: 'Data' },
  // Misc
  { label: 'Timestamp Converter', path: '/misc?tool=ts', category: 'Misc' },
  { label: 'Password Generator', path: '/misc?tool=pass', category: 'Misc' },
  { label: 'UUID / Random Generator', path: '/misc?tool=rand', category: 'Misc' },
  { label: 'Regex Tester', path: '/misc?tool=regex', category: 'Misc' },
  { label: 'Image Steganography', path: '/misc?tool=stego', category: 'Misc' },
  { label: 'Regex Save / Reuse', path: '/misc?tool=saved', category: 'Misc' },
  // Pages
  { label: 'All Tools', path: '/tools/', category: 'Pages' },
  { label: 'Learn / Guides', path: '/learn/', category: 'Pages' },
  { label: 'Base64 Guide', path: '/learn/base64-guide/', category: 'Guides' },
  { label: 'JWT Security Guide', path: '/learn/jwt-security-guide/', category: 'Guides' },
  { label: 'URL Encoding Guide', path: '/learn/url-html-encoding-guide/', category: 'Guides' },
  { label: 'JSON Data Guide', path: '/learn/json-data-guide/', category: 'Guides' },
  { label: 'Regex Guide', path: '/learn/regex-text-guide/', category: 'Guides' },
  { label: 'Hashing & Password Guide', path: '/learn/hashing-password-guide/', category: 'Guides' },
  { label: 'X.509 & SAML Guide', path: '/learn/cert-saml-guide/', category: 'Guides' },
  { label: 'Text Diff Guide', path: '/learn/compare-diff-guide/', category: 'Guides' },
  { label: 'Utility Workflows Guide', path: '/learn/utility-workflows-guide/', category: 'Guides' },
  { label: 'About', path: '/about/', category: 'Pages' },
  { label: 'Privacy Policy', path: '/privacy/', category: 'Pages' },
  { label: 'Terms of Use', path: '/terms/', category: 'Pages' },
  { label: 'Contact', path: '/contact/', category: 'Pages' },
]

const navLinks = [
  { to: '/', label: 'Encoding' },
  { to: '/strings/', label: 'Strings' },
  { to: '/compare/', label: 'Compare' },
  { to: '/security/', label: 'Security' },
  { to: '/data/', label: 'Data' },
  { to: '/misc/', label: 'Misc' },
  { to: '/tools/', label: 'Tools' },
  { to: '/learn/', label: 'Learn' },
]

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  )
}

function NavItem({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
          isActive
            ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
        }`
      }
    >
      {children}
    </NavLink>
  )
}

export default function Header() {
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<typeof tools>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [focusIdx, setFocusIdx] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!q.trim()) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }
    const lower = q.toLowerCase()
    const matches = tools
      .filter(t => t.label.toLowerCase().includes(lower))
      .slice(0, 8)
    setSuggestions(matches)
    setShowSuggestions(matches.length > 0)
    setFocusIdx(-1)
  }, [q])

  function navigateTo(path: string) {
    navigate(path)
    setQ('')
    setShowSuggestions(false)
    setMobileOpen(false)
    inputRef.current?.blur()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showSuggestions) {
      if (e.key === 'Enter') {
        e.preventDefault()
        const lower = q.trim().toLowerCase()
        const match = tools.find(t => t.label.toLowerCase().includes(lower))
        if (match) navigateTo(match.path)
      }
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setFocusIdx(i => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setFocusIdx(i => Math.max(i - 1, -1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (focusIdx >= 0 && suggestions[focusIdx]) {
        navigateTo(suggestions[focusIdx].path)
      } else if (suggestions[0]) {
        navigateTo(suggestions[0].path)
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
      setQ('')
    }
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
        {/* Logo */}
        <Link to="/" className="flex items-center shrink-0 mr-1">
          <img
            src={`${import.meta.env.BASE_URL}logo1-nobg.png`}
            alt="String Ninja"
            className="h-10 w-auto object-contain"
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1 flex-1 overflow-x-auto" aria-label="Main navigation">
          {navLinks.map(n => (
            <NavItem key={n.to} to={n.to}>{n.label}</NavItem>
          ))}
        </nav>

        {/* Spacer on md (tablets) */}
        <div className="flex-1 lg:hidden" />

        {/* Search + Theme */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          {/* Search box */}
          <div className="relative" ref={dropdownRef}>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-400 w-44 lg:w-52 xl:w-64 focus-within:border-emerald-400 dark:focus-within:border-emerald-500 focus-within:bg-white dark:focus-within:bg-slate-950 transition-all">
              <SearchIcon />
              <input
                ref={inputRef}
                type="search"
                value={q}
                onChange={e => setQ(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => q && setShowSuggestions(suggestions.length > 0)}
                placeholder="Search tools…"
                className="bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 flex-1 min-w-0 outline-none"
                autoComplete="off"
                aria-label="Search tools"
                aria-autocomplete="list"
                aria-expanded={showSuggestions}
              />
              {q && (
                <button
                  onClick={() => { setQ(''); setSuggestions([]); setShowSuggestions(false) }}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs leading-none"
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>
            {showSuggestions && (
              <div className="absolute top-full mt-1.5 right-0 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg shadow-slate-900/10 dark:shadow-black/30 overflow-hidden z-50">
                {suggestions.map((s, i) => (
                  <button
                    key={s.path + s.label}
                    onMouseDown={() => navigateTo(s.path)}
                    className={`w-full text-left px-3 py-2.5 flex items-center gap-3 text-sm transition-colors ${
                      i === focusIdx
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 w-14 shrink-0">{s.category}</span>
                    <span className="truncate">{s.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggle}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>

        {/* Mobile controls */}
        <div className="md:hidden flex items-center gap-2 shrink-0">
          <button
            onClick={toggle}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"
            aria-label={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
          <button
            onClick={() => setMobileOpen(v => !v)}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md">
          <div className="max-w-6xl mx-auto px-4 py-3 space-y-3">
            {/* Mobile search */}
            <div className="relative" ref={undefined}>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                <SearchIcon />
                <input
                  type="search"
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search tools…"
                  className="bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 flex-1 outline-none"
                  autoComplete="off"
                />
              </div>
              {showSuggestions && (
                <div className="mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden">
                  {suggestions.map((s, i) => (
                    <button
                      key={s.path + s.label}
                      onMouseDown={() => navigateTo(s.path)}
                      className={`w-full text-left px-3 py-2.5 flex items-center gap-3 text-sm ${
                        i === focusIdx ? 'bg-emerald-50 dark:bg-emerald-950/50' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 w-14 shrink-0">{s.category}</span>
                      <span className="text-slate-700 dark:text-slate-200 truncate">{s.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Mobile nav links */}
            <nav className="flex flex-wrap gap-2" aria-label="Mobile navigation">
              {navLinks.map(n => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  end={n.to === '/'}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded-lg text-sm font-medium ${
                      isActive
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
                    }`
                  }
                >
                  {n.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      )}
    </header>
  )
}
