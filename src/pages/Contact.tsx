import React from 'react'
import Head from '../components/Head'
import ToolCard from '../components/ToolCard'

export default function Contact() {
  const linkedIn = 'https://linkedin.com/in/pushkarr'
  return (
    <>
      <Head title="String Ninja — Contact" description="Contact the developer of String Ninja." />
      <ToolCard title="Contact" description="Reach out to the developer.">
        <div className="grid gap-3 text-sm">
          <div className="rounded-2xl border p-4 bg-white dark:bg-slate-950">
            <div className="font-semibold mb-1">Developer</div>
            {/* NOTE: We cannot programmatically scrape LinkedIn in the browser without CORS/API access. */}
            <p className="text-slate-700 dark:text-slate-300">
              Pushkar is a skilled software engineer with a strong focus on building secure, scalable systems. With expertise in Identity & Access Management (IAM), and security automation, he specializes in streamlining critical operations while ensuring robust data protection. He brings hands-on experience working with enterprise security teams, optimizing authentication workflows, and improving overall security posture.

              Pushkar also has experience in vulnerability assessments and security monitoring, ensuring both performance and protection are top priorities. On this website, he offers tools designed for client-side data formatting, all built with a strong emphasis on security, reliability, and ease of use.
            </p>
            <a href={linkedIn} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-2 text-emerald-700 dark:text-emerald-400 underline">
              View LinkedIn Profile
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </a>
          </div>
        </div>
      </ToolCard>
    </>
  )
}
