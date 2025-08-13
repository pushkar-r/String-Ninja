import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'

export default defineConfig(({ mode }) => ({
  // Use root base in dev for localhost, and subpath in production for GitHub Pages
  base: mode === 'production' ? '/String-Ninja/' : '/',
  plugins: [react(), wasm(), topLevelAwait()]
}))
