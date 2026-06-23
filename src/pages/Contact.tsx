import React, { useState } from 'react'
import Head from '../components/Head'

export default function Contact() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)

  // Uses Formspree — replace action URL with your own Formspree endpoint
  const FORM_ACTION = 'https://formspree.io/f/xpwzgvze'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const res = await fetch(FORM_ACTION, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ name, email, message }),
      })
      if (res.ok) setSent(true)
    } catch {}
  }

  return (
    <>
      <Head
        title="Contact — String Ninja"
        description="Get in touch with the String Ninja team. Send us a message for feedback, bug reports, feature requests, or partnership inquiries."
        canonical="https://stringninja.in/contact/"
      />
      <article className="max-w-4xl mx-auto grid gap-6">
        <header className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <h1 className="text-2xl md:text-3xl font-bold">Contact Us</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Have a question, found a bug, or want to suggest a new tool? We'd love to hear from you.
          </p>
        </header>

        <div className="grid md:grid-cols-[1fr_320px] gap-6">
          {/* Contact form */}
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
            <h2 className="text-lg font-semibold mb-4">Send a Message</h2>
            {sent ? (
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-5 text-center">
                <div className="text-2xl mb-2">✓</div>
                <p className="font-semibold text-emerald-700 dark:text-emerald-300">Message sent!</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Thanks for reaching out. We'll get back to you soon.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="grid gap-4">
                <div>
                  <label htmlFor="contact-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Your Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Jane Smith"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400"
                  />
                </div>
                <div>
                  <label htmlFor="contact-email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="jane@example.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400"
                  />
                </div>
                <div>
                  <label htmlFor="contact-message" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="contact-message"
                    required
                    rows={5}
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Describe your question, bug report, or feature request…"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm transition-colors"
                >
                  Send Message
                </button>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  We typically respond within 1–2 business days.
                </p>
              </form>
            )}
          </section>

          {/* Sidebar info */}
          <div className="grid gap-4 content-start">
            <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-3">About the Author</h2>
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0 text-lg font-bold text-emerald-700 dark:text-emerald-300">
                  PR
                </div>
                <div>
                  <p className="font-semibold text-sm text-slate-900 dark:text-white">Pushkar Raj</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Software Engineer · IAM & Security</p>
                  <a
                    href="https://linkedin.com/in/pushkarr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-2 text-xs text-emerald-700 dark:text-emerald-400 hover:underline"
                  >
                    LinkedIn Profile →
                  </a>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-3">Common Topics</h2>
              <ul className="grid gap-2 text-sm text-slate-700 dark:text-slate-300">
                <li className="flex items-start gap-2"><span className="text-emerald-500 mt-0.5">→</span>Bug reports or broken tools</li>
                <li className="flex items-start gap-2"><span className="text-emerald-500 mt-0.5">→</span>Feature or tool requests</li>
                <li className="flex items-start gap-2"><span className="text-emerald-500 mt-0.5">→</span>Content corrections or guide feedback</li>
                <li className="flex items-start gap-2"><span className="text-emerald-500 mt-0.5">→</span>Partnership or link inquiries</li>
              </ul>
            </section>

            <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">Response Time</h2>
              <p className="text-sm text-slate-700 dark:text-slate-300">We aim to respond to all messages within <strong>1–2 business days</strong>.</p>
            </section>
          </div>
        </div>
      </article>
    </>
  )
}
