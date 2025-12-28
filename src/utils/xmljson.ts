import convert from 'xml-js'

export function xmlToJson(xml: string) {
  try {
    const res = convert.xml2json(xml, { compact: false, spaces: 2 })
    return res
  } catch (e) { return 'Invalid XML' }
}

export function jsonToXml(jsonText: string) {
  try {
    const obj = JSON.parse(jsonText)

    // If input is already in xml-js non-compact JS shape (like xml2json output), convert using non-compact
    const isNonCompact = obj && typeof obj === 'object' && (Object.prototype.hasOwnProperty.call(obj, 'elements') || Object.prototype.hasOwnProperty.call(obj, 'declaration'))
    if (isNonCompact) {
      return convert.js2xml(obj, { compact: false, spaces: 2 })
    }

    // Otherwise, map standard JSON to xml-js compact shape and wrap in a single root
    function toCompact(val: any): any {
      if (val === null) return { _text: 'null' }
      const t = typeof val
      if (t === 'string' || t === 'number' || t === 'boolean') return { _text: String(val) }
      if (Array.isArray(val)) return val.map(item => toCompact(item))
      if (t === 'object') {
        const out: any = {}
        for (const [k, v] of Object.entries(val)) {
          if (v && typeof v === 'object' && !Array.isArray(v)) out[k] = toCompact(v)
          else if (Array.isArray(v)) out[k] = v.map(item => toCompact(item))
          else out[k] = { _text: String(v) }
        }
        return out
      }
      return { _text: '' }
    }
    const body = Array.isArray(obj) ? { item: toCompact(obj) } : toCompact(obj)
    const wrapped = { root: body }
    return convert.js2xml(wrapped, { compact: true, spaces: 2 })
  } catch (e) { return 'Invalid JSON' }
}
