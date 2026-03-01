import React from 'react'
import Head from '../components/Head'

export default function Privacy() {
  return (
    <>
      <Head
        title="Privacy Policy — String Ninja"
        description="Read the String Ninja privacy policy, including how data is processed in-browser, what limited technical data may be collected, and your choices."
      />
      <article className="max-w-4xl mx-auto grid gap-6">
        <header className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6">
          <h1 className="text-2xl md:text-3xl font-bold">Privacy Policy</h1>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Last updated: March 2, 2026</p>
          <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
            This policy explains what information may be processed when you use String Ninja and how that information is handled.
            The project is designed with a privacy-first, client-side approach for the core tooling experience.
          </p>
        </header>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 grid gap-3">
          <h2 className="text-xl font-semibold">1. Core Tool Inputs</h2>
          <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">
            Most tool operations run locally in your browser. Text or files you enter into tool interfaces are generally processed client-side.
            That means your working content is transformed on your device for common use cases.
          </p>
          <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">
            You are responsible for deciding what data you paste or upload. Avoid using sensitive production secrets in any browser tool
            unless your internal policy allows it.
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 grid gap-3">
          <h2 className="text-xl font-semibold">2. Local Browser Storage</h2>
          <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">
            Some convenience settings may be stored in browser local storage, such as interface preferences.
            Local storage remains in your browser until you clear it or the site removes the stored entries.
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 grid gap-3">
          <h2 className="text-xl font-semibold">3. Analytics, Security Logs, and Operational Data</h2>
          <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">
            Hosting providers and infrastructure platforms may collect basic technical request metadata (for example IP address,
            user-agent, timestamps, and error diagnostics) for security, reliability, abuse prevention, and performance monitoring.
          </p>
          <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">
            This operational data is used to maintain service quality and protect against misuse. It is not intended to profile your
            tool input content.
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 grid gap-3">
          <h2 className="text-xl font-semibold">4. Advertising</h2>
          <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">
            String Ninja may display ads provided by third-party ad networks, including Google AdSense.
            Ad providers may use cookies or similar technologies subject to their own privacy policies and applicable law.
          </p>
          <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">
            You can review Google advertising and privacy information at:
            {' '}
            <a
              href="https://policies.google.com/technologies/ads"
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-emerald-700 dark:text-emerald-400"
            >
              policies.google.com/technologies/ads
            </a>
            .
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 grid gap-3">
          <h2 className="text-xl font-semibold">5. Data Retention and Your Choices</h2>
          <ul className="list-disc pl-5 text-sm leading-6 text-slate-700 dark:text-slate-300 space-y-1">
            <li>Clear browser local storage/cookies at any time through browser settings.</li>
            <li>Do not upload or paste confidential secrets unless permitted by your organization policy.</li>
            <li>Use private browsing modes if you want reduced local persistence.</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 grid gap-3">
          <h2 className="text-xl font-semibold">6. Contact</h2>
          <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">
            For privacy-related questions, use the contact page:
            {' '}
            <a href="/contact" className="underline text-emerald-700 dark:text-emerald-400">/contact</a>.
          </p>
        </section>
      </article>
    </>
  )
}
