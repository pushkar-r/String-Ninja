import { useEffect } from 'react'

const siteOrigin = 'https://stringninja.in'

function normalizePathname(pathname: string) {
  const collapsed = pathname.replace(/\/{2,}/g, '/')
  if (!collapsed || collapsed === '/') return '/'
  return collapsed.endsWith('/') ? collapsed : `${collapsed}/`
}

function normalizeCanonicalUrl(urlOrPath: string) {
  try {
    const url = new URL(urlOrPath, siteOrigin)
    url.hash = ''
    url.pathname = normalizePathname(url.pathname)
    return url.toString()
  } catch {
    return urlOrPath
  }
}

function normalizeDescription(text: string) {
  const compact = text.trim().replace(/\s+/g, ' ')
  if (compact.length >= 70 && compact.length <= 158) return compact
  if (compact.length < 70) {
    return `${compact} Includes practical examples, common pitfalls, and safe usage guidance.`.slice(0, 158)
  }
  const hardTrim = compact.slice(0, 155)
  const safeTrim = hardTrim.includes(' ') ? hardTrim.slice(0, hardTrim.lastIndexOf(' ')) : hardTrim
  return `${safeTrim}...`
}

export default function Head({ title, description, canonical }: { title?: string; description?: string; canonical?: string }) {
  useEffect(() => {
    if (title) document.title = title
    if (description) {
      const normalizedDescription = normalizeDescription(description)
      let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null
      if (!meta) {
        meta = document.createElement('meta')
        meta.setAttribute('name', 'description')
        document.head.appendChild(meta)
      }
      meta.setAttribute('content', normalizedDescription)
    }
    const canonicalSource = canonical || window.location.pathname
    const href = normalizeCanonicalUrl(canonicalSource)
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
    if (!link) {
      link = document.createElement('link')
      link.setAttribute('rel', 'canonical')
      document.head.appendChild(link)
    }
    link.setAttribute('href', href)
  }, [title, description, canonical])
  return null
}
