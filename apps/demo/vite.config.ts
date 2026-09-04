import reviewplane from '@reviewplane/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [reviewplane({ sandbox: mode === 'sandbox' }), react()],
}))
