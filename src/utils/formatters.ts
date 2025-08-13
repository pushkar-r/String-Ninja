import { js as beautifyJs, css as beautifyCss, html as beautifyHtml } from 'js-beautify'
import { minify as terserMinify } from 'terser'
import csso from 'csso'
import { minify as htmlMinify } from 'html-minifier-terser'

export function beautifyCode(code: string, type: 'js'|'css'|'html') {
  try {
    if (type === 'js') return beautifyJs(code, { indent_size: 2 })
    if (type === 'css') return beautifyCss(code, { indent_size: 2 })
    return beautifyHtml(code, { indent_size: 2 })
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
    // html
    return await htmlMinify(code, {
      collapseWhitespace: true,
      removeComments: true,
      minifyCSS: true,
      minifyJS: true,
    })
  } catch (e) { return String(e) }
}
