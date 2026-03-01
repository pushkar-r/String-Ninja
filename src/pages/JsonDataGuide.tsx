import React from 'react'
import Head from '../components/Head'

export default function JsonDataGuide() {
  return (
    <>
      <Head
        title="JSON and Data Formatting Guide — String Ninja"
        description="Practical guide to JSON formatting, minification, validation, XML conversion limits, and safer troubleshooting workflows."
      />
      <article className="max-w-4xl mx-auto grid gap-6">
        <header className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6">
          <h1 className="text-2xl md:text-3xl font-bold">JSON and Data Formatting Guide</h1>
          <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
            Formatting tools are often treated as cosmetic, but they are operationally important. Clean formatting reveals malformed structure,
            hidden type mismatches, and integration defects before they become production incidents.
          </p>
        </header>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 grid gap-3">
          <h2 className="text-xl font-semibold">Pretty Print vs Minify</h2>
          <ul className="list-disc pl-5 text-sm leading-6 text-slate-700 dark:text-slate-300 space-y-1">
            <li>Pretty print improves readability for reviews and debugging.</li>
            <li>Minify reduces payload size for transport and storage efficiency.</li>
            <li>Both operations should preserve semantic JSON structure.</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 grid gap-3">
          <h2 className="text-xl font-semibold">Validation Workflow</h2>
          <ol className="list-decimal pl-5 text-sm leading-6 text-slate-700 dark:text-slate-300 space-y-1">
            <li>Parse JSON strictly and fix syntax errors first.</li>
            <li>Check expected key names and value types.</li>
            <li>Validate against schema when available.</li>
            <li>Only then apply minification for delivery.</li>
          </ol>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 grid gap-3">
          <h2 className="text-xl font-semibold">XML and JSON Conversion Caveats</h2>
          <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">
            XML and JSON are not perfectly equivalent models. Attributes, mixed content, ordering, and repeated nodes can map ambiguously.
            Round-trip conversion should be treated as best effort unless you control both schemas and test edge cases.
          </p>
          <ul className="list-disc pl-5 text-sm leading-6 text-slate-700 dark:text-slate-300 space-y-1">
            <li>Do not assume lossless round-trip for every document shape.</li>
            <li>Store a canonical source format for critical records.</li>
            <li>Use conversion for interoperability, not for long-term canonical storage.</li>
          </ul>
        </section>
      </article>
    </>
  )
}
