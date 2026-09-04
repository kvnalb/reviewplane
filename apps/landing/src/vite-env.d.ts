/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_REVIEWPLANE_SANDBOX?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
