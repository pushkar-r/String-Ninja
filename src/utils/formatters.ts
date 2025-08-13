import { js as beautifyJs, css as beautifyCss, html as beautifyHtml } from 'js-beautify'
import { minify as terserMinify } from 'terser'
import * as csso from 'csso'

export function beautifyCode(code: string, type: 'js'|'css'|'html') {
  try {
    if (type === 'js') return beautifyJs(code, { indent_size: 2 })
    if (type === 'css') return beautifyCss(code, { indent_size: 2 })
    return beautifyHtml(code, { indent_size: 2 })
  } catch (e) { return String(e) }
}

function minifyHtmlSimple(html: string) {
  try {
    // Remove HTML comments
    let out = html.replace(/<!--([\s\S]*?)-->/g, '')
    // Collapse whitespace between tags
    out = out.replace(/>\s+</g, '><')
    // Trim leading/trailing whitespace
    out = out.trim()
    return out
  } catch (e) { return String(e) }
}

export async function minifyCode(code: string, type: 'js'|'css'|'html') {
  try {
    if (type === 'js') {
      const res = await terserMinify(code, { compress: true, mangle: true })
      return res.code || ''
    }
    if (type === 'css') {
      return csso.minify(code).css
    }
    // html (browser-safe simple minifier)
    return minifyHtmlSimple(code)
  } catch (e) { return String(e) }
}
