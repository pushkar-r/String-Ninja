import React from 'react'
import Head from '../components/Head'

export default function Base64Guide() {
  return (
    <>
      <Head
        title="Base64 Guide — String Ninja"
        description="Learn how Base64 encoding works, why padding exists, where Base64 appears in APIs, and how to avoid common implementation mistakes."
      />
      <article className="max-w-4xl mx-auto grid gap-6">
        <header className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6">
          <h1 className="text-2xl md:text-3xl font-bold">Base64 in Real Systems: Encoding, Pitfalls, and Safe Usage</h1>
          <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
            Base64 is one of the most common transformations in modern software, but it is also one of the most frequently misunderstood.
            Teams often treat Base64 as if it were encryption, or they debug failed decodes without a clear model for URL-safe variants,
            padding behavior, and character set handling. This guide focuses on practical understanding and production-safe usage patterns.
          </p>
        </header>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 grid gap-4">
          <h2 className="text-xl font-semibold">What Base64 Actually Is</h2>
          <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">
            Base64 is a binary-to-text encoding scheme. It maps arbitrary bytes into an alphabet of 64 characters so binary data can travel
            through text-oriented systems. It does not provide confidentiality, integrity, or authenticity. If an attacker can read the Base64,
            they can decode it instantly.
          </p>
          <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">
            The standard alphabet uses uppercase letters, lowercase letters, digits, plus (+), and slash (/). Output is typically grouped in
            4-character blocks. When the source byte length does not divide evenly into 3-byte groups, padding with equals signs (=) is used.
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 grid gap-4">
          <h2 className="text-xl font-semibold">Where You See It in Practice</h2>
          <ul className="list-disc pl-5 text-sm leading-6 text-slate-700 dark:text-slate-300 space-y-2">
            <li>HTTP Basic auth credentials (username:password encoded as Base64).</li>
            <li>JWT segments, commonly Base64URL rather than standard Base64.</li>
            <li>Embedded binary blobs in JSON payloads and message queues.</li>
            <li>Email/MIME transport where binary attachments must pass through text channels.</li>
            <li>Certificates, keys, and signatures wrapped in textual formats.</li>
          </ul>
          <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">
            Because it is so widely reused, interoperability bugs often come from variant mismatches rather than algorithmic complexity.
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 grid gap-4">
          <h2 className="text-xl font-semibold">Standard Base64 vs Base64URL</h2>
          <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">
            Base64URL modifies two characters to remain URL-safe: plus (+) becomes dash (-), and slash (/) becomes underscore (_).
            Many systems also omit trailing padding. A robust decoder should normalize these variants before decoding.
          </p>
          <ul className="list-disc pl-5 text-sm leading-6 text-slate-700 dark:text-slate-300 space-y-2">
            <li>Normalize - to + and _ to / for standard decoder compatibility.</li>
            <li>Restore missing padding if required by your runtime decoder.</li>
            <li>Reject malformed characters early and report precise errors.</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 grid gap-4">
          <h2 className="text-xl font-semibold">Common Mistakes</h2>
          <ul className="list-disc pl-5 text-sm leading-6 text-slate-700 dark:text-slate-300 space-y-2">
            <li>Assuming Base64 is encryption and sending secrets without encryption at rest/in transit.</li>
            <li>Mixing UTF-8 text expectations with arbitrary byte data without explicit encoding conversion.</li>
            <li>Failing to handle whitespace/newlines in copied payloads.</li>
            <li>Treating decoding success as proof of authenticity. Signed or MACed validation is separate.</li>
            <li>Using inconsistent padding rules across microservices and SDKs.</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 grid gap-4">
          <h2 className="text-xl font-semibold">Operational Checklist</h2>
          <ol className="list-decimal pl-5 text-sm leading-6 text-slate-700 dark:text-slate-300 space-y-2">
            <li>Define whether your API accepts standard Base64, Base64URL, or both.</li>
            <li>Document padding requirements and whitespace handling.</li>
            <li>Validate input charset and size before decoding to protect resources.</li>
            <li>Treat decoded content as untrusted input and validate schema.</li>
            <li>If authenticity matters, verify digital signatures or MACs after decoding.</li>
          </ol>
          <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">
            Strong tooling helps with speed, but secure outcomes come from explicit contracts and consistent validation at boundaries.
          </p>
        </section>
      </article>
    </>
  )
}
