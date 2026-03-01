import fs from 'node:fs/promises'
import path from 'node:path'

const siteUrl = 'https://stringninja.in'
const ogImage = `${siteUrl}/logo1-nobg.png`
const distDir = path.resolve('dist')
const indexPath = path.join(distDir, 'index.html')
const toolCatalogPath = path.resolve('src/data/toolCatalog.json')

const today = new Date().toISOString().slice(0, 10)

const staticRoutes = [
  {
    route: '/strings',
    title: 'String Ninja - String Utilities: Transform, Regex, Wrap',
    description: 'String tools for cleanup, case conversion, delimiter operations, regex find/replace, line handling, wrap, and frequency analysis.',
    heading: 'String Tools',
    intro: 'Use practical string transformations for cleanup, normalization, and structured output generation in day-to-day engineering workflows.',
    links: [
      ['/strings', 'Open String Tools'],
      ['/learn/regex-text-guide', 'Read Regex and Text Processing Guide'],
      ['/tools', 'Browse All Tool Pages']
    ],
    type: 'webpage'
  },
  {
    route: '/compare',
    title: 'String Ninja - Compare Two Texts: Diff Tool Online',
    description: 'Compare text by words, characters, or lines with inline and side-by-side diffs for fast review and debugging.',
    heading: 'Compare Tools',
    intro: 'Visual diff tools help inspect payload changes, config drift, and text edits with suitable granularity.',
    links: [
      ['/compare', 'Open Compare Tool'],
      ['/learn/compare-diff-guide', 'Read Text Diff and Comparison Guide'],
      ['/tools/text-diff-compare-tool', 'Tool SEO Page']
    ],
    type: 'webpage'
  },
  {
    route: '/security',
    title: 'String Ninja - Security Tools: Hash, AES, JWT, RSA, X.509, SAML',
    description: 'Security tooling for hash checks, JWT decode/verify, AES helpers, key generation, certificate inspection, and SAML decoding.',
    heading: 'Security Tools',
    intro: 'Inspect and troubleshoot common security formats and cryptographic helpers directly in the browser.',
    links: [
      ['/security', 'Open Security Tools'],
      ['/learn/jwt-security-guide', 'Read JWT Security Guide'],
      ['/learn/hashing-password-guide', 'Read Hashing and Password Security Guide'],
      ['/tools', 'Browse All Tool Pages']
    ],
    type: 'webpage'
  },
  {
    route: '/data',
    title: 'String Ninja - Data Tools: JSON, QR, Formatters, XML-JSON',
    description: 'Data tools for JSON formatting, QR generation/scan, code beautify/minify, XML-JSON conversion, and Unicode normalization.',
    heading: 'Data Tools',
    intro: 'Format, validate, and convert structured data to reduce debugging time and improve interoperability.',
    links: [
      ['/data', 'Open Data Tools'],
      ['/learn/json-data-guide', 'Read JSON and Data Formatting Guide'],
      ['/tools', 'Browse All Tool Pages']
    ],
    type: 'webpage'
  },
  {
    route: '/misc',
    title: 'String Ninja - Misc Tools: Timestamp, Password, Random, Regex',
    description: 'Utility tools for timestamp conversion, password generation, random values, regex testing, and steganography demos.',
    heading: 'Misc Tools',
    intro: 'Run frequent utility tasks quickly, from date conversion to randomness checks and lightweight text experimentation.',
    links: [
      ['/misc', 'Open Misc Tools'],
      ['/learn/utility-workflows-guide', 'Read Developer Utility Workflows Guide'],
      ['/tools', 'Browse All Tool Pages']
    ],
    type: 'webpage'
  },
  {
    route: '/learn',
    title: 'Learn - String Ninja Guides',
    description: 'In-depth guides for encoding, security, data formatting, regex workflows, and practical troubleshooting.',
    heading: 'Learn',
    intro: 'Browse long-form guides that explain concepts, checklists, and common pitfalls for developer workflows.',
    links: [
      ['/learn/base64-guide', 'Base64 in Real Systems Guide'],
      ['/learn/jwt-security-guide', 'JWT Security Guide'],
      ['/learn/json-data-guide', 'JSON and Data Formatting Guide'],
      ['/tools', 'Browse All Tool Pages']
    ],
    type: 'webpage'
  },
  {
    route: '/tools',
    title: 'All Developer Tools - String Ninja',
    description: 'Browse all String Ninja features with dedicated tool pages, examples, mistakes to avoid, and direct links to each utility.',
    heading: 'All Tools',
    intro: 'Dedicated indexable pages for every feature improve discoverability and help users land directly on the right workflow.',
    links: [
      ['/tools/base64-encoder-decoder', 'Base64 Encoder/Decoder'],
      ['/tools/json-formatter-minifier', 'JSON Formatter/Minifier'],
      ['/tools/jwt-decoder', 'JWT Decoder'],
      ['/learn', 'Learn Hub']
    ],
    type: 'webpage'
  },
  {
    route: '/resources',
    title: 'Link and Press Resources - String Ninja',
    description: 'Reference links and citation resources for communities and docs that want to link to String Ninja tools.',
    heading: 'Link and Press Resources',
    intro: 'Use these canonical links when citing String Ninja resources in tutorials, docs, and tool directories.',
    links: [
      ['/resources', 'Open Resources'],
      ['/tools', 'All Tools Hub'],
      ['/learn', 'Learn Hub']
    ],
    type: 'webpage'
  },
  {
    route: '/about',
    title: 'About String Ninja - Mission, Trust, and How It Works',
    description: 'Learn what String Ninja is, who it is for, and the privacy-first principles behind its browser-based tools.',
    heading: 'About String Ninja',
    intro: 'String Ninja focuses on practical client-side tools that reduce engineering friction with clear workflows.',
    links: [['/about', 'Read About'], ['/privacy', 'Read Privacy Policy'], ['/terms', 'Read Terms of Use'], ['/contact', 'Contact']],
    type: 'webpage'
  },
  {
    route: '/privacy',
    title: 'Privacy Policy - String Ninja',
    description: 'Privacy policy explaining local processing, operational data handling, and advertising context.',
    heading: 'Privacy Policy',
    intro: 'Review how String Ninja handles browser-side processing, storage, and operational telemetry constraints.',
    links: [['/privacy', 'Read Privacy Policy'], ['/terms', 'Read Terms'], ['/contact', 'Contact']],
    type: 'webpage'
  },
  {
    route: '/terms',
    title: 'Terms of Use - String Ninja',
    description: 'Terms of use for accessing String Ninja tools, including scope, limitations, and responsibilities.',
    heading: 'Terms of Use',
    intro: 'Read the terms defining acceptable use, disclaimers, and service limitations for String Ninja.',
    links: [['/terms', 'Read Terms'], ['/privacy', 'Read Privacy Policy'], ['/contact', 'Contact']],
    type: 'webpage'
  },
  {
    route: '/contact',
    title: 'Contact String Ninja',
    description: 'Contact the String Ninja developer for collaboration, feedback, or support inquiries.',
    heading: 'Contact',
    intro: 'Reach out for collaboration and support related to String Ninja tooling and educational content.',
    links: [['/contact', 'Contact Page'], ['/about', 'About String Ninja']],
    type: 'webpage'
  },
  {
    route: '/learn/base64-guide',
    title: 'Base64 Guide - String Ninja',
    description: 'Learn how Base64 encoding works, where it appears in real systems, and how to avoid common decoding mistakes.',
    heading: 'Base64 in Real Systems Guide',
    intro: 'A practical guide to Base64 variants, padding behavior, and safe implementation patterns.',
    links: [['/learn/base64-guide', 'Base64 Guide'], ['/learn', 'Learn Hub'], ['/tools/base64-encoder-decoder', 'Base64 Tool Page']],
    type: 'article'
  },
  {
    route: '/learn/jwt-security-guide',
    title: 'JWT Security Guide - String Ninja',
    description: 'Decode and validate JWTs safely with practical guidance on signatures, claims checks, and key management.',
    heading: 'JWT Security Guide',
    intro: 'Understand decode-vs-verify boundaries, claim validation, and key trust controls for production token workflows.',
    links: [['/learn/jwt-security-guide', 'JWT Guide'], ['/learn', 'Learn Hub'], ['/tools/jwt-decoder', 'JWT Decoder Tool Page']],
    type: 'article'
  },
  {
    route: '/learn/url-html-encoding-guide',
    title: 'URL and HTML Encoding Guide - String Ninja',
    description: 'Use URL percent-encoding and HTML entity encoding correctly to avoid parser bugs and unsafe rendering patterns.',
    heading: 'URL and HTML Encoding Guide',
    intro: 'Learn where each encoding applies and how to avoid double-encoding and context mismatch failures.',
    links: [['/learn/url-html-encoding-guide', 'URL/HTML Encoding Guide'], ['/learn', 'Learn Hub'], ['/tools/url-encode-decode', 'URL Tool Page']],
    type: 'article'
  },
  {
    route: '/learn/json-data-guide',
    title: 'JSON and Data Formatting Guide - String Ninja',
    description: 'Best practices for JSON formatting, minification, validation order, and XML-JSON conversion caveats.',
    heading: 'JSON and Data Formatting Guide',
    intro: 'Use structured data tooling for reliable debugging with clear parse, validate, and transformation steps.',
    links: [['/learn/json-data-guide', 'JSON/Data Guide'], ['/learn', 'Learn Hub'], ['/tools/json-formatter-minifier', 'JSON Tool Page']],
    type: 'article'
  },
  {
    route: '/learn/regex-text-guide',
    title: 'Regex and Text Processing Guide - String Ninja',
    description: 'Practical regex strategy and text transformation workflows to reduce replacement errors and cleanup risk.',
    heading: 'Regex and Text Processing Guide',
    intro: 'Apply regex and text tools safely with staged matching, verification, and reversible transformations.',
    links: [['/learn/regex-text-guide', 'Regex/Text Guide'], ['/learn', 'Learn Hub'], ['/tools/regex-find-replace', 'Regex Tool Page']],
    type: 'article'
  },
  {
    route: '/learn/hashing-password-guide',
    title: 'Hashing and Password Security Guide - String Ninja',
    description: 'Understand integrity hashing versus password hashing and choose bcrypt or Argon2 with safer defaults.',
    heading: 'Hashing and Password Security Guide',
    intro: 'Separate file integrity checks from credential storage strategy to avoid critical auth weaknesses.',
    links: [['/learn/hashing-password-guide', 'Hashing Guide'], ['/learn', 'Learn Hub'], ['/tools/hash-generator', 'Hash Tool Page']],
    type: 'article'
  },
  {
    route: '/learn/cert-saml-guide',
    title: 'X.509 and SAML Troubleshooting Guide - String Ninja',
    description: 'Decode certificates and SAML payloads with a practical checklist for trust, expiry, and binding diagnostics.',
    heading: 'X.509 and SAML Troubleshooting Guide',
    intro: 'Use decode-first investigation methods to isolate federation and certificate issues quickly.',
    links: [['/learn/cert-saml-guide', 'X.509/SAML Guide'], ['/learn', 'Learn Hub'], ['/tools/x509-certificate-decoder', 'X.509 Tool Page']],
    type: 'article'
  },
  {
    route: '/learn/compare-diff-guide',
    title: 'Text Diff and Comparison Guide - String Ninja',
    description: 'Choose the right diff mode and view style for config reviews, payload debugging, and content comparison.',
    heading: 'Text Diff and Comparison Guide',
    intro: 'Match comparison granularity to the task so you can detect meaningful changes faster.',
    links: [['/learn/compare-diff-guide', 'Diff Guide'], ['/learn', 'Learn Hub'], ['/tools/text-diff-compare-tool', 'Diff Tool Page']],
    type: 'article'
  },
  {
    route: '/learn/utility-workflows-guide',
    title: 'Developer Utility Workflows Guide - String Ninja',
    description: 'End-to-end workflows combining encoding, string, data, and security tools for efficient troubleshooting.',
    heading: 'Developer Utility Workflows Guide',
    intro: 'Combine utility tools into repeatable triage workflows for incidents, migrations, and integration debugging.',
    links: [['/learn/utility-workflows-guide', 'Workflow Guide'], ['/learn', 'Learn Hub'], ['/tools', 'All Tool Pages']],
    type: 'article'
  }
]

const categoryFaq = {
  Encoding: [
    ['Does encoding secure my data?', 'No. Encoding changes representation, not confidentiality or authenticity.'],
    ['When should URL-safe variants be used?', 'Use URL-safe variants when encoded values travel in URLs or token segments.']
  ],
  Strings: [
    ['Are transformations always reversible?', 'No. Cleanup and normalization can be lossy unless original input is preserved.'],
    ['Should I run regex replacements directly on production data?', 'Prefer staged validation and backups before irreversible replacements.']
  ],
  Compare: [
    ['Which diff mode is best first?', 'Start with line mode, then switch to words/chars for finer detail.'],
    ['Does this generate a patch file?', 'No. It is a visual comparison helper, not a patch generator.']
  ],
  Security: [
    ['Is decode output trusted evidence?', 'No. Trust decisions require verification, claims validation, and key trust.'],
    ['Can this replace production crypto libraries?', 'No. Use audited libraries and CI controls for production implementations.']
  ],
  Data: [
    ['Is XML to JSON always lossless?', 'Not always. Structural models differ and round-trip can lose context.'],
    ['Should data be minified before validation?', 'No. Validate first, then minify for transport.']
  ],
  Misc: [
    ['Are local storage saves permanent backup?', 'No. Local storage is convenience data and can be cleared by browser policy.'],
    ['Can generated values be used in all security contexts?', 'Validate entropy, policy, and compliance requirements before use.']
  ]
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function withAbsoluteUrl(route) {
  return route === '/' ? siteUrl : `${siteUrl}${route}`
}

function applyHeadMetadata(html, meta) {
  const routeUrl = withAbsoluteUrl(meta.route)
  let next = html
  next = next.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(meta.title)}</title>`)
  next = next.replace(/<meta name="description" content="[\s\S]*?"\/>/, `<meta name="description" content="${escapeHtml(meta.description)}"/>`)
  next = next.replace(/<meta property="og:title" content="[\s\S]*?" \/>/, `<meta property="og:title" content="${escapeHtml(meta.title)}" />`)
  next = next.replace(/<meta property="og:description" content="[\s\S]*?" \/>/, `<meta property="og:description" content="${escapeHtml(meta.description)}" />`)
  next = next.replace(/<meta property="og:url" content="[\s\S]*?" \/>/, `<meta property="og:url" content="${routeUrl}" />`)
  next = next.replace(/<meta name="twitter:title" content="[\s\S]*?" \/>/, `<meta name="twitter:title" content="${escapeHtml(meta.title)}" />`)
  next = next.replace(/<meta name="twitter:description" content="[\s\S]*?" \/>/, `<meta name="twitter:description" content="${escapeHtml(meta.description)}" />`)
  next = next.replace(/<link rel="canonical" href="[\s\S]*?" \/>/, `<link rel="canonical" href="${routeUrl}" />`)
  next = next.replace(/<meta property="og:image" content="[\s\S]*?" \/>/, `<meta property="og:image" content="${ogImage}" />`)
  next = next.replace(/<meta name="twitter:image" content="[\s\S]*?" \/>/, `<meta name="twitter:image" content="${ogImage}" />`)
  return next
}

function buildFallbackMain(meta) {
  const links = meta.links.map(([href, label]) => `<li><a href="${href}">${escapeHtml(label)}</a></li>`).join('')
  const extra = meta.type === 'tool'
    ? `<h2>Quick Example</h2><p>Input: Sample input text</p><p>Output: Transformed output based on selected options.</p><h2>Common mistakes</h2><ul><li>Avoid irreversible transformations without preserving originals.</li><li>Validate outputs before production use.</li><li>Use the right mode/format for your target system.</li></ul>`
    : ''
  return `<main style="max-width: 960px; margin: 0 auto; padding: 24px; font-family: Arial, sans-serif; line-height: 1.6;"><h1>${escapeHtml(meta.heading)}</h1><p>${escapeHtml(meta.intro)}</p><h2>Quick Links</h2><ul>${links}</ul>${extra}<p>String Ninja tools run in the browser for practical text, security, and data workflows. For critical production decisions, validate outcomes in controlled pipelines.</p></main>`
}

function buildSchema(meta) {
  const routeUrl = withAbsoluteUrl(meta.route)
  const schemas = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: meta.title,
      description: meta.description,
      url: routeUrl,
      isPartOf: { '@type': 'WebSite', name: 'String Ninja', url: siteUrl }
    }
  ]

  if (meta.type === 'article') {
    schemas.push(
      {
        '@context': 'https://schema.org',
        '@type': 'TechArticle',
        headline: meta.heading,
        description: meta.description,
        author: { '@type': 'Person', name: 'Pushkar Raj' },
        publisher: { '@type': 'Organization', name: 'String Ninja', url: siteUrl },
        datePublished: today,
        dateModified: today,
        mainEntityOfPage: routeUrl,
        url: routeUrl
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
          { '@type': 'ListItem', position: 2, name: 'Learn', item: `${siteUrl}/learn` },
          { '@type': 'ListItem', position: 3, name: meta.heading, item: routeUrl }
        ]
      }
    )
  }

  if (meta.type === 'tool') {
    const faqs = categoryFaq[meta.category] || categoryFaq.Misc
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } }))
    })
  }

  return schemas.map((schema) => `<script type="application/ld+json">${JSON.stringify(schema)}</script>`).join('')
}

function applyFallbackContent(html, meta) {
  const fallbackMain = buildFallbackMain(meta)
  return html.replace(/<main style="max-width: 960px;[\s\S]*?<\/main>/, fallbackMain)
}

function buildSitemapXml(routes) {
  const rows = routes
    .map((route) => `  <url>\n    <loc>${withAbsoluteUrl(route)}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${route.startsWith('/tools/') || route.startsWith('/learn/') ? 'monthly' : 'weekly'}</changefreq>\n    <priority>${route === '/' ? '1.0' : route === '/tools' || route === '/learn' ? '0.9' : route.startsWith('/tools/') || route.startsWith('/learn/') ? '0.7' : '0.8'}</priority>\n  </url>`)
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows}\n</urlset>\n`
}

const baseHtml = await fs.readFile(indexPath, 'utf8')
const toolCatalog = JSON.parse(await fs.readFile(toolCatalogPath, 'utf8'))

const toolRoutes = toolCatalog.map((tool) => ({
  route: `/tools/${tool.slug}`,
  title: `${tool.name} - String Ninja Tool`,
  description: `${tool.summary} Includes usage guidance, examples, common mistakes, and direct access to the live utility.`,
  heading: tool.name,
  intro: tool.summary,
  links: [
    [tool.appPath, `Open ${tool.name}`],
    ['/tools', 'All Tools Hub'],
    ['/learn', 'Learn Hub']
  ],
  type: 'tool',
  category: tool.category
}))

const renderRoutes = [...staticRoutes, ...toolRoutes]

for (const meta of renderRoutes) {
  let html = baseHtml
  html = applyHeadMetadata(html, meta)
  html = applyFallbackContent(html, meta)
  html = html.replace('</head>', `${buildSchema(meta)}\n  </head>`)

  const outDir = path.join(distDir, meta.route.slice(1))
  await fs.mkdir(outDir, { recursive: true })
  await fs.writeFile(path.join(outDir, 'index.html'), html, 'utf8')
}

const sitemapRoutes = ['/', ...renderRoutes.map((r) => r.route)]
await fs.writeFile(path.join(distDir, 'sitemap.xml'), buildSitemapXml(sitemapRoutes), 'utf8')

console.log(`Prerendered ${renderRoutes.length} routes and generated sitemap with ${sitemapRoutes.length} URLs.`)
