import react from '@vitejs/plugin-react'
import reviewplane from '@reviewplane/vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

export default defineConfig({
  root: path.dirname(fileURLToPath(import.meta.url)),
  plugins: [reviewplane(), react()],
})
