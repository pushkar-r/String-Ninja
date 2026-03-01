import React from 'react'
import Head from '../components/Head'

export default function CertSamlGuide() {
  return (
    <>
      <Head
        title="X.509 and SAML Troubleshooting Guide — String Ninja"
        description="Practical guide to decoding certificates and SAML payloads, understanding bindings, and avoiding common federation debugging mistakes."
      />
      <article className="max-w-4xl mx-auto grid gap-6">
        <header className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6">
          <h1 className="text-2xl md:text-3xl font-bold">X.509 and SAML Troubleshooting Guide</h1>
          <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
            Certificate and SAML debugging can be difficult because encoding layers hide the actual payload. A clear decode-first process
            helps isolate trust, expiry, and binding issues quickly.
          </p>
        </header>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 grid gap-3">
          <h2 className="text-xl font-semibold">Certificate Checks That Matter</h2>
          <ul className="list-disc pl-5 text-sm leading-6 text-slate-700 dark:text-slate-300 space-y-1">
            <li>Validity window: check NotBefore and NotAfter timestamps.</li>
            <li>Issuer and subject chain consistency across environments.</li>
            <li>SAN coverage for exact hostnames and wildcard expectations.</li>
            <li>Key usage and extended key usage for intended purpose.</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 grid gap-3">
          <h2 className="text-xl font-semibold">SAML Decode Workflow</h2>
          <ol className="list-decimal pl-5 text-sm leading-6 text-slate-700 dark:text-slate-300 space-y-1">
            <li>Identify binding: POST or Redirect.</li>
            <li>Decode Base64 and decompress Redirect payload if required.</li>
            <li>Inspect XML elements: Issuer, Audience, Destination, NameID, Conditions.</li>
            <li>Validate signature and certificate trust against expected IdP metadata.</li>
          </ol>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 grid gap-3">
          <h2 className="text-xl font-semibold">Common Federation Mistakes</h2>
          <ul className="list-disc pl-5 text-sm leading-6 text-slate-700 dark:text-slate-300 space-y-1">
            <li>Clock skew causing token condition failures.</li>
            <li>Using wrong environment metadata and old signing certs.</li>
            <li>Destination or ACS URL mismatch between SP and IdP config.</li>
            <li>Debugging decoded claims without verifying signature trust.</li>
          </ul>
        </section>
      </article>
    </>
  )
}
