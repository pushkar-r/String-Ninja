import React, { useRef, useState } from 'react'
import ToolCard from '../components/ToolCard'
import CopyButton from '../components/CopyButton'
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
  const [active, setActive] = useState<'json'|'csv'|'md'|'qr'|'code'|'xml'|'norm'>('json')

  // States preserved from original implementation
  const [jsonText, setJsonText] = useState('')
  const [jsonOut, setJsonOut] = useState('')
  const [csvText, setCsvText] = useState('')
  const [csvJson, setCsvJson] = useState('')
  const [mdText, setMdText] = useState('')
  const [mdHtml, setMdHtml] = useState('')
  const [qrInput, setQrInput] = useState('')
  const [qrUrl, setQrUrl] = useState('')
  const fileInput = useRef<HTMLInputElement|null>(null)

  const navItems: { key: typeof active, label: string }[] = [
    { key: 'json', label: 'JSON Formatter / Minifier' },
    { key: 'csv', label: 'CSV ↔ JSON Converter' },
    { key: 'md', label: 'Markdown → HTML' },
    { key: 'qr', label: 'QR Code Tools' },
    { key: 'code', label: 'Beautify / Minify' },
    { key: 'xml', label: 'XML ↔ JSON' },
    { key: 'norm', label: 'Unicode Normalizer' },
  ]

  function renderPanel(){
    switch (active) {
      case 'json':
        return (
          <ToolCard title="JSON Formatter / Minifier">
            <textarea value={jsonText} onChange={e=>setJsonText(e.target.value)} placeholder='{ "hello": 1 }' className="w-full h-40 rounded-xl border p-3 font-mono text-xs dark:bg-slate-900" />
            <div className="flex flex-wrap gap-2">
              <button onClick={()=>{ try { setJsonOut(JSON.stringify(JSON.parse(jsonText), null, 2)) } catch (e) { setJsonOut(describeJsonError(jsonText, e)) } }} className="px-3 py-2 rounded-xl bg-slate-900 text-white">Format</button>
              <button onClick={()=>{ try { setJsonOut(JSON.stringify(JSON.parse(jsonText))) } catch (e) { setJsonOut(describeJsonError(jsonText, e)) } }} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">Minify</button>
            </div>
            <div className="relative"><textarea readOnly value={jsonOut} className="w-full h-40 rounded-xl border p-3 font-mono text-xs dark:bg-slate-900 pr-12" /><div className="absolute top-2 right-2"><CopyButton value={jsonOut} /></div></div>
          </ToolCard>
        )
      case 'csv':
        return (
          <ToolCard title="CSV ↔ JSON Converter">
            <textarea value={csvText} onChange={e=>setCsvText(e.target.value)} placeholder="CSV input…" className="w-full h-32 rounded-xl border p-3 font-mono text-xs dark:bg-slate-900" />
            <div className="flex flex-wrap gap-2">
              <button onClick={()=>{ const res = Papa.parse(csvText.trim(), { header: true }); setCsvJson(JSON.stringify(res.data, null, 2)) }} className="px-3 py-2 rounded-xl bg-slate-900 text-white">CSV → JSON</button>
              <button onClick={()=>{ try { const arr = JSON.parse(csvText); setCsvJson(Papa.unparse(arr)) } catch { setCsvJson('Invalid JSON') } }} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">JSON → CSV</button>
            </div>
            <div className="relative"><textarea readOnly value={csvJson} className="w-full h-32 rounded-xl border p-3 font-mono text-xs dark:bg-slate-900 pr-12" /><div className="absolute top-2 right-2"><CopyButton value={csvJson} /></div></div>
          </ToolCard>
        )
      case 'md':
        return (
          <ToolCard title="Markdown → HTML">
            <textarea value={mdText} onChange={e=>setMdText(e.target.value)} placeholder="Markdown…" className="w-full h-32 rounded-xl border p-3 font-mono text-xs dark:bg-slate-900" />
            <button onClick={()=> setMdHtml(marked.parse(mdText) as string)} className="px-3 py-2 rounded-xl bg-slate-900 text-white">Convert</button>
            <div className="rounded-xl border p-3 dark:bg-slate-900">
              <div dangerouslySetInnerHTML={{ __html: mdHtml }} />
            </div>
          </ToolCard>
        )
      case 'qr':
        return (
          <ToolCard title="QR Code Generator & Scanner">
            <div className="grid md:grid-cols-2 gap-3">
              <div className="grid gap-2">
                <input value={qrInput} onChange={e=>setQrInput(e.target.value)} placeholder="Text or URL…" className="w-full rounded-xl border p-3 dark:bg-slate-900" />
                <button onClick={async ()=> setQrUrl(await QRCode.toDataURL(qrInput || ''))} className="px-3 py-2 rounded-xl bg-slate-900 text-white">Generate</button>
                {qrUrl && <img src={qrUrl} alt="QR" className="w-40 h-40 border rounded-xl" />}
              </div>
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
                    setQrInput(code?.data || 'No QR found')
                  }
                  img.src = url
                }} />
              </div>
            </div>
          </ToolCard>
        )
      case 'code':
        return (
          <ToolCard title="HTML / CSS / JS Beautify & Minify">
            <textarea id="code-input" placeholder="Paste code (html/css/js)..." className="w-full h-40 rounded-xl border p-3 font-mono text-xs dark:bg-slate-900" />
            <div className="flex flex-wrap gap-2">
              <button onClick={async () => { const el = document.getElementById('code-input') as HTMLTextAreaElement; const v = el.value; const out = beautifyCode(v, 'js'); (document.getElementById('code-out') as HTMLTextAreaElement).value = out }} className="px-3 py-2 rounded-xl bg-slate-900 text-white">Beautify JS</button>
              <button onClick={async () => { const el = document.getElementById('code-input') as HTMLTextAreaElement; const v = el.value; const out = beautifyCode(v, 'css'); (document.getElementById('code-out') as HTMLTextAreaElement).value = out }} className="px-3 py-2 rounded-xl bg-slate-900 text-white">Beautify CSS</button>
              <button onClick={async () => { const el = document.getElementById('code-input') as HTMLTextAreaElement; const v = el.value; const out = beautifyCode(v, 'html'); (document.getElementById('code-out') as HTMLTextAreaElement).value = out }} className="px-3 py-2 rounded-xl bg-slate-900 text-white">Beautify HTML</button>
              <button onClick={async () => { const el = document.getElementById('code-input') as HTMLTextAreaElement; const v = el.value; const out = await minifyCode(v, 'js'); (document.getElementById('code-out') as HTMLTextAreaElement).value = out }} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">Minify JS</button>
              <button onClick={async () => { const el = document.getElementById('code-input') as HTMLTextAreaElement; const v = el.value; const out = await minifyCode(v, 'css'); (document.getElementById('code-out') as HTMLTextAreaElement).value = out }} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">Minify CSS</button>
              <button onClick={async () => { const el = document.getElementById('code-input') as HTMLTextAreaElement; const v = el.value; const out = await minifyCode(v, 'html'); (document.getElementById('code-out') as HTMLTextAreaElement).value = out }} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">Minify HTML</button>
            </div>
            <div className="relative"><textarea id="code-out" readOnly className="w-full h-40 rounded-xl border p-3 font-mono text-xs dark:bg-slate-900 pr-12" /><div className="absolute top-2 right-2"><CopyButton getValue={()=> (document.getElementById('code-out') as HTMLTextAreaElement)?.value || ''} /></div></div>
          </ToolCard>
        )
      case 'xml':
        return (
          <ToolCard title="XML ↔ JSON">
            <div className="grid md:grid-cols-2 gap-3">
              <div className="relative"><textarea id="xml-input" placeholder="XML input..." className="w-full h-32 rounded-xl border p-3 font-mono text-xs dark:bg-slate-900 pr-12" /><div className="absolute top-2 right-2"><CopyButton getValue={()=> (document.getElementById('xml-input') as HTMLTextAreaElement)?.value || ''} /></div></div>
              <div className="relative"><textarea id="json-input-xml" placeholder="JSON input..." className="w-full h-32 rounded-xl border p-3 font-mono text-xs dark:bg-slate-900 pr-12" /><div className="absolute top-2 right-2"><CopyButton getValue={()=> (document.getElementById('json-input-xml') as HTMLTextAreaElement)?.value || ''} /></div></div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => { const v = (document.getElementById('xml-input') as HTMLTextAreaElement).value; (document.getElementById('json-input-xml') as HTMLTextAreaElement).value = xmlToJson(v) }} className="px-3 py-2 rounded-xl bg-slate-900 text-white">XML → JSON</button>
              <button onClick={() => { const v = (document.getElementById('json-input-xml') as HTMLTextAreaElement).value; (document.getElementById('xml-input') as HTMLTextAreaElement).value = jsonToXml(v) }} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">JSON → XML</button>
            </div>
          </ToolCard>
        )
      case 'norm':
        return (
          <ToolCard title="Unicode Normalizer">
            <textarea id="norm-in" placeholder="Text..." className="w-full h-28 rounded-xl border p-3 dark:bg-slate-900" />
            <div className="flex gap-2">
              <button onClick={() => { const v = (document.getElementById('norm-in') as HTMLTextAreaElement).value; (document.getElementById('norm-out') as HTMLTextAreaElement).value = normalizeText(v, 'NFC') }} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">NFC</button>
              <button onClick={() => { const v = (document.getElementById('norm-in') as HTMLTextAreaElement).value; (document.getElementById('norm-out') as HTMLTextAreaElement).value = normalizeText(v, 'NFD') }} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">NFD</button>
              <button onClick={() => { const v = (document.getElementById('norm-in') as HTMLTextAreaElement).value; (document.getElementById('norm-out') as HTMLTextAreaElement).value = normalizeText(v, 'NFKC') }} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">NFKC</button>
              <button onClick={() => { const v = (document.getElementById('norm-in') as HTMLTextAreaElement).value; (document.getElementById('norm-out') as HTMLTextAreaElement).value = normalizeText(v, 'NFKD') }} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">NFKD</button>
            </div>
            <div className="relative"><textarea id="norm-out" readOnly className="w-full h-28 rounded-xl border p-3 dark:bg-slate-900 pr-12" /><div className="absolute top-2 right-2"><CopyButton getValue={()=> (document.getElementById('norm-out') as HTMLTextAreaElement)?.value || ''} /></div></div>
          </ToolCard>
        )
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-[260px_1fr]">
      <div className="bg-white dark:bg-slate-950 rounded-2xl p-3 shadow-sm border border-slate-200 dark:border-slate-800 h-fit sticky top-24">
        <div className="text-sm font-semibold px-2 pb-2">Data Tools</div>
        <ul className="grid gap-1">
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
  )
}
