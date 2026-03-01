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
        </section>
      </article>
    </>
  )
}
