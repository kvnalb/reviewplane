# Fixtures

Disposable apps used to prove ReviewPlane install and mapping coverage without consuming the user's demo landing page.

| Fixture | Purpose |
| --- | --- |
| `vite-react` | Standard Vite React TypeScript app |
| `vite-swc-tailwind` | `@vitejs/plugin-react-swc` + Tailwind class strings |
| `vite-tailwind-radix` | Tailwind + Radix-style primitives (shadcn-like) |

Generate or refresh with `node tests/fixtures/bootstrap.mjs` when needed.
