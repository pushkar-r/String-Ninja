import React from 'react'
import Head from '../components/Head'

export default function LinkResources() {
  const htmlSnippet = `<a href=\"https://stringninja.in/tools/base64-encoder-decoder\">Base64 Encoder/Decoder - String Ninja</a>`

  return (
    <>
      <Head
        title="Link and Press Resources - String Ninja"
        description="Reference links, tool citations, and share snippets for communities and documentation pages linking to String Ninja resources."
        canonical="https://stringninja.in/resources"
      />
      <article className="max-w-4xl mx-auto grid gap-6">
        <header className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6">
          <h1 className="text-2xl md:text-3xl font-bold">Link and Press Resources</h1>
          <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
            This page provides link references for documentation maintainers, community curators, and tutorial authors who want
            to cite String Ninja tools in articles, knowledge bases, and developer resource lists.
          </p>
        </header>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6">
          <h2 className="text-xl font-semibold">Recommended landing URLs</h2>
          <ul className="list-disc pl-5 mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300 space-y-1">
            <li>https://stringninja.in/tools</li>
            <li>https://stringninja.in/learn</li>
            <li>https://stringninja.in/tools/base64-encoder-decoder</li>
            <li>https://stringninja.in/tools/json-formatter-minifier</li>
            <li>https://stringninja.in/tools/jwt-decoder</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6">
          <h2 className="text-xl font-semibold">Citation snippet</h2>
          <pre className="mt-3 rounded-lg border p-3 bg-slate-50 dark:bg-slate-900 overflow-auto text-xs">{htmlSnippet}</pre>
          <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
            Please use direct links to relevant tool pages so readers land on the most useful context for their task.
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6">
          <h2 className="text-xl font-semibold">Search Console Operations</h2>
          <ol className="list-decimal pl-5 mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300 space-y-1">
            <li>Submit `https://stringninja.in/sitemap.xml` after each deploy.</li>
            <li>Request indexing for newly published `/tools/*` and `/learn/*` pages.</li>
            <li>Review coverage issues weekly and fix duplicate/non-indexed URLs quickly.</li>
            <li>Track CTR and average position by page and optimize title/description for low-CTR pages.</li>
            <li>Review Core Web Vitals and prioritize high-impression pages first.</li>
          </ol>
        </section>
      </article>
    </>
  )
}
