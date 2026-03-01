import fs from 'node:fs/promises'
import path from 'node:path'

const siteUrl = 'https://stringninja.in'
const ogImage = `${siteUrl}/logo1-nobg.png`
const distDir = path.resolve('dist')
const indexPath = path.join(distDir, 'index.html')

const routes = [
  {
    route: '/strings',
    title: 'String Ninja - String Utilities: Transform, Regex, Wrap',
    description: 'String tools for cleanup, case conversion, delimiter operations, regex find/replace, line handling, wrap, and frequency analysis.',
    heading: 'String Tools',
    intro: 'Use practical string transformations for cleanup, normalization, and structured output generation in day-to-day engineering workflows.',
    links: [
      ['/strings', 'Open String Tools'],
      ['/learn/regex-text-guide', 'Read Regex and Text Processing Guide'],
      ['/learn/utility-workflows-guide', 'Read Developer Utility Workflows Guide']
    ],
    type: 'webpage'
  },
  {
    route: '/compare',
    title: 'String Ninja - Compare Two Texts: Diff Tool Online',
    description: 'Compare text by words, characters, or lines with inline and side-by-side diffs for fast review and debugging.',
    heading: 'Compare Tools',
    intro: 'Visual diff tools help you inspect payload changes, config drift, and text edits with the right granularity for each task.',
    links: [
      ['/compare', 'Open Compare Tool'],
      ['/learn/compare-diff-guide', 'Read Text Diff and Comparison Guide'],
      ['/learn/utility-workflows-guide', 'Read Developer Utility Workflows Guide']
    ],
    type: 'webpage'
  },
  {
    route: '/security',
    title: 'String Ninja - Security Tools: Hash, AES, JWT, RSA, X.509, SAML',
    description: 'Security tooling for hash checks, JWT decode/verify, AES helpers, key generation, certificate inspection, and SAML decoding.',
    heading: 'Security Tools',
    intro: 'Inspect and troubleshoot common security formats and cryptographic helpers directly in the browser for faster triage and validation.',
    links: [
      ['/security', 'Open Security Tools'],
      ['/learn/jwt-security-guide', 'Read JWT Security Guide'],
      ['/learn/hashing-password-guide', 'Read Hashing and Password Security Guide'],
      ['/learn/cert-saml-guide', 'Read X.509 and SAML Troubleshooting Guide']
    ],
    type: 'webpage'
  },
  {
    route: '/data',
    title: 'String Ninja - Data Tools: JSON, QR, Formatters, XML-JSON',
    description: 'Data tools for JSON formatting, QR generation/scan, code beautify/minify, XML-JSON conversion, and Unicode normalization.',
    heading: 'Data Tools',
    intro: 'Format, validate, and convert structured data to reduce debugging time and improve interoperability across APIs and systems.',
    links: [
      ['/data', 'Open Data Tools'],
      ['/learn/json-data-guide', 'Read JSON and Data Formatting Guide'],
      ['/learn/url-html-encoding-guide', 'Read URL and HTML Encoding Guide']
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
      ['/learn/hashing-password-guide', 'Read Hashing and Password Security Guide']
    ],
    type: 'webpage'
  },
  {
    route: '/learn',
    title: 'Learn - String Ninja Guides',
    description: 'In-depth guides for encoding, security, data formatting, regex workflows, and practical troubleshooting.',
    heading: 'Learn',
    intro: 'Browse long-form guides that explain important concepts, operational checklists, and common pitfalls for developer utility workflows.',
    links: [
      ['/learn/base64-guide', 'Base64 in Real Systems Guide'],
      ['/learn/jwt-security-guide', 'JWT Security Guide'],
      ['/learn/url-html-encoding-guide', 'URL and HTML Encoding Guide'],
      ['/learn/json-data-guide', 'JSON and Data Formatting Guide'],
      ['/learn/regex-text-guide', 'Regex and Text Processing Guide'],
      ['/learn/hashing-password-guide', 'Hashing and Password Security Guide'],
      ['/learn/cert-saml-guide', 'X.509 and SAML Troubleshooting Guide'],
      ['/learn/compare-diff-guide', 'Text Diff and Comparison Guide'],
      ['/learn/utility-workflows-guide', 'Developer Utility Workflows Guide']
    ],
    type: 'webpage'
  },
  {
    route: '/about',
    title: 'About String Ninja - Mission, Trust, and How It Works',
    description: 'Learn what String Ninja is, who it is for, and the privacy-first principles behind its browser-based tools.',
    heading: 'About String Ninja',
    intro: 'String Ninja focuses on practical, client-side tools that reduce day-to-day engineering friction while keeping workflows transparent and fast.',
    links: [
      ['/about', 'Read About Page'],
      ['/privacy', 'Read Privacy Policy'],
      ['/terms', 'Read Terms of Use'],
      ['/contact', 'Contact the Developer']
    ],
    type: 'webpage'
  },
  {
    route: '/privacy',
    title: 'Privacy Policy - String Ninja',
    description: 'Privacy policy explaining local processing, operational data handling, and third-party advertising context for String Ninja.',
    heading: 'Privacy Policy',
    intro: 'Review how String Ninja handles browser-side processing, storage, and essential operational signals.',
    links: [
      ['/privacy', 'Read Privacy Policy'],
      ['/terms', 'Read Terms of Use'],
      ['/contact', 'Contact']
    ],
    type: 'webpage'
  },
  {
    route: '/terms',
    title: 'Terms of Use - String Ninja',
    description: 'Terms of use for accessing String Ninja tools, including scope, limitations, and user responsibilities.',
    heading: 'Terms of Use',
    intro: 'Read the terms that define acceptable use, disclaimers, and service limitations for String Ninja.',
    links: [
      ['/terms', 'Read Terms of Use'],
      ['/privacy', 'Read Privacy Policy'],
      ['/contact', 'Contact']
    ],
    type: 'webpage'
  },
  {
    route: '/contact',
    title: 'Contact String Ninja',
    description: 'Contact the String Ninja developer for collaboration, feedback, or support inquiries.',
    heading: 'Contact',
    intro: 'Reach out for collaboration and support related to String Ninja tooling and documentation.',
    links: [
      ['/contact', 'Open Contact Page'],
      ['/about', 'About String Ninja']
    ],
    type: 'webpage'
  },
  {
    route: '/learn/base64-guide',
    title: 'Base64 Guide - String Ninja',
    description: 'Learn how Base64 encoding works, where it appears in real systems, and how to avoid common decoding mistakes.',
    heading: 'Base64 in Real Systems Guide',
    intro: 'A practical guide to Base64 variants, padding behavior, transport constraints, and safe implementation patterns.',
    links: [
      ['/learn/base64-guide', 'Read Base64 Guide'],
      ['/learn/url-html-encoding-guide', 'URL and HTML Encoding Guide'],
      ['/learn', 'Back to Learn Hub']
    ],
    type: 'article'
  },
  {
    route: '/learn/jwt-security-guide',
    title: 'JWT Security Guide - String Ninja',
    description: 'Decode and validate JWTs safely with practical guidance on signatures, claims checks, and key management.',
    heading: 'JWT Security Guide',
    intro: 'Understand decode-vs-verify boundaries, claim validation, and trust controls for production token workflows.',
    links: [
      ['/learn/jwt-security-guide', 'Read JWT Guide'],
      ['/learn/hashing-password-guide', 'Hashing and Password Security Guide'],
      ['/learn', 'Back to Learn Hub']
    ],
    type: 'article'
  },
  {
    route: '/learn/url-html-encoding-guide',
    title: 'URL and HTML Encoding Guide - String Ninja',
    description: 'Use URL percent-encoding and HTML entity encoding correctly to avoid parser bugs and unsafe rendering patterns.',
    heading: 'URL and HTML Encoding Guide',
    intro: 'Learn where each encoding applies and how to avoid double-encoding and context-mismatch failures.',
    links: [
      ['/learn/url-html-encoding-guide', 'Read URL and HTML Encoding Guide'],
      ['/learn/base64-guide', 'Base64 in Real Systems Guide'],
      ['/learn', 'Back to Learn Hub']
    ],
    type: 'article'
  },
  {
    route: '/learn/json-data-guide',
    title: 'JSON and Data Formatting Guide - String Ninja',
    description: 'Best practices for JSON formatting, minification, validation order, and XML-JSON conversion caveats.',
    heading: 'JSON and Data Formatting Guide',
    intro: 'Use structured data tooling for reliable debugging with clear parse, validate, and transformation steps.',
    links: [
      ['/learn/json-data-guide', 'Read JSON and Data Guide'],
      ['/data', 'Open Data Tools'],
      ['/learn', 'Back to Learn Hub']
    ],
    type: 'article'
  },
  {
    route: '/learn/regex-text-guide',
    title: 'Regex and Text Processing Guide - String Ninja',
    description: 'Practical regex strategy and text transformation workflows to reduce replacement errors and cleanup risk.',
    heading: 'Regex and Text Processing Guide',
    intro: 'Apply regex and text tools safely with staged matching, verification, and reversible transformations.',
    links: [
      ['/learn/regex-text-guide', 'Read Regex and Text Guide'],
      ['/strings', 'Open String Tools'],
      ['/learn', 'Back to Learn Hub']
    ],
    type: 'article'
  },
  {
    route: '/learn/hashing-password-guide',
    title: 'Hashing and Password Security Guide - String Ninja',
    description: 'Understand integrity hashing versus password hashing and choose bcrypt or Argon2 with safer operational defaults.',
    heading: 'Hashing and Password Security Guide',
    intro: 'Separate file integrity checks from credential storage strategy to avoid critical authentication weaknesses.',
    links: [
      ['/learn/hashing-password-guide', 'Read Hashing and Password Guide'],
      ['/security', 'Open Security Tools'],
      ['/learn', 'Back to Learn Hub']
    ],
    type: 'article'
  },
  {
    route: '/learn/cert-saml-guide',
    title: 'X.509 and SAML Troubleshooting Guide - String Ninja',
    description: 'Decode certificates and SAML payloads with a practical checklist for trust, expiry, and binding diagnostics.',
    heading: 'X.509 and SAML Troubleshooting Guide',
    intro: 'Use decode-first investigation methods to isolate federation and certificate issues quickly.',
    links: [
      ['/learn/cert-saml-guide', 'Read X.509 and SAML Guide'],
      ['/security', 'Open Security Tools'],
      ['/learn', 'Back to Learn Hub']
    ],
    type: 'article'
  },
  {
    route: '/learn/compare-diff-guide',
    title: 'Text Diff and Comparison Guide - String Ninja',
    description: 'Choose the right diff mode and view style for config reviews, payload debugging, and content comparison.',
    heading: 'Text Diff and Comparison Guide',
    intro: 'Match comparison granularity to the task so you can detect meaningful changes faster.',
    links: [
      ['/learn/compare-diff-guide', 'Read Diff Guide'],
      ['/compare', 'Open Compare Tool'],
      ['/learn', 'Back to Learn Hub']
    ],
    type: 'article'
  },
  {
    route: '/learn/utility-workflows-guide',
    title: 'Developer Utility Workflows Guide - String Ninja',
    description: 'End-to-end workflows combining encoding, string, data, and security tools for efficient troubleshooting.',
    heading: 'Developer Utility Workflows Guide',
    intro: 'Combine utility tools into repeatable triage workflows for incidents, migrations, and integration debugging.',
    links: [
      ['/learn/utility-workflows-guide', 'Read Utility Workflow Guide'],
      ['/learn', 'Back to Learn Hub'],
      ['/contact', 'Contact']
    ],
    type: 'article'
  }
]

const baseHtml = await fs.readFile(indexPath, 'utf8')

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function applyHeadMetadata(html, meta) {
  const routeUrl = `${siteUrl}${meta.route}`
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
  const links = meta.links
    .map(([href, label]) => `<li><a href="${href}">${escapeHtml(label)}</a></li>`)
    .join('')

  return `<main style="max-width: 960px; margin: 0 auto; padding: 24px; font-family: Arial, sans-serif; line-height: 1.6;">
        <h1>${escapeHtml(meta.heading)}</h1>
        <p>${escapeHtml(meta.intro)}</p>
        <h2>Quick Links</h2>
        <ul>${links}</ul>
        <p>String Ninja tools run in the browser for practical text, security, and data workflows. For critical production decisions, validate outcomes in your own controlled pipeline.</p>
      </main>`
}

function buildExtraSchema(meta) {
  const routeUrl = `${siteUrl}${meta.route}`
  const baseSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: meta.title,
    description: meta.description,
    url: routeUrl,
    isPartOf: { '@type': 'WebSite', name: 'String Ninja', url: siteUrl }
  }

  if (meta.type !== 'article') {
    return `<script type="application/ld+json">${JSON.stringify(baseSchema)}</script>`
  }

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: meta.heading,
    description: meta.description,
    author: { '@type': 'Person', name: 'Pushkar Raj' },
    publisher: { '@type': 'Organization', name: 'String Ninja', url: siteUrl },
    datePublished: '2026-03-02',
    dateModified: '2026-03-02',
    mainEntityOfPage: routeUrl,
    url: routeUrl
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Learn', item: `${siteUrl}/learn` },
      { '@type': 'ListItem', position: 3, name: meta.heading, item: routeUrl }
    ]
  }

  return [baseSchema, articleSchema, breadcrumbSchema]
    .map((schema) => `<script type="application/ld+json">${JSON.stringify(schema)}</script>`)
    .join('')
}

function applyFallbackContent(html, meta) {
  const fallbackMain = buildFallbackMain(meta)
  return html.replace(/<main style="max-width: 960px;[\s\S]*?<\/main>/, fallbackMain)
}

for (const meta of routes) {
  const extraSchema = buildExtraSchema(meta)
  let html = baseHtml
  html = applyHeadMetadata(html, meta)
  html = applyFallbackContent(html, meta)
  html = html.replace('</head>', `${extraSchema}\n  </head>`)

  const outDir = path.join(distDir, meta.route.slice(1))
  await fs.mkdir(outDir, { recursive: true })
  await fs.writeFile(path.join(outDir, 'index.html'), html, 'utf8')
}

console.log(`Prerendered ${routes.length} route HTML files.`)
