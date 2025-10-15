import { useEffect } from 'react'

export default function Head({ title, description, canonical }: { title?: string; description?: string; canonical?: string }) {
  useEffect(() => {
    if (title) document.title = title
    if (description) {
      let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null
      if (!meta) {
        meta = document.createElement('meta')
        meta.setAttribute('name', 'description')
        document.head.appendChild(meta)
      }
      meta.setAttribute('content', description)
    }
    // Set canonical to site domain + pathname (strip query) unless overridden
    const href = canonical || `https://stringninja.in${window.location.pathname}`
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
