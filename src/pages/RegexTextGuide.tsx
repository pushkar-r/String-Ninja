import React from 'react'
import Head from '../components/Head'

export default function RegexTextGuide() {
  return (
    <>
      <Head
        title="Regex and Text Processing Guide — String Ninja"
        description="Practical regex and text transformation guide for safe find/replace, cleanup workflows, and reliable string operations."
      />
      <article className="max-w-4xl mx-auto grid gap-6">
        <header className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6">
          <h1 className="text-2xl md:text-3xl font-bold">Regex and Text Processing Guide</h1>
          <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
            Text tooling is one of the fastest ways to clean operational data, but broad replacements can cause silent damage.
            A disciplined process keeps transformations reversible and predictable.
          </p>
        </header>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 grid gap-3">
          <h2 className="text-xl font-semibold">Safe Regex Workflow</h2>
          <ol className="list-decimal pl-5 text-sm leading-6 text-slate-700 dark:text-slate-300 space-y-1">
            <li>Start with a narrow pattern and sample input.</li>
            <li>Run find-only first and inspect match positions.</li>
            <li>Apply replacement after confirming all intended matches.</li>
            <li>Keep pre-change text to allow rollback.</li>
          </ol>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 grid gap-3">
          <h2 className="text-xl font-semibold">Useful String Operations in Sequence</h2>
          <ul className="list-disc pl-5 text-sm leading-6 text-slate-700 dark:text-slate-300 space-y-1">
            <li>Split, trim, and remove empty entries.</li>
            <li>Sort and deduplicate for stable review output.</li>
            <li>Join with explicit delimiters for downstream systems.</li>
            <li>Apply case conversion only after semantic cleanup.</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 grid gap-3">
          <h2 className="text-xl font-semibold">Common Failure Modes</h2>
          <ul className="list-disc pl-5 text-sm leading-6 text-slate-700 dark:text-slate-300 space-y-1">
            <li>Greedy patterns that remove more than expected.</li>
            <li>Missing flags causing partial or case-sensitive misses.</li>
            <li>Unicode edge cases where visual characters are multi-code-point.</li>
            <li>Over-normalization that changes meaning in multilingual text.</li>
          </ul>
        </section>
      </article>
    </>
  )
}
