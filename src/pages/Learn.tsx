import React from 'react'
import { Link } from 'react-router-dom'
import Head from '../components/Head'

export default function Learn() {
  return (
    <>
      <Head
        title="Learn — String Ninja Guides"
        description="In-depth guides on encoding, JWTs, text processing, and practical browser-based tooling workflows."
      />
      <article className="max-w-4xl mx-auto grid gap-6">
        <header className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6">
          <h1 className="text-2xl md:text-3xl font-bold">Learn</h1>
          <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
            These guides explain the practical concepts behind common text and security tooling tasks. They are written for engineers,
            support teams, and learners who want both conceptual clarity and immediately usable workflows.
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
            Looking for specific utilities? Browse the complete tool index at{' '}
            <Link to="/tools" className="underline text-emerald-700 dark:text-emerald-400">/tools</Link>.
          </p>
        </header>

        <section className="grid gap-4">
          <Link to="/learn/base64-guide" className="block rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 hover:border-emerald-400 transition">
            <h2 className="text-xl font-semibold">Base64 in Real Systems: Encoding, Pitfalls, and Safe Usage</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
              Understand what Base64 does and does not do, where it appears in APIs, tokens, and transport systems,
              and how to avoid common decoding mistakes.
            </p>
          </Link>

          <Link to="/learn/jwt-security-guide" className="block rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 hover:border-emerald-400 transition">
            <h2 className="text-xl font-semibold">JWT Security Guide: Decode, Validate, and Avoid Trust Mistakes</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
              A practical guide to JWT structure, signature validation, expiry handling, claim checks, and common implementation hazards.
            </p>
          </Link>

          <Link to="/learn/url-html-encoding-guide" className="block rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 hover:border-emerald-400 transition">
            <h2 className="text-xl font-semibold">URL and HTML Encoding Guide</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
              Learn where percent-encoding and HTML entity encoding differ, and how to avoid double-encoding or unsafe decode flows.
            </p>
          </Link>

          <Link to="/learn/json-data-guide" className="block rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 hover:border-emerald-400 transition">
            <h2 className="text-xl font-semibold">JSON and Data Formatting Guide</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
              A practical reference for pretty-printing, minification, validation order, and XML/JSON conversion caveats.
            </p>
          </Link>

          <Link to="/learn/regex-text-guide" className="block rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 hover:border-emerald-400 transition">
            <h2 className="text-xl font-semibold">Regex and Text Processing Guide</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
              Safe find/replace workflow, text cleanup sequencing, and common regex failure modes.
            </p>
          </Link>

          <Link to="/learn/hashing-password-guide" className="block rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 hover:border-emerald-400 transition">
            <h2 className="text-xl font-semibold">Hashing and Password Security Guide</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
              Understand integrity hashing vs password hashing and why bcrypt/Argon2 must replace fast hash usage for credentials.
            </p>
          </Link>

          <Link to="/learn/cert-saml-guide" className="block rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 hover:border-emerald-400 transition">
            <h2 className="text-xl font-semibold">X.509 and SAML Troubleshooting Guide</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
              Decode-first methods for certificate and federation debugging with practical checks that prevent trust misconfiguration.
            </p>
          </Link>

          <Link to="/learn/compare-diff-guide" className="block rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 hover:border-emerald-400 transition">
            <h2 className="text-xl font-semibold">Text Diff and Comparison Guide</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
              Choose the right diff granularity and view mode for faster, safer reviews of logs, payloads, and content changes.
            </p>
          </Link>

          <Link to="/learn/utility-workflows-guide" className="block rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 hover:border-emerald-400 transition">
            <h2 className="text-xl font-semibold">Developer Utility Workflows Guide</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
              End-to-end tool chaining patterns for incident triage, auth debugging, and migration data cleanup.
            </p>
          </Link>
        </section>
      </article>
    </>
  )
}
