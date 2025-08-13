import React, { useState } from 'react'

export default function CopyButton({
  value,
  getValue,
  className = '',
  ariaLabel = 'Copy to clipboard',
}: {
  value?: string
  getValue?: () => string
  className?: string
  ariaLabel?: string
}) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    const toCopy = (typeof getValue === 'function' ? getValue() : value) || ''
    try {
      await navigator.clipboard.writeText(toCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch (e) {
      // Fallback: execCommand (best-effort, mostly unnecessary in modern browsers)
      try {
        const ta = document.createElement('textarea')
        ta.value = toCopy
        ta.style.position = 'fixed'
        ta.style.left = '-9999px'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
        setCopied(true)
        setTimeout(() => setCopied(false), 1200)
      } catch {
        // ignore
      }
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      title={copied ? 'Copied!' : ariaLabel}
      aria-label={ariaLabel}
      className={
        'p-2 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition ' +
        className
      }
    >
      {copied ? (
        // Check icon
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-emerald-600 dark:text-emerald-400">
          <path fillRule="evenodd" d="M2.25 12a9.75 9.75 0 1119.5 0 9.75 9.75 0 01-19.5 0zm14.03-2.28a.75.75 0 10-1.06-1.06l-4.72 4.72-1.72-1.72a.75.75 0 10-1.06 1.06l2.25 2.25c.3.3.77.3 1.06 0l5.25-5.25z" clipRule="evenodd" />
        </svg>
      ) : (
        // Clipboard icon
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-slate-700 dark:text-slate-300">
          <path d="M9 2.25A2.25 2.25 0 006.75 4.5v.75H6A2.25 2.25 0 003.75 7.5v12A2.25 2.25 0 006 21.75h9A2.25 2.25 0 0017.25 19.5V18h.75A2.25 2.25 0 0020.25 15.75v-9A2.25 2.25 0 0018 4.5h-.75V3.75A2.25 2.25 0 0015 1.5H9A2.25 2.25 0 006.75 3.75V4.5H9v-.75c0-.414.336-.75.75-.75h4.5c.414 0 .75.336.75.75V4.5H15c.414 0 .75.336.75.75V6H6V5.25c0-.414.336-.75.75-.75H9V3.75A1.5 1.5 0 019 2.25z" />
          <path d="M6 7.5h11.25A.75.75 0 0118 8.25v11.25a.75.75 0 01-.75.75H6a.75.75 0 01-.75-.75V8.25A.75.75 0 016 7.5z" />
        </svg>
      )}
    </button>
  )
}
