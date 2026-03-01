import React from 'react'
import Head from '../components/Head'

export default function About() {
  return (
    <>
      <Head
        title="About String Ninja — Mission, Trust, and How It Works"
        description="Learn what String Ninja is, how its client-side tools work, and the principles behind privacy-first utility tools for developers, analysts, and security teams."
      />
      <article className="max-w-4xl mx-auto grid gap-6">
        <header className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6">
          <h1 className="text-2xl md:text-3xl font-bold">About String Ninja</h1>
          <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
            String Ninja is a browser-based toolkit for text processing, encoding, cryptography helpers, and data-format conversion.
            The project was built for people who need fast, practical utilities during development, troubleshooting, and security workflows
            without moving sensitive content to unknown third-party servers.
          </p>
        </header>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 grid gap-4">
          <h2 className="text-xl font-semibold">What Problem This Site Solves</h2>
          <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">
            Day-to-day engineering work constantly requires tiny, focused operations: decode a JWT payload, compare two strings,
            normalize Unicode, hash a file, clean malformed JSON, or convert delimited lists into SQL-friendly output.
            These operations are simple in isolation but expensive in context-switching when every task requires opening a new app,
            writing one-off scripts, or using online services with uncertain handling of pasted data.
          </p>
          <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">
            String Ninja keeps these operations in one place and optimizes for speed and clarity. The goal is not to replace full IDE tooling
            or specialized CLI pipelines. The goal is to remove friction for repetitive tasks so teams spend more time solving real product
            and security problems instead of rewriting utility snippets.
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 grid gap-4">
          <h2 className="text-xl font-semibold">How It Works</h2>
          <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">
            The application runs in the browser as a client-side web app. Most tool operations execute directly in your local browser runtime.
            For common workflows this means your input text, payloads, or code samples are transformed locally and can be copied instantly.
            This architecture is intentionally simple: fewer moving parts, no mandatory account system, and minimal operational dependency.
          </p>
          <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">
            Tool pages are grouped by practical domain rather than academic categories: Encoding, Strings, Compare, Security, Data Tools,
            and Misc utilities. Each page is designed for short tasks with clear input/output fields, copy actions, and brief usage notes.
            The focus is predictable behavior and fast feedback.
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 grid gap-4">
          <h2 className="text-xl font-semibold">Who Uses String Ninja</h2>
          <div className="text-sm leading-6 text-slate-700 dark:text-slate-300 grid gap-3">
            <p>
              <span className="font-semibold">Developers:</span> for encoding, formatting, quick transformations, and one-off inspections.
            </p>
            <p>
              <span className="font-semibold">Security teams:</span> for JWT/X.509/SAML inspection, hashing, and payload troubleshooting.
            </p>
            <p>
              <span className="font-semibold">Support and operations engineers:</span> for log cleanup, structured text conversion,
              timestamp conversion, and regex experimentation during incident handling.
            </p>
            <p>
              <span className="font-semibold">Students and learners:</span> to understand how real-world data formats and text operations
              behave through immediate visual experimentation.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 grid gap-4">
          <h2 className="text-xl font-semibold">Editorial and Quality Principles</h2>
          <ul className="list-disc pl-5 text-sm leading-6 text-slate-700 dark:text-slate-300 space-y-2">
            <li>Practical utility first: tools should solve real tasks quickly.</li>
            <li>Clear behavior: inputs, outputs, and limits should be explicit.</li>
            <li>Privacy-aware defaults: avoid unnecessary data collection.</li>
            <li>Honest scope: educational helpers are not a substitute for formal compliance or production cryptographic design reviews.</li>
            <li>Continuous refinement: content, descriptions, and usability are updated as tooling and standards evolve.</li>
          </ul>
          <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">
            If you rely on these tools in production workflows, always validate critical outputs within your own test harness and
            security controls. Browser tools are excellent for speed and triage, but critical release decisions should still be backed
            by reproducible CI checks and version-controlled scripts.
          </p>
        </section>
      </article>
    </>
  )
}
