import React from 'react'
import Head from '../components/Head'

export default function UrlHtmlEncodingGuide() {
  return (
    <>
      <Head
        title="URL and HTML Encoding Guide — String Ninja"
        description="Learn URL percent-encoding and HTML entity encoding, when to use each, and how to avoid common parsing and security mistakes."
      />
      <article className="max-w-4xl mx-auto grid gap-6">
        <header className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6">
          <h1 className="text-2xl md:text-3xl font-bold">URL and HTML Encoding Guide</h1>
          <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
            URL encoding and HTML entity encoding solve different problems. URL percent-encoding keeps values safe inside URL components,
            while HTML entity encoding keeps text safe when rendered in HTML markup. Mixing them incorrectly is a common source of bugs.
          </p>
        </header>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 grid gap-3">
          <h2 className="text-xl font-semibold">When to Use URL Encoding</h2>
          <ul className="list-disc pl-5 text-sm leading-6 text-slate-700 dark:text-slate-300 space-y-1">
            <li>Encode query parameter values and path fragments that contain reserved characters.</li>
            <li>Use percent encoding for spaces and symbols that are not URL-safe.</li>
            <li>Decode only once at the expected boundary to avoid double-decoding issues.</li>
          </ul>
          <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">
            A value like <code>a+b&amp;c</code> can break parameter parsing if inserted raw. Encoding ensures separators are interpreted as data,
            not as URL syntax.
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 grid gap-3">
          <h2 className="text-xl font-semibold">When to Use HTML Entity Encoding</h2>
          <ul className="list-disc pl-5 text-sm leading-6 text-slate-700 dark:text-slate-300 space-y-1">
            <li>Encode user-supplied text before inserting it into raw HTML strings.</li>
            <li>Escape special characters such as <code>&lt;</code>, <code>&gt;</code>, <code>&amp;</code>, and quotes.</li>
            <li>Use context-aware escaping for attributes, scripts, and styles.</li>
          </ul>
          <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">
            Entity encoding prevents accidental tag interpretation and reduces XSS risk in markup contexts.
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 grid gap-3">
          <h2 className="text-xl font-semibold">Common Mistakes</h2>
          <ul className="list-disc pl-5 text-sm leading-6 text-slate-700 dark:text-slate-300 space-y-1">
            <li>Applying HTML encoding to URL values and expecting valid URLs.</li>
            <li>Encoding twice, which turns valid sequences into unreadable payloads.</li>
            <li>Decoding untrusted data too early and then reusing it in sensitive contexts.</li>
          </ul>
        </section>
      </article>
    </>
  )
}
