import React from 'react'
import { Link } from 'react-router-dom'
import Head from '../components/Head'
import toolCatalog from '../data/toolCatalog.json'

type ToolItem = {
  slug: string
  name: string
  category: string
  appPath: string
  summary: string
}

const tools = toolCatalog as ToolItem[]
const categories = ['Encoding', 'Strings', 'Compare', 'Security', 'Data', 'Misc']

export default function ToolsHub() {
  return (
    <>
      <Head
        title="All Developer Tools - String Ninja"
        description="Browse all String Ninja features with dedicated tool pages, practical examples, common mistakes, and direct links to each tool."
        canonical="https://stringninja.in/tools"
      />
      <article className="max-w-5xl mx-auto grid gap-6">
        <header className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6">
          <h1 className="text-2xl md:text-3xl font-bold">All Tools</h1>
          <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
            Browse every String Ninja feature with dedicated landing pages designed for search indexing and quick workflow entry.
            Each tool page includes what it does, common mistakes, examples, and direct access to the live utility.
          </p>
        </header>

        {categories.map((category) => {
          const grouped = tools.filter((tool) => tool.category === category)
          if (!grouped.length) return null
          return (
            <section key={category} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6">
              <h2 className="text-xl font-semibold mb-4">{category}</h2>
              <ul className="grid gap-3 md:grid-cols-2">
                {grouped.map((tool) => (
                  <li key={tool.slug} className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                    <Link to={`/tools/${tool.slug}`} className="font-semibold underline text-emerald-700 dark:text-emerald-400">
                      {tool.name}
                    </Link>
                    <p className="mt-2 text-sm text-slate-700 dark:text-slate-300 leading-6">{tool.summary}</p>
                    <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">In-app route: {tool.appPath}</div>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </article>
    </>
  )
}
