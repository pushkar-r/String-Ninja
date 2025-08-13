import React, { useRef, useState } from 'react'
import ToolCard from '../components/ToolCard'
import Papa from 'papaparse'
import { marked } from 'marked'
import QRCode from 'qrcode'
import jsQR from 'jsqr'

export default function DataTools() {
  const [jsonText, setJsonText] = useState('')
  const [jsonOut, setJsonOut] = useState('')
  const [csvText, setCsvText] = useState('')
  const [csvJson, setCsvJson] = useState('')
  const [mdText, setMdText] = useState('')
  const [mdHtml, setMdHtml] = useState('')
  const [qrInput, setQrInput] = useState('')
  const [qrUrl, setQrUrl] = useState('')
  const fileInput = useRef<HTMLInputElement|null>(null)

  return (
    <div className="grid gap-6">
      <ToolCard title="JSON Formatter / Minifier">
        <textarea value={jsonText} onChange={e=>setJsonText(e.target.value)} placeholder='{ "hello": 1 }' className="w-full h-40 rounded-xl border p-3 font-mono text-xs dark:bg-slate-900" />
        <div className="flex flex-wrap gap-2">
          <button onClick={()=>{ try { setJsonOut(JSON.stringify(JSON.parse(jsonText), null, 2)) } catch { setJsonOut('Invalid JSON') } }} className="px-3 py-2 rounded-xl bg-slate-900 text-white">Format</button>
          <button onClick={()=>{ try { setJsonOut(JSON.stringify(JSON.parse(jsonText))) } catch { setJsonOut('Invalid JSON') } }} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">Minify</button>
        </div>
        <textarea readOnly value={jsonOut} className="w-full h-40 rounded-xl border p-3 font-mono text-xs dark:bg-slate-900" />
      </ToolCard>

      <ToolCard title="CSV ↔ JSON Converter">
        <textarea value={csvText} onChange={e=>setCsvText(e.target.value)} placeholder="CSV input…" className="w-full h-32 rounded-xl border p-3 font-mono text-xs dark:bg-slate-900" />
        <div className="flex flex-wrap gap-2">
          <button onClick={()=>{ const res = Papa.parse(csvText.trim(), { header: true }); setCsvJson(JSON.stringify(res.data, null, 2)) }} className="px-3 py-2 rounded-xl bg-slate-900 text-white">CSV → JSON</button>
          <button onClick={()=>{ try { const arr = JSON.parse(csvText); setCsvJson(Papa.unparse(arr)) } catch { setCsvJson('Invalid JSON') } }} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">JSON → CSV</button>
        </div>
        <textarea readOnly value={csvJson} className="w-full h-32 rounded-xl border p-3 font-mono text-xs dark:bg-slate-900" />
      </ToolCard>

      <ToolCard title="Markdown → HTML">
        <textarea value={mdText} onChange={e=>setMdText(e.target.value)} placeholder="Markdown…" className="w-full h-32 rounded-xl border p-3 font-mono text-xs dark:bg-slate-900" />
        <button onClick={()=> setMdHtml(marked.parse(mdText) as string)} className="px-3 py-2 rounded-xl bg-slate-900 text-white">Convert</button>
        <div className="rounded-xl border p-3 dark:bg-slate-900">
          <div dangerouslySetInnerHTML={{ __html: mdHtml }} />
        </div>
      </ToolCard>

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
    </div>
  )
}

<ToolCard title="HTML / CSS / JS Beautify & Minify">
  <textarea id="code-input" placeholder="Paste code (html/css/js)..." className="w-full h-40 rounded-xl border p-3 font-mono text-xs dark:bg-slate-900" />
  <div className="flex flex-wrap gap-2">
    <button onClick={async ()=>{ const el = document.getElementById('code-input') as HTMLTextAreaElement; const v = el.value; const out=beautifyCode(v,'js'); (document.getElementById('code-out') as HTMLTextAreaElement).value = out }} className="px-3 py-2 rounded-xl bg-slate-900 text-white">Beautify JS</button>
    <button onClick={async ()=>{ const el = document.getElementById('code-input') as HTMLTextAreaElement; const v = el.value; const out=beautifyCode(v,'css'); (document.getElementById('code-out') as HTMLTextAreaElement).value = out }} className="px-3 py-2 rounded-xl bg-slate-900 text-white">Beautify CSS</button>
    <button onClick={async ()=>{ const el = document.getElementById('code-input') as HTMLTextAreaElement; const v = el.value; const out=beautifyCode(v,'html'); (document.getElementById('code-out') as HTMLTextAreaElement).value = out }} className="px-3 py-2 rounded-xl bg-slate-900 text-white">Beautify HTML</button>
    <button onClick={async ()=>{ const el = document.getElementById('code-input') as HTMLTextAreaElement; const v = el.value; const out=await minifyCode(v,'js'); (document.getElementById('code-out') as HTMLTextAreaElement).value = out }} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">Minify JS</button>
    <button onClick={async ()=>{ const el = document.getElementById('code-input') as HTMLTextAreaElement; const v = el.value; const out=await minifyCode(v,'css'); (document.getElementById('code-out') as HTMLTextAreaElement).value = out }} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">Minify CSS</button>
    <button onClick={async ()=>{ const el = document.getElementById('code-input') as HTMLTextAreaElement; const v = el.value; const out=await minifyCode(v,'html'); (document.getElementById('code-out') as HTMLTextAreaElement).value = out }} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">Minify HTML</button>
  </div>
  <textarea id="code-out" readOnly className="w-full h-40 rounded-xl border p-3 font-mono text-xs dark:bg-slate-900" />
</ToolCard>

<ToolCard title="XML ↔ JSON">
  <div className="grid md:grid-cols-2 gap-3">
    <textarea id="xml-input" placeholder="XML input..." className="w-full h-32 rounded-xl border p-3 font-mono text-xs dark:bg-slate-900" />
    <textarea id="json-input-xml" placeholder="JSON input..." className="w-full h-32 rounded-xl border p-3 font-mono text-xs dark:bg-slate-900" />
  </div>
  <div className="flex flex-wrap gap-2">
    <button onClick={()=>{ const v = (document.getElementById('xml-input') as HTMLTextAreaElement).value; (document.getElementById('json-input-xml') as HTMLTextAreaElement).value = xmlToJson(v) }} className="px-3 py-2 rounded-xl bg-slate-900 text-white">XML → JSON</button>
    <button onClick={()=>{ const v = (document.getElementById('json-input-xml') as HTMLTextAreaElement).value; (document.getElementById('xml-input') as HTMLTextAreaElement).value = jsonToXml(v) }} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">JSON → XML</button>
  </div>
</ToolCard>

<ToolCard title="Unicode Normalizer">
  <textarea id="norm-in" placeholder="Text..." className="w-full h-28 rounded-xl border p-3 dark:bg-slate-900" />
  <div className="flex gap-2">
    <button onClick={()=>{ const v=(document.getElementById('norm-in') as HTMLTextAreaElement).value; (document.getElementById('norm-out') as HTMLTextAreaElement).value = normalizeText(v,'NFC') }} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">NFC</button>
    <button onClick={()=>{ const v=(document.getElementById('norm-in') as HTMLTextAreaElement).value; (document.getElementById('norm-out') as HTMLTextAreaElement).value = normalizeText(v,'NFD') }} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">NFD</button>
    <button onClick={()=>{ const v=(document.getElementById('norm-in') as HTMLTextAreaElement).value; (document.getElementById('norm-out') as HTMLTextAreaElement).value = normalizeText(v,'NFKC') }} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">NFKC</button>
    <button onClick={()=>{ const v=(document.getElementById('norm-in') as HTMLTextAreaElement).value; (document.getElementById('norm-out') as HTMLTextAreaElement).value = normalizeText(v,'NFKD') }} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">NFKD</button>
  </div>
  <textarea id="norm-out" readOnly className="w-full h-28 rounded-xl border p-3 dark:bg-slate-900" />
</ToolCard>
