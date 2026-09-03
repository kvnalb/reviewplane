# Decision log

## Phase 0A

- Used the existing uppercase path `docs/BUILD_PLAN.MD` as authoritative. The requested lowercase path did not exist, and renaming it would conflict with the plan's required repository tree.
- Used the official `react-ts` template from `create-vite@9.2.0`. It generated Vite 8.2.2, React 19.2, TypeScript 6, and Oxlint.
- Standardized on Node 22.18.0 for local development, with an engine range of `>=22.12.0 <23`. Vite 8 requires Node 20.19+ or 22.12+.
- Assigned scoped workspace names under `@reviewplane/*` so npm can link every local package without `npm link`.
- Kept `packages/*` and the future skill directories as empty foundations. Product code and skill instructions belong to later phases.
