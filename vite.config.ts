import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'

export default defineConfig(({ mode }) => {
  const repo = (process.env.GITHUB_REPOSITORY || '').split('/')[1] || 'String-Ninja'
  const base = mode === 'production' ? `/${repo}/` : '/'
  return {
    base,
    plugins: [react(), wasm(), topLevelAwait()],
  }
})
