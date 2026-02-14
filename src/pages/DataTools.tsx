import React, { useRef, useState } from 'react'
import ToolCard from '../components/ToolCard'
import CopyButton from '../components/CopyButton'
import Head from '../components/Head'
import Papa from 'papaparse'
import { marked } from 'marked'
import QRCode from 'qrcode'
import jsQR from 'jsqr'
import { beautifyCode, minifyCode } from '../utils/formatters'
import { xmlToJson, jsonToXml } from '../utils/xmljson'
import { normalizeText } from '../utils/unicode'

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
  const [active, setActive] = useState<'json'|'qr'|'code'|'xml'|'norm'>('json')

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
  const [jsonStatus, setJsonStatus] = useState<'idle'|'success'|'error'>('idle')
  const [csvStatus, setCsvStatus] = useState<'idle'|'success'|'error'>('idle')
  const [codeStatus, setCodeStatus] = useState<'idle'|'success'|'error'>('idle')
  const [xjStatus, setXjStatus] = useState<'idle'|'success'|'error'>('idle')

  const navItems: { key: typeof active, label: string }[] = [
    { key: 'json', label: 'JSON Formatter / Minifier' },
    // { key: 'csv', label: 'CSV ↔ JSON Converter' },
    // { key: 'md', label: 'Markdown → HTML' },
    { key: 'qr', label: 'QR Code Tools' },
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
      // case 'csv':
      //   return (
      //     <ToolCard title="CSV ↔ JSON Converter" description="Convert between CSV (comma/tab-delimited) and JSON arrays of objects.">
      //       ... feature removed ...
      //     </ToolCard>
      //   )
      // case 'md':
      //   return (
      //     <ToolCard title="Markdown → HTML" description="Render Markdown text as HTML for preview or conversion.">
      //       ... feature removed ...
      //     </ToolCard>
      //   )
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
      <div className="grid gap-6 md:grid-cols-[260px_1fr]">
      <div className="bg-white dark:bg-slate-950 rounded-2xl p-3 shadow-sm border border-slate-200 dark:border-slate-800 h-fit md:sticky md:top-24">
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm font-semibold px-2 pb-2 md:pb-2">Data Tools</div>
          <div className="md:hidden w-full">
            <select
              value={active}
              onChange={e=>setActive(e.target.value as any)}
              className="w-full mt-2 px-3 py-2 rounded-xl border dark:bg-slate-900"
            >
              {navItems.map(item => (
                <option key={item.key} value={item.key}>{item.label}</option>
              ))}
            </select>
          </div>
        </div>
        <ul className="grid gap-1 hidden md:block">
          {navItems.map(item => (
            <li key={item.key}>
              <button
                onClick={()=>setActive(item.key)}
                className={
                  'w-full text-left px-3 py-2 rounded-lg text-sm transition ' +
                  (active===item.key
                    ? 'bg-slate-900 text-white'
                    : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200')
                }
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="min-w-0">
        {renderPanel()}
      </div>
    </div>
    </>
  )
}
