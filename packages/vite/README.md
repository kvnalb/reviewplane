# `@reviewplane/vite`

> **Early release:** ReviewPlane `0.1.0` is experimental software. It may contain bugs or behave unexpectedly with unsupported React or Vite configurations.

Development-only Vite instrumentation for ReviewPlane.

```ts
import react from '@vitejs/plugin-react'
import reviewplane from '@reviewplane/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    reviewplane({ exclude: ['src/reviewplane-overlay/**'] }),
    react(),
  ],
})
```

The plugin runs before React compilation and only while Vite is serving the application. It adds a stable `data-rp-source-id` to intrinsic JSX elements, assigns each rendered occurrence a distinct `data-rp-occurrence-id`, and serves source records at `/__reviewplane/manifest.json`.

Exclusions accept normalized path fragments, `*`/`**` patterns, or regular expressions. Dependencies, build output, generated directories, `*.generated.tsx`/`*.gen.tsx`, and files marked with `@generated` are excluded by default.
