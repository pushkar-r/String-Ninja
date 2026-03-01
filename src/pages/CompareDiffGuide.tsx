import React from 'react'
import Head from '../components/Head'

export default function CompareDiffGuide() {
  return (
    <>
      <Head
        title="Text Diff and Comparison Guide — String Ninja"
        description="Guide to choosing word, character, or line diff modes and using side-by-side comparisons for faster reviews and debugging."
      />
      <article className="max-w-4xl mx-auto grid gap-6">
        <header className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6">
          <h1 className="text-2xl md:text-3xl font-bold">Text Diff and Comparison Guide</h1>
          <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
            Diff tools are central to troubleshooting. Whether you are reviewing config drift, API payload changes, or content edits,
            choosing the right comparison mode reduces time-to-fix.
          </p>
        </header>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 grid gap-3">
          <h2 className="text-xl font-semibold">Choosing Diff Granularity</h2>
          <ul className="list-disc pl-5 text-sm leading-6 text-slate-700 dark:text-slate-300 space-y-1">
            <li>Word diff: best for prose and medium-length text edits.</li>
            <li>Character diff: best for IDs, tokens, and short machine-generated strings.</li>
            <li>Line diff: best for logs, stack traces, and configuration files.</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 grid gap-3">
          <h2 className="text-xl font-semibold">Inline vs Side-by-Side</h2>
          <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">
            Inline views are compact and ideal for quick scans. Side-by-side views are better for multiline content where positional context
            matters. For high-risk changes, side-by-side review lowers the chance of missing an unintended deletion.
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 grid gap-3">
          <h2 className="text-xl font-semibold">Operational Tips</h2>
          <ol className="list-decimal pl-5 text-sm leading-6 text-slate-700 dark:text-slate-300 space-y-1">
            <li>Normalize whitespace before diffing noisy text.</li>
            <li>Use line mode first, then switch to character mode for precise inspection.</li>
            <li>Preserve the original snapshot so review is auditable.</li>
          </ol>
        </section>
      </article>
    </>
  )
}
