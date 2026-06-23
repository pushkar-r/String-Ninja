import React from 'react'
import Head from '../components/Head'

export default function Privacy() {
  return (
    <>
      <Head
        title="Privacy Policy — String Ninja"
        description="Read the String Ninja privacy policy: how data is processed client-side, what cookies are used, Google AdSense data practices, and your rights."
        canonical="https://stringninja.in/privacy/"
      />
      <article className="max-w-4xl mx-auto grid gap-6">
        <header className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <h1 className="text-2xl md:text-3xl font-bold">Privacy Policy</h1>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Last updated: June 23, 2026</p>
          <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
            String Ninja ("we", "us", or "our") operates the website stringninja.in. This Privacy Policy explains what information is
            collected when you use String Ninja, how it is used, and your rights regarding that information.
          </p>
        </header>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 grid gap-3">
          <h2 className="text-xl font-semibold">1. Information We Collect</h2>
          <h3 className="font-semibold text-sm">a) Tool Inputs (processed locally)</h3>
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
            All tool operations on String Ninja — encoding, decoding, hashing, encryption, text transformation, etc. — run entirely
            in your browser. Input data you type or paste is never transmitted to our servers. We do not store, log, or have access
            to any content you process using our tools.
          </p>
          <h3 className="font-semibold text-sm">b) Browser Storage</h3>
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
            We use <strong>localStorage</strong> in your browser to save preferences such as your selected color theme (light/dark).
            This data never leaves your device and is not accessible by us.
          </p>
          <h3 className="font-semibold text-sm">c) Log Data (hosting infrastructure)</h3>
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
            Our hosting provider (GitHub Pages) may automatically collect standard server log data including your IP address,
            browser type, referring URL, pages visited, and timestamps. This is used solely for security and reliability purposes.
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 grid gap-3">
          <h2 className="text-xl font-semibold">2. Cookies and Tracking Technologies</h2>
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
            String Ninja itself does not set tracking cookies. However, we use third-party services that may use cookies:
          </p>
          <h3 className="font-semibold text-sm">Google AdSense</h3>
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
            We use Google AdSense to display advertisements. Google AdSense may use cookies, web beacons, and similar technologies
            to serve ads based on your prior visits to this website or other websites. Google's use of advertising cookies enables it
            and its partners to serve ads to users based on their visit to String Ninja and/or other sites on the Internet.
          </p>
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
            You may opt out of personalized advertising by visiting{' '}
            <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer"
              className="underline text-emerald-700 dark:text-emerald-400">Google Ads Settings</a>.
            You can also opt out of a third-party vendor's use of cookies by visiting the{' '}
            <a href="https://www.networkadvertising.org/managing/opt_out.asp" target="_blank" rel="noopener noreferrer"
              className="underline text-emerald-700 dark:text-emerald-400">Network Advertising Initiative opt-out page</a>.
          </p>
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
            For more information on how Google uses data when you use our site, visit:{' '}
            <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer"
              className="underline text-emerald-700 dark:text-emerald-400">How Google uses data from sites that use Google services</a>.
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 grid gap-3">
          <h2 className="text-xl font-semibold">3. How We Use Information</h2>
          <ul className="list-disc pl-5 text-sm leading-6 text-slate-600 dark:text-slate-300 space-y-1">
            <li>To operate and maintain the website</li>
            <li>To serve relevant advertisements via Google AdSense</li>
            <li>To monitor and improve website performance and security</li>
            <li>To respond to your inquiries submitted via the contact form</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 grid gap-3">
          <h2 className="text-xl font-semibold">4. Third-Party Links</h2>
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
            Our website may contain links to third-party websites (such as guides referencing external documentation).
            We are not responsible for the privacy practices or content of those sites. We encourage you to review the
            privacy policy of any third-party site you visit.
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 grid gap-3">
          <h2 className="text-xl font-semibold">5. Children's Privacy</h2>
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
            String Ninja is not directed at children under 13 years of age. We do not knowingly collect personal information
            from children under 13. If you believe a child has provided us with personal information, please contact us so we
            can delete it.
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 grid gap-3">
          <h2 className="text-xl font-semibold">6. Your Rights and Choices</h2>
          <ul className="list-disc pl-5 text-sm leading-6 text-slate-600 dark:text-slate-300 space-y-1">
            <li>You can clear browser localStorage and cookies at any time through your browser settings.</li>
            <li>You can opt out of personalized ads via <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="underline text-emerald-700 dark:text-emerald-400">Google Ads Settings</a>.</li>
            <li>You can use private/incognito browsing to reduce local data persistence.</li>
            <li>EU/EEA users may have additional rights under GDPR, including the right to access, correct, or delete personal data. Contact us to exercise these rights.</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 grid gap-3">
          <h2 className="text-xl font-semibold">7. Changes to This Policy</h2>
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
            We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated "Last updated"
            date. We encourage you to review this policy periodically. Continued use of String Ninja after changes constitutes
            acceptance of the updated policy.
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 grid gap-3">
          <h2 className="text-xl font-semibold">8. Contact Us</h2>
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
            If you have questions or concerns about this Privacy Policy, please contact us via our{' '}
            <a href="/contact/" className="underline text-emerald-700 dark:text-emerald-400">contact page</a>.
          </p>
        </section>
      </article>
    </>
  )
}
