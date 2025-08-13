import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'

export default defineConfig({
  // Ensure correct asset and router base when deploying to https://<user>.github.io/String-Ninja/
  base: '/String-Ninja/',
  plugins: [react(), wasm(), topLevelAwait()]
})
