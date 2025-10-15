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
    // Use compact:true so plain objects like {"hello":1} map to <hello>1</hello>
    return convert.json2xml(obj, { compact: true, spaces: 2 })
  } catch (e) { return 'Invalid JSON' }
}
