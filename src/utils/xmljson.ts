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
    const compact = Array.isArray(obj) ? { item: toCompact(obj) } : toCompact(obj)
    return convert.json2xml(compact, { compact: true, spaces: 2 })
  } catch (e) { return 'Invalid JSON' }
}
