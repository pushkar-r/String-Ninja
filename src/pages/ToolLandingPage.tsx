import React from 'react'
import { Link, useParams } from 'react-router-dom'
import Head from '../components/Head'
import toolCatalog from '../data/toolCatalog.json'

type ToolItem = {
  slug: string
  name: string
  category: string
  appPath: string
  summary: string
}

const tools = toolCatalog as ToolItem[]

const categoryUseCases: Record<string, string[]> = {
  Encoding: [
    'Prepare text safely for transport across systems with strict character handling.',
    'Decode encoded payload fragments from logs and auth flows during debugging.',
    'Normalize binary-like representations for repeatable support and incident workflows.'
  ],
  Strings: [
    'Clean and normalize pasted content from spreadsheets, docs, and tickets.',
    'Transform text format for code, config, and migration scripts.',
    'Run deterministic text cleanup before analysis or import.'
  ],
  Compare: [
    'Inspect payload drift between working and failing requests.',
    'Review config changes with line or character precision.',
    'Audit content edits for accidental removals.'
  ],
  Security: [
    'Inspect auth tokens, certificates, and federation payloads quickly.',
    'Validate hashes and signatures during troubleshooting.',
    'Prototype secure format handling before implementing production code.'
  ],
  Data: [
    'Format and validate structured payloads before API testing.',
    'Convert between formats for interoperability checks.',
    'Normalize data representations for consistent downstream processing.'
  ],
  Misc: [
    'Handle recurring support tasks like timestamps and random identifiers.',
    'Generate strong utility outputs for development and testing.',
    'Prototype simple workflows without writing one-off scripts.'
  ]
}

const categoryMistakes: Record<string, string[]> = {
  Encoding: [
    'Assuming encoding provides encryption or integrity guarantees.',
    'Using the wrong variant (for example URL-safe vs standard alphabet).',
    'Double-encoding or decoding data in the wrong pipeline stage.'
  ],
  Strings: [
    'Running irreversible cleanup without saving original input.',
    'Applying broad replacements before inspecting match scope.',
    'Ignoring Unicode edge cases in multilingual data.'
  ],
  Compare: [
    'Using character mode for large multiline files when line mode is clearer.',
    'Reviewing only one side of a diff and missing dropped lines.',
    'Treating visual diff output as an automatic patch operation.'
  ],
  Security: [
    'Using decode output as trust evidence without verification.',
    'Reusing test keys or weak passwords in real environments.',
    'Skipping claim and validity checks after signature verification.'
  ],
  Data: [
    'Assuming XML and JSON conversions are perfectly lossless.',
    'Minifying before validating structure and required fields.',
    'Mixing incompatible schema expectations across systems.'
  ],
  Misc: [
    'Using generated demo outputs directly in production policy flows.',
    'Ignoring locale/timezone assumptions in date conversions.',
    'Saving sensitive samples in shared browser profiles.'
  ]
}

const categoryFaq: Record<string, { q: string; a: string }[]> = {
  Encoding: [
    { q: 'Does encoding secure my data?', a: 'No. Encoding changes representation, not confidentiality or authenticity.' },
    { q: 'When should I use URL-safe variants?', a: 'Use URL-safe variants when encoded values travel in URLs, JWT parts, or path/query components.' }
  ],
  Strings: [
    { q: 'Will these operations change meaning?', a: 'Some transformations can change semantics; validate output before publishing or importing.' },
    { q: 'Can I reverse every transform?', a: 'No. Cleanup and normalization steps are often lossy unless you keep original input.' }
  ],
  Compare: [
    { q: 'Which diff mode should I start with?', a: 'Start with line mode for larger text, then switch to words/chars for fine-grained changes.' },
    { q: 'Can I export a patch directly?', a: 'This view is for visual inspection; apply changes manually in your source workflow.' }
  ],
  Security: [
    { q: 'Is decode enough for JWT troubleshooting?', a: 'Decode helps visibility, but trust decisions require signature and claim validation.' },
    { q: 'Are these tools production crypto replacements?', a: 'No. Use audited libraries and controlled CI validation for production cryptography.' }
  ],
  Data: [
    { q: 'Should I format or minify first?', a: 'Format first for validation and review, then minify for transport or storage.' },
    { q: 'Will conversion preserve exact structure?', a: 'Not always. Format models differ; test critical edge cases before relying on round-trip output.' }
  ],
  Misc: [
    { q: 'Are random outputs cryptographically strong?', a: 'Many utilities use browser crypto APIs, but validate requirements for high-security contexts.' },
    { q: 'Can I rely on local storage saves?', a: 'Local storage is browser-local convenience, not a robust backup mechanism.' }
  ]
}

const categoryGuide: Record<string, { href: string; label: string }> = {
  Encoding: { href: '/learn/url-html-encoding-guide', label: 'Encoding Guide' },
  Strings: { href: '/learn/regex-text-guide', label: 'Regex and Text Guide' },
  Compare: { href: '/learn/compare-diff-guide', label: 'Diff Guide' },
  Security: { href: '/learn/jwt-security-guide', label: 'Security Guide' },
  Data: { href: '/learn/json-data-guide', label: 'Data Guide' },
  Misc: { href: '/learn/utility-workflows-guide', label: 'Workflow Guide' }
}

function getExample(tool: ToolItem): { input: string; output: string } {
  const bySlug: Record<string, { input: string; output: string }> = {
    'base64-encoder-decoder': { input: 'hello world', output: 'aGVsbG8gd29ybGQ=' },
    'url-encode-decode': { input: 'name=John & role=admin', output: 'name%3DJohn%20%26%20role%3Dadmin' },
    'json-formatter-minifier': { input: '{"a":1,"b":[2,3]}', output: '{\n  "a": 1,\n  "b": [\n    2,\n    3\n  ]\n}' },
    'text-diff-compare-tool': { input: 'old: status=active', output: 'new: status=inactive (highlighted diff)' },
    'hash-generator': { input: 'hello', output: 'SHA-256 -> 2cf24dba5fb0a30e... (hex)' },
    'timestamp-converter': { input: '1710000000', output: '2024-03-09T16:00:00.000Z (example)' }
  }
  return bySlug[tool.slug] || { input: 'Sample input text', output: 'Transformed output based on selected options' }
}

export default function ToolLandingPage() {
  const { slug } = useParams()
  const tool = tools.find((entry) => entry.slug === slug)

  if (!tool) {
    return (
      <article className="max-w-3xl mx-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6">
        <h1 className="text-2xl font-bold">Tool page not found</h1>
        <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">This tool landing page does not exist.</p>
        <Link to="/tools" className="inline-block mt-4 underline text-emerald-700 dark:text-emerald-400">Back to All Tools</Link>
      </article>
    )
  }

  const title = `${tool.name} - String Ninja`
  const description = `${tool.summary} Includes practical usage guidance, examples, mistakes to avoid, and direct access to the live tool.`
  const canonical = `https://stringninja.in/tools/${tool.slug}`
  const useCases = categoryUseCases[tool.category] || categoryUseCases.Misc
  const mistakes = categoryMistakes[tool.category] || categoryMistakes.Misc
  const faq = categoryFaq[tool.category] || categoryFaq.Misc
  const guide = categoryGuide[tool.category] || categoryGuide.Misc
  const example = getExample(tool)

  return (
    <>
      <Head title={title} description={description} canonical={canonical} />
      <article className="max-w-4xl mx-auto grid gap-6">
        <header className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{tool.category}</p>
          <h1 className="text-2xl md:text-3xl font-bold mt-1">{tool.name}</h1>
          <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">{tool.summary}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link to={tool.appPath} className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm">Open Tool</Link>
            <Link to="/tools" className="px-4 py-2 rounded-xl border text-sm">All Tools</Link>
            <Link to={guide.href} className="px-4 py-2 rounded-xl border text-sm">{guide.label}</Link>
          </div>
        </header>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6">
          <h2 className="text-xl font-semibold">When to use this tool</h2>
          <ul className="list-disc pl-5 mt-3 space-y-1 text-sm leading-6 text-slate-700 dark:text-slate-300">
            {useCases.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6">
          <h2 className="text-xl font-semibold">Quick example</h2>
          <div className="mt-3 grid gap-3 text-sm">
            <div>
              <div className="font-semibold">Input</div>
              <pre className="mt-1 rounded-lg border p-3 bg-slate-50 dark:bg-slate-900 overflow-auto">{example.input}</pre>
            </div>
            <div>
              <div className="font-semibold">Output</div>
              <pre className="mt-1 rounded-lg border p-3 bg-slate-50 dark:bg-slate-900 overflow-auto">{example.output}</pre>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6">
          <h2 className="text-xl font-semibold">Common mistakes to avoid</h2>
          <ul className="list-disc pl-5 mt-3 space-y-1 text-sm leading-6 text-slate-700 dark:text-slate-300">
            {mistakes.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6">
          <h2 className="text-xl font-semibold">FAQ</h2>
          <div className="mt-3 grid gap-3">
            {faq.map((item) => (
              <div key={item.q} className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                <h3 className="font-semibold text-sm">{item.q}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-700 dark:text-slate-300">{item.a}</p>
              </div>
            ))}
          </div>
        </section>
      </article>
    </>
  )
}
