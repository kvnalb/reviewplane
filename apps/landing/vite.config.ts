import react from '@vitejs/plugin-react'
import reviewplane from '@reviewplane/vite'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const sandbox = env.VITE_REVIEWPLANE_SANDBOX === 'true' || process.env.VITE_REVIEWPLANE_SANDBOX === 'true'

  return {
    plugins: [
      reviewplane({
        mode: sandbox ? 'sandbox' : 'development',
        exclude: ['src/WebMcpProbe.tsx'],
      }),
      react(),
    ],
    define: {
      'import.meta.env.VITE_REVIEWPLANE_SANDBOX': JSON.stringify(sandbox ? 'true' : 'false'),
    },
  }
})
