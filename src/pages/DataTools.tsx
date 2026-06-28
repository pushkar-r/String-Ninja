import React, { useRef, useState } from 'react'
import ToolCard from '../components/ToolCard'
import ToolLayout from '../components/ToolLayout'
import CopyButton from '../components/CopyButton'
import Head from '../components/Head'
import Papa from 'papaparse'
import { marked } from 'marked'
import QRCode from 'qrcode'
import jsQR from 'jsqr'
import { beautifyCode, minifyCode } from '../utils/formatters'
import { xmlToJson, jsonToXml } from '../utils/xmljson'
import { normalizeText } from '../utils/unicode'
import * as yaml from 'js-yaml'
import Beam from '../components/Beam'

function describeJsonError(jsonText: string, err: any): string {
  try {
    const msg = err && err.message ? String(err.message) : 'Invalid JSON'
    const m = msg.match(/position (\d+)/i)
    const pos = m ? parseInt(m[1], 10) : -1
    if (pos >= 0 && pos <= jsonText.length) {
      let line = 1, col = 1
      for (let i = 0; i < pos; i++) {
        const ch = jsonText[i]
        if (ch === '\n') { line++; col = 1 } else { col++ }
      }
      const lines = jsonText.split(/\r?\n/)
      const lineText = lines[line - 1] ?? ''
      const caret = ' '.repeat(Math.max(0, col - 1)) + '^'
      return `Invalid JSON at line ${line}, column ${col} (position ${pos})\n${lineText}\n${caret}\n\n${msg}`
    }
    return 'Invalid JSON: ' + msg
  } catch {
    return 'Invalid JSON'
  }
}
export default function DataTools() {
  const [active, setActive] = useState<'json'|'yaml'|'csv'|'md'|'qr'|'beam'|'code'|'xml'|'norm'>('json')

  // States preserved from original implementation
  const [jsonText, setJsonText] = useState('')
  const [jsonOut, setJsonOut] = useState('')
  const [csvText, setCsvText] = useState('')
  const [csvJson, setCsvJson] = useState('')
  // Markdown feature removed
  // const [mdText, setMdText] = useState('')
  // const [mdHtml, setMdHtml] = useState('')
  const [qrInput, setQrInput] = useState('')
  const [qrUrl, setQrUrl] = useState('')
  const [qrDecoded, setQrDecoded] = useState('')
  const fileInput = useRef<HTMLInputElement|null>(null)

  // New state-based I/O for tools that previously used direct DOM access
  const [codeIn, setCodeIn] = useState('')
  const [codeOut, setCodeOut] = useState('')
  const [xjInput, setXjInput] = useState('')
  const [xjOutput, setXjOutput] = useState('')
  const [normIn, setNormIn] = useState('')
  const [normOut, setNormOut] = useState('')
  // YAML ↔ JSON
  const [yamlIn, setYamlIn] = useState('')
  const [yamlOut, setYamlOut] = useState('')
  const [yamlStatus, setYamlStatus] = useState<'idle'|'success'|'error'>('idle')
  // CSV ↔ JSON
  const [csvIn, setCsvIn] = useState('')
  const [csvOut, setCsvOut] = useState('')
  const [csvHasHeader, setCsvHasHeader] = useState(true)
  const [csvDelimiter, setCsvDelimiter] = useState(',')
  const [csvConvStatus, setCsvConvStatus] = useState<'idle'|'success'|'error'>('idle')
  // Markdown
  const [mdIn, setMdIn] = useState('')
  const [mdOut, setMdOut] = useState('')
  const [jsonStatus, setJsonStatus] = useState<'idle'|'success'|'error'>('idle')
  const [csvStatus, setCsvStatus] = useState<'idle'|'success'|'error'>('idle')
  const [codeStatus, setCodeStatus] = useState<'idle'|'success'|'error'>('idle')
  const [xjStatus, setXjStatus] = useState<'idle'|'success'|'error'>('idle')

  const navItems: { key: typeof active, label: string }[] = [
    { key: 'json', label: 'JSON Formatter / Minifier' },
    { key: 'yaml', label: 'YAML ↔ JSON' },
    { key: 'csv', label: 'CSV ↔ JSON' },
    { key: 'md', label: 'Markdown → HTML' },
    { key: 'qr', label: 'QR Code Tools' },
    { key: 'beam', label: 'Beam — File Transfer' },
    { key: 'code', label: 'Beautify / Minify' },
    { key: 'xml', label: 'XML ↔ JSON' },
    { key: 'norm', label: 'Unicode Normalizer' },
  ]

  function renderPanel(){
    switch (active) {
      case 'json':
        return (
          <ToolCard title="JSON Formatter / Minifier" description="Pretty-print or minify JSON text for readability or compact size.">
            <textarea value={jsonText} onChange={e=>setJsonText(e.target.value)} placeholder='{ "hello": 1 }' className="w-full h-40 rounded-xl border p-3 font-mono text-xs dark:bg-slate-900" />
            <div className="flex flex-wrap gap-2">
              <button onClick={()=>{ try { setJsonOut(JSON.stringify(JSON.parse(jsonText), null, 2)); setJsonStatus('success') } catch (e) { setJsonOut(describeJsonError(jsonText, e)); setJsonStatus('error') } }} className="px-3 py-2 rounded-xl bg-slate-900 text-white">Format</button>
              <button onClick={()=>{ try { setJsonOut(JSON.stringify(JSON.parse(jsonText))); setJsonStatus('success') } catch (e) { setJsonOut(describeJsonError(jsonText, e)); setJsonStatus('error') } }} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">Minify</button>
            </div>
            <div className="relative"><textarea readOnly value={jsonOut} className={
              "w-full h-40 rounded-xl border p-3 font-mono text-xs pr-12 " +
              (jsonText.trim()==='' ? 'bg-white dark:bg-slate-900' : jsonStatus==='success' ? 'bg-emerald-50 dark:bg-emerald-950' : jsonStatus==='error' ? 'bg-red-50 dark:bg-red-950' : 'bg-white dark:bg-slate-900')
            } /><div className="absolute top-2 right-2"><CopyButton value={jsonOut} /></div></div>
            <div className="mt-6 text-sm leading-6 text-slate-700 dark:text-slate-300">
              <h3 className="text-base font-semibold">How JSON formatting works</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Input is parsed per JSON standard (RFC 8259) – all keys and string values must be quoted with double quotes.</li>
                <li>Format pretty-prints with indentation; Minify removes insignificant whitespace.</li>
                <li>Errors show position, line and column to help fix invalid JSON.</li>
              </ul>
            </div>
          </ToolCard>
        )
      case 'yaml':
        return (
          <ToolCard title="YAML ↔ JSON Converter" description="Bidirectional conversion between YAML and JSON — useful for Kubernetes configs, GitHub Actions, and any config-heavy workflow.">
            <div className="grid md:grid-cols-2 gap-3">
              <div className="relative">
                <textarea value={yamlIn} onChange={e=>setYamlIn(e.target.value)} placeholder="Paste YAML or JSON here…" className="w-full h-48 rounded-xl border p-3 font-mono text-xs pr-12 dark:bg-slate-900" />
                <div className="absolute top-2 right-2"><CopyButton value={yamlIn} /></div>
              </div>
              <div className="relative">
                <textarea readOnly value={yamlOut} placeholder="Output appears here…" className={
                  "w-full h-48 rounded-xl border p-3 font-mono text-xs pr-12 " +
                  (yamlIn.trim()==='' ? 'dark:bg-slate-900' : yamlStatus==='success' ? 'bg-emerald-50 dark:bg-emerald-950' : yamlStatus==='error' ? 'bg-red-50 dark:bg-red-950' : 'dark:bg-slate-900')
                } />
                <div className="absolute top-2 right-2"><CopyButton value={yamlOut} /></div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={()=>{
                try {
                  const parsed = yaml.load(yamlIn)
                  setYamlOut(JSON.stringify(parsed, null, 2))
                  setYamlStatus('success')
                } catch(e: any) {
                  setYamlOut('Error: ' + (e.message || String(e)))
                  setYamlStatus('error')
                }
              }} className="px-3 py-2 rounded-xl bg-slate-900 text-white">YAML → JSON</button>
              <button onClick={()=>{
                try {
                  const parsed = JSON.parse(yamlIn)
                  setYamlOut(yaml.dump(parsed))
                  setYamlStatus('success')
                } catch(e: any) {
                  setYamlOut('Error: ' + (e.message || String(e)))
                  setYamlStatus('error')
                }
              }} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">JSON → YAML</button>
            </div>
            <div className="mt-6 text-sm leading-6 text-slate-700 dark:text-slate-300 space-y-2">
              <h3 className="text-base font-semibold">About YAML and JSON</h3>
              <p>YAML (YAML Ain't Markup Language) is a human-friendly data serialisation format used heavily in DevOps tooling — Kubernetes manifests, GitHub Actions workflows, Docker Compose files, Ansible playbooks, and more. JSON is the de facto format for APIs and web services.</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>YAML → JSON</strong> parses the full YAML spec including multi-document, anchors (&amp;) and aliases (*), block scalars, and inline flow style.</li>
                <li><strong>JSON → YAML</strong> outputs clean block-style YAML. Nested objects become indented mappings; arrays become block sequences.</li>
                <li>YAML is a superset of JSON — all valid JSON is valid YAML, so you can paste JSON on the left and convert it to idiomatic YAML.</li>
                <li>Null, boolean, and numeric types are preserved in both directions. Dates and timestamps are kept as strings to avoid silent type coercion.</li>
                <li>Common use case: copy a Kubernetes manifest, convert to JSON for programmatic editing, then convert back to YAML for deployment.</li>
              </ul>
            </div>
          </ToolCard>
        )
      case 'csv':
        return (
          <ToolCard title="CSV ↔ JSON Converter" description="Convert between CSV (comma/tab/semicolon-delimited) and a JSON array of objects, or a JSON array of arrays.">
            <div className="flex flex-wrap gap-4 mb-2 text-sm items-center">
              <div className="flex items-center gap-2">
                <label className="font-medium">Delimiter:</label>
                <select value={csvDelimiter} onChange={e=>setCsvDelimiter(e.target.value)} className="px-2 py-1 rounded-xl border dark:bg-slate-900 text-sm">
                  <option value=",">Comma (,)</option>
                  <option value="\t">Tab</option>
                  <option value=";">Semicolon (;)</option>
                  <option value="|">Pipe (|)</option>
                </select>
              </div>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={csvHasHeader} onChange={e=>setCsvHasHeader(e.target.checked)} />
                First row is header
              </label>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="relative">
                <textarea value={csvIn} onChange={e=>setCsvIn(e.target.value)} placeholder="Paste CSV or JSON here…" className="w-full h-48 rounded-xl border p-3 font-mono text-xs pr-12 dark:bg-slate-900" />
                <div className="absolute top-2 right-2"><CopyButton value={csvIn} /></div>
              </div>
              <div className="relative">
                <textarea readOnly value={csvOut} placeholder="Output appears here…" className={
                  "w-full h-48 rounded-xl border p-3 font-mono text-xs pr-12 " +
                  (csvIn.trim()==='' ? 'dark:bg-slate-900' : csvConvStatus==='success' ? 'bg-emerald-50 dark:bg-emerald-950' : csvConvStatus==='error' ? 'bg-red-50 dark:bg-red-950' : 'dark:bg-slate-900')
                } />
                <div className="absolute top-2 right-2"><CopyButton value={csvOut} /></div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={()=>{
                try {
                  const result = Papa.parse(csvIn, { header: csvHasHeader, delimiter: csvDelimiter === '\\t' ? '\t' : csvDelimiter, skipEmptyLines: true, dynamicTyping: true })
                  if (result.errors.length > 0 && result.data.length === 0) throw new Error(result.errors[0].message)
                  setCsvOut(JSON.stringify(result.data, null, 2))
                  setCsvConvStatus('success')
                } catch(e: any) {
                  setCsvOut('Error: ' + (e.message || String(e)))
                  setCsvConvStatus('error')
                }
              }} className="px-3 py-2 rounded-xl bg-slate-900 text-white">CSV → JSON</button>
              <button onClick={()=>{
                try {
                  const parsed = JSON.parse(csvIn)
                  if (!Array.isArray(parsed)) throw new Error('Input must be a JSON array')
                  const result = Papa.unparse(parsed, { delimiter: csvDelimiter === '\\t' ? '\t' : csvDelimiter })
                  setCsvOut(result)
                  setCsvConvStatus('success')
                } catch(e: any) {
                  setCsvOut('Error: ' + (e.message || String(e)))
                  setCsvConvStatus('error')
                }
              }} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">JSON → CSV</button>
            </div>
            <div className="mt-6 text-sm leading-6 text-slate-700 dark:text-slate-300 space-y-2">
              <h3 className="text-base font-semibold">About CSV and JSON conversion</h3>
              <p>CSV (Comma-Separated Values) is the universal interchange format for spreadsheets, databases, and data pipelines. Converting to JSON makes it easy to process in JavaScript, Python, or any API.</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>CSV → JSON</strong> with header row produces an array of objects where each key is the column name. Without header, produces an array of arrays.</li>
                <li><strong>JSON → CSV</strong> expects a JSON array. Objects become rows with the first object's keys as headers. Nested objects are stringified.</li>
                <li>Dynamic typing is on by default: numeric strings become numbers, "true"/"false" become booleans, empty cells become null.</li>
                <li>Supports comma, tab (TSV), semicolon (European locale), and pipe delimiters.</li>
                <li>Common workflow: export data from a database as CSV → convert to JSON → feed into an API or chart library.</li>
              </ul>
            </div>
          </ToolCard>
        )
      case 'md':
        return (
          <ToolCard title="Markdown → HTML" description="Render GitHub-flavoured Markdown to HTML for preview, publishing, or CMS integration.">
            <div className="grid md:grid-cols-2 gap-3">
              <textarea value={mdIn} onChange={e=>setMdIn(e.target.value)} placeholder="# Hello&#10;&#10;Write **Markdown** here…" className="w-full h-64 rounded-xl border p-3 font-mono text-xs dark:bg-slate-900" />
              <div className="relative">
                <div className="rounded-xl border p-3 h-64 overflow-auto text-sm prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: mdIn ? String(marked(mdIn)) : '<p class="text-slate-400">Preview will appear here…</p>' }} />
              </div>
            </div>
            <div className="relative mt-3">
              <textarea readOnly value={mdIn ? String(marked(mdIn)) : ''} placeholder="Raw HTML output…" className="w-full h-32 rounded-xl border p-3 font-mono text-xs pr-12 dark:bg-slate-900" />
              <div className="absolute top-2 right-2"><CopyButton value={mdIn ? String(marked(mdIn)) : ''} /></div>
            </div>
            <div className="mt-6 text-sm leading-6 text-slate-700 dark:text-slate-300 space-y-2">
              <h3 className="text-base font-semibold">About Markdown</h3>
              <p>Markdown is a lightweight markup language created by John Gruber in 2004. It is the standard format for README files, documentation, GitHub issues and PRs, and many static site generators (Hugo, Jekyll, Docusaurus, MkDocs).</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Headings: <code># H1</code>, <code>## H2</code>, <code>### H3</code></li>
                <li>Emphasis: <code>**bold**</code>, <code>*italic*</code>, <code>~~strikethrough~~</code></li>
                <li>Lists: <code>- item</code> for unordered, <code>1. item</code> for ordered</li>
                <li>Links: <code>[text](url)</code> — Images: <code>![alt](url)</code></li>
                <li>Code: backtick for inline, triple backtick for fenced code blocks</li>
                <li>Tables: pipe-delimited rows with a header separator line</li>
                <li>This tool uses the <strong>marked</strong> library which follows the CommonMark spec and supports GFM (GitHub Flavoured Markdown) extensions.</li>
              </ul>
            </div>
          </ToolCard>
        )
      case 'qr':
        return (
          <ToolCard title="QR Code Tools" description="Generate QR codes from text and decode them from uploaded images.">
            <div className="grid gap-4">
              <div>
                <div className="font-semibold text-sm mb-2">Generator</div>
                <div className="grid md:grid-cols-[1fr_auto] gap-2 items-start">
                  <input value={qrInput} onChange={e=>setQrInput(e.target.value)} placeholder="Text or URL…" className="w-full rounded-xl border p-3 dark:bg-slate-900" />
                  <button onClick={async ()=> setQrUrl(await QRCode.toDataURL(qrInput || ''))} className="px-3 py-2 rounded-xl bg-slate-900 text-white">Generate</button>
                </div>
                {qrUrl && <img src={qrUrl} alt="QR code" className="mt-3 w-40 h-40 border rounded-xl" />}
              </div>
              <div>
                <div className="font-semibold text-sm mb-2">Reader</div>
                <div className="grid gap-2">
                  <input ref={fileInput} type="file" accept="image/*" className="block" onChange={async (e)=>{
                    const file = e.target.files?.[0]; if(!file) return
                    const img = new Image()
                    const url = URL.createObjectURL(file)
                    img.onload = ()=>{
                      const canvas = document.createElement('canvas')
                      canvas.width = img.naturalWidth; canvas.height = img.naturalHeight
                      const ctx = canvas.getContext('2d')!
                      ctx.drawImage(img,0,0)
                      const imgData = ctx.getImageData(0,0,canvas.width,canvas.height)
                      const code = jsQR(imgData.data, canvas.width, canvas.height)
                      setQrDecoded(code?.data || 'No QR found')
                    }
                    img.src = url
                  }} />
                  <div className="relative">
                    <textarea readOnly value={qrDecoded} placeholder="Decoded text will appear here" className="w-full h-24 rounded-xl border p-3 font-mono text-xs pr-12 dark:bg-slate-900" />
                    <div className="absolute top-2 right-2"><CopyButton value={qrDecoded} /></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 text-sm leading-6 text-slate-700 dark:text-slate-300">
              <h3 className="text-base font-semibold">How it works</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Generator renders text into QR using standard black/white modules; longer text increases version and size.</li>
                <li>Reader draws the image onto a canvas and scans pixels to locate and decode the QR pattern.</li>
                <li>Decoding can fail on blurry/low-contrast images; try larger images and good lighting.</li>
              </ul>
            </div>
          </ToolCard>
        )
      case 'beam':
        return <Beam />
      case 'code':
        return (
          <ToolCard title="HTML / CSS / JS Beautify & Minify" description="Format or minify HTML, CSS, and JavaScript for readability or performance.">
            <textarea value={codeIn} onChange={e=>setCodeIn(e.target.value)} placeholder="Paste code (html/css/js)..." className="w-full h-40 rounded-xl border p-3 font-mono text-xs dark:bg-slate-900" />
            <div className="flex flex-wrap gap-2">
              <button onClick={()=> { setCodeOut(beautifyCode(codeIn, 'js')); setCodeStatus(codeIn.trim()===''? 'idle' : 'success') }} className="px-3 py-2 rounded-xl bg-slate-900 text-white">Beautify JS</button>
              <button onClick={()=> { setCodeOut(beautifyCode(codeIn, 'css')); setCodeStatus(codeIn.trim()===''? 'idle' : 'success') }} className="px-3 py-2 rounded-xl bg-slate-900 text-white">Beautify CSS</button>
              <button onClick={()=> { setCodeOut(beautifyCode(codeIn, 'html')); setCodeStatus(codeIn.trim()===''? 'idle' : 'success') }} className="px-3 py-2 rounded-xl bg-slate-900 text-white">Beautify HTML</button>
              <button onClick={async ()=> { setCodeOut(await minifyCode(codeIn, 'js')); setCodeStatus(codeIn.trim()===''? 'idle' : 'success') }} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">Minify JS</button>
              <button onClick={async ()=> { setCodeOut(await minifyCode(codeIn, 'css')); setCodeStatus(codeIn.trim()===''? 'idle' : 'success') }} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">Minify CSS</button>
              <button onClick={async ()=> { setCodeOut(await minifyCode(codeIn, 'html')); setCodeStatus(codeIn.trim()===''? 'idle' : 'success') }} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">Minify HTML</button>
            </div>
            <div className="relative"><textarea readOnly value={codeOut} className={
              "w-full h-40 rounded-xl border p-3 font-mono text-xs pr-12 " +
              (codeIn.trim()==='' ? 'bg-white dark:bg-slate-900' : codeStatus==='success' ? 'bg-emerald-50 dark:bg-emerald-950' : codeStatus==='error' ? 'bg-red-50 dark:bg-red-950' : 'bg-white dark:bg-slate-900')
            } /><div className="absolute top-2 right-2"><CopyButton value={codeOut} /></div></div>
            <div className="mt-6 text-sm leading-6 text-slate-700 dark:text-slate-300">
              <h3 className="text-base font-semibold">Notes</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Beautify re-formats code with indentation and spacing; Minify removes whitespace/comments.</li>
                <li>Minifying can change semantics if code depends on whitespace (e.g., HTML text nodes) or undeclared globals.</li>
                <li>Always keep an original for reference; this tool doesn’t rewrite imports or resolve modules.</li>
              </ul>
            </div>
          </ToolCard>
        )
      case 'xml':
        return (
          <ToolCard title="XML ↔ JSON" description="Convert between XML text and JSON text representations.">
            <div className="grid md:grid-cols-2 gap-3">
              <div className="relative"><textarea value={xjInput} onChange={e=>setXjInput(e.target.value)} placeholder="Input..." className="w-full h-32 rounded-xl border p-3 font-mono text-xs pr-12 dark:bg-slate-900" /></div>
              <div className="relative"><textarea readOnly value={xjOutput} placeholder="Output..." className={
                "w-full h-32 rounded-xl border p-3 font-mono text-xs pr-12 " +
                (xjInput.trim()==='' ? 'bg-white dark:bg-slate-900' : xjStatus==='success' ? 'bg-emerald-50 dark:bg-emerald-950' : xjStatus==='error' ? 'bg-red-50 dark:bg-red-950' : 'bg-white dark:bg-slate-900')
              } /><div className="absolute top-2 right-2"><CopyButton value={xjOutput} /></div></div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => { const out = xmlToJson(xjInput); setXjOutput(out); setXjStatus(out.startsWith('Invalid') ? 'error' : 'success') }} className="px-3 py-2 rounded-xl bg-slate-900 text-white">XML → JSON</button>
              <button onClick={() => { let out = jsonToXml(xjInput); if (out.startsWith('Invalid')) { out = jsonToXml(xjOutput) } setXjOutput(out); setXjStatus(out.startsWith('Invalid') ? 'error' : 'success') }} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">JSON → XML</button>
            </div>
            <div className="mt-6 text-sm leading-6 text-slate-700 dark:text-slate-300">
              <h3 className="text-base font-semibold">Conversion details</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>XML → JSON flattens attributes and children using a pragmatic mapping; information like ordering/whitespace may be lost.</li>
                <li>JSON → XML expects objects/arrays and string/number/boolean values; invalid structures will be rejected.</li>
                <li>Round‑trips may not be perfectly reversible due to representational differences.</li>
              </ul>
            </div>
          </ToolCard>
        )
      case 'norm':
        return (
          <ToolCard title="Unicode Normalizer" description="Normalize Unicode text (NFC, NFD, NFKC, NFKD) for consistent representation.">
            <textarea value={normIn} onChange={e=>setNormIn(e.target.value)} placeholder="Text..." className="w-full h-28 rounded-xl border p-3 dark:bg-slate-900" />
            <div className="flex gap-2">
              <button onClick={() => setNormOut(normalizeText(normIn, 'NFC'))} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">NFC</button>
              <button onClick={() => setNormOut(normalizeText(normIn, 'NFD'))} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">NFD</button>
              <button onClick={() => setNormOut(normalizeText(normIn, 'NFKC'))} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">NFKC</button>
              <button onClick={() => setNormOut(normalizeText(normIn, 'NFKD'))} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">NFKD</button>
            </div>
            <div className="relative"><textarea readOnly value={normOut} className="w-full h-28 rounded-xl border p-3 dark:bg-slate-900 pr-12" /><div className="absolute top-2 right-2"><CopyButton value={normOut} /></div></div>
            <div className="mt-6 text-sm leading-6 text-slate-700 dark:text-slate-300">
              <h3 className="text-base font-semibold">About normalization</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>NFC/NFD keep canonical equivalence; NFKC/NFKD add compatibility mappings (e.g., ligatures → letters).</li>
                <li>NFD/NFKD decompose to base + combining marks; NFC/NFKC recompose into precomposed characters where possible.</li>
                <li>Use NFC for storage/search; use NFKC when visual equivalence matters more than strict code point equality.</li>
              </ul>
            </div>
          </ToolCard>
        )
    }
  }

  return (
    <>
      <Head title="String Ninja — Data Tools: JSON, QR Code, Formatters" description="Format and minify JSON documents, generate QR codes from text, scan QR codes from images, beautify and minify HTML/CSS/JavaScript code, convert bidirectionally between XML and JSON formats, and normalize Unicode text." />
      <ToolLayout
        title="Data Tools"
        activeKey={active}
        navItems={navItems}
        onSelect={key => setActive(key as any)}
      >
        {renderPanel()}
      </ToolLayout>
    </>
  )
}
