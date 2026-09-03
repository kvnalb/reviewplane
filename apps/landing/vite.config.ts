import react from '@vitejs/plugin-react'
import reviewplane from '@reviewplane/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [reviewplane({ exclude: ['src/WebMcpProbe.tsx'] }), react()],
})
