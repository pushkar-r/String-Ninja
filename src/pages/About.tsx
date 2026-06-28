import React from 'react'
import Head from '../components/Head'
import { Link } from 'react-router-dom'

const stats = [
  { label: 'Free Tools', value: '50+' },
  { label: 'Developer Guides', value: '9' },
  { label: 'Supported Formats', value: '30+' },
  { label: 'Data Leaves Browser', value: '0 bytes' },
]

const toolCategories = [
  {
    name: 'Encoding & Decoding',
    path: '/',
    desc: 'Base64, Base32, URL encoding, HTML entities, hex/binary conversions, ROT13, Gzip, Base58, Ascii85, UTF-16/32.',
  },
  {
    name: 'String Utilities',
    path: '/strings/',
    desc: 'Case conversion, character/word count, delimiter join/split, line sort/dedup, regex find & replace, frequency analysis, string diff.',
  },
  {
    name: 'Security Tools',
    path: '/security/',
    desc: 'MD5/SHA hashing, AES-GCM encryption, JWT decode/verify/sign, bcrypt/Argon2 hashing, RSA/ECC key generation, X.509 and SAML decoding.',
  },
  {
    name: 'Data Tools',
    path: '/data/',
    desc: 'JSON formatter, QR code generator/scanner, code beautifier/minifier, XML↔JSON conversion, Unicode normalizer.',
  },
  {
    name: 'Misc Utilities',
    path: '/misc/',
    desc: 'Unix timestamp converter, password generator, UUID/random generator, regex tester, image steganography.',
  },
]

export default function About() {
  return (
    <>
      <Head
        title="About String Ninja — Free Developer Tools Built for Speed and Privacy"
        description="Learn about String Ninja: who built it, why it exists, and how 50+ free client-side developer tools help engineers with encoding, security, data formatting, and more."
        canonical="https://stringninja.in/about/"
      />
      <article className="max-w-4xl mx-auto grid gap-6">

        {/* Hero */}
        <header className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 md:p-8">
          <h1 className="text-2xl md:text-3xl font-bold">About String Ninja</h1>
          <p className="mt-3 text-base leading-7 text-slate-600 dark:text-slate-300">
            String Ninja is a free, open-source collection of browser-based developer tools for encoding, security,
            data formatting, and text processing. Every tool runs entirely in your browser — no data ever leaves your device.
          </p>
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {stats.map(s => (
              <div key={s.label} className="rounded-xl bg-slate-50 dark:bg-slate-800 p-4 text-center">
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{s.value}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </header>

        {/* Why it exists */}
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 grid gap-4">
          <h2 className="text-xl font-semibold">Why String Ninja Exists</h2>
          <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
            Day-to-day engineering work constantly demands small, focused operations: decode a JWT payload during auth debugging,
            convert a Base64-encoded log value, normalize Unicode before a database query, hash a file for integrity verification,
            or clean up malformed JSON before an API test.
          </p>
          <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
            These tasks are simple in isolation but expensive in context-switching — every one requires opening a new browser tab,
            running a one-off script, or trusting a third-party website with potentially sensitive data. String Ninja eliminates
            that friction by grouping the most common utilities in one place, organized by workflow rather than academic category.
          </p>
          <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
            The client-side architecture is intentional: your input data is processed in your own browser runtime and is never
            transmitted to or stored on any server. This makes String Ninja appropriate for inspecting credentials, tokens,
            certificates, and payloads that you would not want to paste into an unknown online service.
          </p>
        </section>

        {/* Tool categories */}
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 grid gap-4">
          <h2 className="text-xl font-semibold">What's Available</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {toolCategories.map(cat => (
              <Link
                key={cat.path}
                to={cat.path}
                className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-colors group"
              >
                <p className="font-semibold text-sm text-emerald-700 dark:text-emerald-400 group-hover:underline">{cat.name}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{cat.desc}</p>
              </Link>
            ))}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Browse every tool on the <Link to="/tools/" className="underline text-emerald-700 dark:text-emerald-400">All Tools page</Link>,
            or explore in-depth explanations in the <Link to="/learn/" className="underline text-emerald-700 dark:text-emerald-400">Guides Hub</Link>.
          </p>
        </section>

        {/* Who uses it */}
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 grid gap-4">
          <h2 className="text-xl font-semibold">Who Uses String Ninja</h2>
          <div className="grid sm:grid-cols-2 gap-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
            <div className="flex gap-3">
              <span className="text-emerald-500 text-lg mt-0.5">⌨</span>
              <div><strong className="text-slate-900 dark:text-white">Software Developers</strong> — encoding/decoding, JSON formatting, regex testing, and quick transformations during development and debugging.</div>
            </div>
            <div className="flex gap-3">
              <span className="text-emerald-500 text-lg mt-0.5">🔒</span>
              <div><strong className="text-slate-900 dark:text-white">Security Engineers</strong> — JWT inspection, X.509 certificate decoding, SAML response analysis, hashing, and key generation.</div>
            </div>
            <div className="flex gap-3">
              <span className="text-emerald-500 text-lg mt-0.5">⚙️</span>
              <div><strong className="text-slate-900 dark:text-white">DevOps &amp; Platform Teams</strong> — log parsing, timestamp conversion, structured data conversion, and config cleaning during incidents.</div>
            </div>
            <div className="flex gap-3">
              <span className="text-emerald-500 text-lg mt-0.5">🎓</span>
              <div><strong className="text-slate-900 dark:text-white">Students &amp; Learners</strong> — understanding real-world formats like Base64, JWT, and SHA hashing through live visual experimentation.</div>
            </div>
          </div>
        </section>

        {/* Author / E-E-A-T */}
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 grid gap-4">
          <h2 className="text-xl font-semibold">Built By</h2>
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0 text-2xl font-black text-emerald-700 dark:text-emerald-300">
              PR
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white">Pushkar Raj</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Software Engineer — Identity &amp; Access Management, Security Automation</p>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Pushkar is a software engineer specialising in Identity &amp; Access Management (IAM) and security automation.
                He built String Ninja to address a recurring need during security engineering work: fast, trustworthy, offline-capable
                tools for inspecting tokens, certificates, encoded payloads, and cryptographic outputs — without sending sensitive
                data to unknown third-party services.
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                His hands-on experience with authentication protocols (OAuth 2.0, SAML, OIDC), enterprise IAM systems, and security
                automation informs the tool selection and the practical guides published on this site.
              </p>
              <a
                href="https://linkedin.com/in/pushkarr"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-3 text-sm text-emerald-700 dark:text-emerald-400 hover:underline font-medium"
              >
                LinkedIn Profile →
              </a>
            </div>
          </div>
        </section>

        {/* Principles */}
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 grid gap-4">
          <h2 className="text-xl font-semibold">Principles</h2>
          <ul className="grid gap-3">
            {[
              ['Privacy first', 'All tool computations run in your browser. No input data is ever sent to a server.'],
              ['Practical utility', 'Tools are selected and designed for real tasks engineers encounter regularly, not theoretical completeness.'],
              ['Honest limitations', 'Educational helpers are not a substitute for formal security reviews, compliance assessments, or production-grade libraries.'],
              ['Continuous improvement', 'Tools, descriptions, and guides are updated as standards evolve and user feedback is received.'],
              ['Open source', 'The full source code is available on GitHub under the MIT licence.'],
            ].map(([title, desc]) => (
              <li key={title} className="flex gap-3 text-sm leading-6">
                <span className="text-emerald-500 font-bold shrink-0 mt-0.5">✓</span>
                <span className="text-slate-600 dark:text-slate-300"><strong className="text-slate-900 dark:text-white">{title}:</strong> {desc}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* CTA */}
        <section className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-6 text-center">
          <p className="font-semibold text-slate-900 dark:text-white mb-1">Have feedback or a tool request?</p>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">We'd love to hear from you.</p>
          <Link
            to="/contact/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm transition-colors"
          >
            Contact Us
          </Link>
        </section>

      </article>
    </>
  )
}
