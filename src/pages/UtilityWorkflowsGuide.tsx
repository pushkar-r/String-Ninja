import React from 'react'
import Head from '../components/Head'

export default function UtilityWorkflowsGuide() {
  return (
    <>
      <Head
        title="Developer Utility Workflows Guide — String Ninja"
        description="Guide to chaining encoding, string, data, and security tools for efficient day-to-day engineering and incident workflows."
      />
      <article className="max-w-4xl mx-auto grid gap-6">
        <header className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6">
          <h1 className="text-2xl md:text-3xl font-bold">Developer Utility Workflows Guide</h1>
          <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
            The highest value from utility tools comes from chaining them in repeatable sequences. This guide shows practical combinations
            for debugging, support, and data-cleanup tasks.
          </p>
        </header>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 grid gap-3">
          <h2 className="text-xl font-semibold">Workflow: API Incident Triage</h2>
          <ol className="list-decimal pl-5 text-sm leading-6 text-slate-700 dark:text-slate-300 space-y-1">
            <li>Decode URL and Base64 fragments from logs.</li>
            <li>Format JSON payloads for readable diff.</li>
            <li>Compare failing payload against known-good payload.</li>
            <li>Run regex cleanup to isolate key fields and repeated errors.</li>
          </ol>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 grid gap-3">
          <h2 className="text-xl font-semibold">Workflow: Auth Debugging</h2>
          <ol className="list-decimal pl-5 text-sm leading-6 text-slate-700 dark:text-slate-300 space-y-1">
            <li>Decode JWT header and payload to inspect claims.</li>
            <li>Verify signature with expected key and algorithm.</li>
            <li>Check timestamps for expiry or not-before failures.</li>
            <li>Validate cert and SAML assertions when federation is involved.</li>
          </ol>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 grid gap-3">
          <h2 className="text-xl font-semibold">Workflow: Data Cleanup for Migration</h2>
          <ol className="list-decimal pl-5 text-sm leading-6 text-slate-700 dark:text-slate-300 space-y-1">
            <li>Split and trim source values.</li>
            <li>Normalize Unicode and remove optional diacritics when required.</li>
            <li>Apply case conversion to match target schema conventions.</li>
            <li>Rejoin with deterministic delimiters and validate with frequency checks.</li>
          </ol>
        </section>
      </article>
    </>
  )
}
