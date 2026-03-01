import React from 'react'
import Head from '../components/Head'

export default function Terms() {
  return (
    <>
      <Head
        title="Terms of Use — String Ninja"
        description="Read the String Ninja terms of use, including acceptable use, service limitations, and user responsibilities."
      />
      <article className="max-w-4xl mx-auto grid gap-6">
        <header className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6">
          <h1 className="text-2xl md:text-3xl font-bold">Terms of Use</h1>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Last updated: March 2, 2026</p>
          <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
            By accessing or using String Ninja, you agree to these terms. If you do not agree, do not use the service.
          </p>
        </header>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 grid gap-3">
          <h2 className="text-xl font-semibold">1. Service Scope</h2>
          <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">
            String Ninja provides browser-based utility tools for text, encoding, cryptographic helpers, and data formatting.
            The tools are provided for general informational and productivity purposes.
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 grid gap-3">
          <h2 className="text-xl font-semibold">2. No Professional Advice</h2>
          <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">
            Content and tool outputs are not legal, security, or compliance advice. You are responsible for independent verification,
            especially for high-impact decisions involving production systems, regulated data, or customer-facing changes.
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 grid gap-3">
          <h2 className="text-xl font-semibold">3. Acceptable Use</h2>
          <ul className="list-disc pl-5 text-sm leading-6 text-slate-700 dark:text-slate-300 space-y-1">
            <li>Do not use the service in violation of applicable law.</li>
            <li>Do not attempt to disrupt, abuse, or overload infrastructure.</li>
            <li>Do not use the site for harmful, malicious, or deceptive activities.</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 grid gap-3">
          <h2 className="text-xl font-semibold">4. Availability and Changes</h2>
          <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">
            Features may be changed, improved, or removed at any time. Service availability is not guaranteed and may be interrupted
            due to maintenance, hosting issues, or external dependency outages.
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 grid gap-3">
          <h2 className="text-xl font-semibold">5. Disclaimer of Warranties</h2>
          <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">
            The service is provided on an "as is" and "as available" basis without warranties of any kind, express or implied,
            including but not limited to merchantability, fitness for a particular purpose, or non-infringement.
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 grid gap-3">
          <h2 className="text-xl font-semibold">6. Limitation of Liability</h2>
          <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">
            To the maximum extent permitted by law, String Ninja and its operator are not liable for indirect, incidental, special,
            consequential, or punitive damages, or any loss of data, profit, or business opportunity arising from use of the service.
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 grid gap-3">
          <h2 className="text-xl font-semibold">7. Contact</h2>
          <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">
            Questions about these terms can be raised through:
            {' '}
            <a href="/contact" className="underline text-emerald-700 dark:text-emerald-400">/contact</a>.
          </p>
        </section>
      </article>
    </>
  )
}
