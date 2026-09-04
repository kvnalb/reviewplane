#!/usr/bin/env node
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)))

function write(dir, files) {
  rmSync(dir, { recursive: true, force: true })
  mkdirSync(dir, { recursive: true })
  for (const [relative, contents] of Object.entries(files)) {
    const absolute = join(dir, relative)
    mkdirSync(dirname(absolute), { recursive: true })
    writeFileSync(absolute, contents)
  }
}

write(join(root, 'vite-react'), {
  'package.json': JSON.stringify({
    name: 'fixture-vite-react',
    private: true,
    type: 'module',
    scripts: { dev: 'vite', build: 'tsc --noEmit && vite build', preview: 'vite preview' },
    dependencies: { react: '^19.0.0', 'react-dom': '^19.0.0' },
    devDependencies: {
      '@types/react': '^19.0.0',
      '@types/react-dom': '^19.0.0',
      '@vitejs/plugin-react': '^5.0.0',
      typescript: '~5.9.0',
      vite: '^7.0.0',
    },
  }, null, 2) + '\n',
  'index.html': `<!doctype html>
<html lang="en">
  <head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>Fixture Vite React</title></head>
  <body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body>
</html>
`,
  'tsconfig.json': JSON.stringify({ compilerOptions: { target: 'ES2022', lib: ['ES2022', 'DOM', 'DOM.Iterable'], module: 'ESNext', jsx: 'react-jsx', moduleResolution: 'Bundler', strict: true, noEmit: true, skipLibCheck: true }, include: ['src'] }, null, 2) + '\n',
  'vite.config.ts': `import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
})
`,
  'src/main.tsx': `import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
`,
  'src/vite-env.d.ts': `/// <reference types="vite/client" />\n`,
  'src/App.tsx': `export default function App() {
  return (
    <main>
      <h1>Fixture headline</h1>
      <p className="lede">Static paragraph for mapping coverage.</p>
      <ul>
        {['Alpha', 'Beta', 'Gamma'].map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <button type="button">Primary action</button>
    </main>
  )
}
`,
})

write(join(root, 'vite-swc-tailwind'), {
  'package.json': JSON.stringify({
    name: 'fixture-vite-swc-tailwind',
    private: true,
    type: 'module',
    scripts: { dev: 'vite', build: 'tsc -b && vite build' },
    dependencies: { react: '^19.0.0', 'react-dom': '^19.0.0' },
    devDependencies: {
      '@tailwindcss/vite': '^4.0.0',
      '@types/react': '^19.0.0',
      '@types/react-dom': '^19.0.0',
      '@vitejs/plugin-react-swc': '^4.0.0',
      typescript: '~5.9.0',
      vite: '^7.0.0',
    },
  }, null, 2) + '\n',
  'index.html': `<!doctype html>
<html lang="en">
  <head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>Fixture SWC Tailwind</title></head>
  <body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body>
</html>
`,
  'tsconfig.json': JSON.stringify({ compilerOptions: { target: 'ES2022', lib: ['ES2022', 'DOM', 'DOM.Iterable'], module: 'ESNext', jsx: 'react-jsx', moduleResolution: 'Bundler', strict: true, noEmit: true, skipLibCheck: true }, include: ['src'] }, null, 2) + '\n',
  'vite.config.ts': `import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [tailwindcss(), react()],
})
`,
  'src/index.css': `@import "tailwindcss";\n`,
  'src/main.tsx': `import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
`,
  'src/App.tsx': `export default function App() {
  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-3xl font-semibold tracking-tight">SWC and Tailwind fixture</h1>
      <p className="mt-3 text-slate-600">Class-string styling should still map through intrinsic elements.</p>
      <div className="mt-6 grid gap-3">
        {['One', 'Two', 'Three'].map((label) => (
          <article key={label} className="rounded-lg border border-slate-200 p-4">
            <h2 className="text-lg font-medium">{label}</h2>
            <p className="text-sm text-slate-500">Card body {label}</p>
          </article>
        ))}
      </div>
    </main>
  )
}
`,
})

write(join(root, 'vite-tailwind-radix'), {
  'package.json': JSON.stringify({
    name: 'fixture-vite-tailwind-radix',
    private: true,
    type: 'module',
    scripts: { dev: 'vite', build: 'tsc -b && vite build' },
    dependencies: {
      react: '^19.0.0',
      'react-dom': '^19.0.0',
      '@radix-ui/react-slot': '^1.2.0',
    },
    devDependencies: {
      '@tailwindcss/vite': '^4.0.0',
      '@types/react': '^19.0.0',
      '@types/react-dom': '^19.0.0',
      '@vitejs/plugin-react': '^5.0.0',
      typescript: '~5.9.0',
      vite: '^7.0.0',
    },
  }, null, 2) + '\n',
  'index.html': `<!doctype html>
<html lang="en">
  <head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>Fixture Tailwind Radix</title></head>
  <body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body>
</html>
`,
  'tsconfig.json': JSON.stringify({ compilerOptions: { target: 'ES2022', lib: ['ES2022', 'DOM', 'DOM.Iterable'], module: 'ESNext', jsx: 'react-jsx', moduleResolution: 'Bundler', strict: true, noEmit: true, skipLibCheck: true }, include: ['src'] }, null, 2) + '\n',
  'vite.config.ts': `import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [tailwindcss(), react()],
})
`,
  'src/index.css': `@import "tailwindcss";\n`,
  'src/main.tsx': `import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
`,
  'src/button.tsx': `import { Slot } from '@radix-ui/react-slot'
import type { ButtonHTMLAttributes } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }

export function Button({ asChild = false, className = '', ...props }: Props) {
  const Comp = asChild ? Slot : 'button'
  return <Comp className={\`inline-flex items-center rounded-md bg-slate-900 px-3 py-2 text-sm text-white \${className}\`} {...props} />
}
`,
  'src/App.tsx': `import { Button } from './button'

export default function App() {
  return (
    <main className="mx-auto max-w-3xl space-y-6 p-8">
      <header>
        <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Radix-style fixture</p>
        <h1 className="text-3xl font-semibold">shadcn-like primitives stay mappable</h1>
      </header>
      <section className="space-y-3">
        <p>Intrinsic wrappers around Slot-based buttons should still expose static copy.</p>
        <Button type="button">Continue review</Button>
      </section>
      <section className="grid gap-3 md:grid-cols-3">
        {['Density', 'Hierarchy', 'Contrast'].map((title) => (
          <article key={title} className="border border-slate-200 p-4">
            <h2 className="font-medium">{title}</h2>
            <p className="text-sm text-slate-600">Target group item</p>
          </article>
        ))}
      </section>
    </main>
  )
}
`,
})

if (!existsSync(join(root, 'vite-react/src/App.tsx'))) {
  throw new Error('fixture bootstrap failed')
}

console.log('Fixtures written under tests/fixtures')
