import React from 'react'
import Head from '../components/Head'

export default function HashingPasswordGuide() {
  return (
    <>
      <Head
        title="Hashing and Password Security Guide — String Ninja"
        description="Learn when to use hashes, why password hashing differs from file hashing, and how to choose bcrypt or Argon2 safely."
      />
      <article className="max-w-4xl mx-auto grid gap-6">
        <header className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6">
          <h1 className="text-2xl md:text-3xl font-bold">Hashing and Password Security Guide</h1>
          <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
            Hashing is used for integrity checks, indexing, and cryptographic workflows. Password storage is a separate use case that requires
            deliberately slow, salted algorithms. Mixing these two use cases is a critical security mistake.
          </p>
        </header>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 grid gap-3">
          <h2 className="text-xl font-semibold">File and Message Integrity</h2>
          <ul className="list-disc pl-5 text-sm leading-6 text-slate-700 dark:text-slate-300 space-y-1">
            <li>Use SHA-256 or SHA-512 for integrity comparisons.</li>
            <li>Compare expected hash from a trusted source.</li>
            <li>Any single-byte change produces a different digest.</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 grid gap-3">
          <h2 className="text-xl font-semibold">Password Storage Requirements</h2>
          <ul className="list-disc pl-5 text-sm leading-6 text-slate-700 dark:text-slate-300 space-y-1">
            <li>Use bcrypt or Argon2 with per-password salts.</li>
            <li>Tune cost parameters based on environment and login latency budget.</li>
            <li>Never store plaintext passwords or unsalted fast hashes.</li>
          </ul>
          <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">
            MD5 and SHA-1 are not acceptable for modern password storage. Even raw SHA-256 is too fast for password defense.
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 grid gap-3">
          <h2 className="text-xl font-semibold">Operational Recommendations</h2>
          <ol className="list-decimal pl-5 text-sm leading-6 text-slate-700 dark:text-slate-300 space-y-1">
            <li>Use strong password policy with rate limits and MFA.</li>
            <li>Store algorithm and cost metadata with each hash.</li>
            <li>Support gradual rehash on login when raising cost.</li>
            <li>Keep secrets and peppers outside application source code.</li>
          </ol>
        </section>
      </article>
    </>
  )
}
