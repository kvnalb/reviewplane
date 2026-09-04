# ReviewPlane

Visual corrections for React + Vite. Select what looks wrong, stage a few changes, press Done once, and hand a structured batch to your coding agent.

## Quick start (consumer app)

```bash
npm install -D reviewplane @reviewplane/react @reviewplane/vite
npx reviewplane init
npm run dev
```

Ordinary production builds exclude ReviewPlane. Hosted sandbox is an explicit separate mode.

## Monorepo development

```bash
npm install
npm run build:packages
npm run dev
```

### Commands

| Command | Purpose |
| --- | --- |
| `npm run build:packages` | Compile `@reviewplane/*` and the `reviewplane` CLI to `dist/` |
| `npm run build` | Build packages + landing |
| `npm run build:sandbox --workspace @reviewplane/landing` | Hosted-sandbox landing build |
| `npm run test` | Unit tests |
| `npm run test:pack --workspace reviewplane` | Pack packages and init a disposable fixture app |
| `npm run test:e2e` | Playwright core flows |
| `npm run typecheck` | Typecheck workspaces |

## Packages

- `reviewplane` — CLI (`init`, `check`)
- `@reviewplane/core` — correction domain
- `@reviewplane/vite` — JSX source mapping plugin
- `@reviewplane/react` — overlay + WebMCP tools

## WebMCP tools

`wait_for_review`, `get_review_batch`, `get_correction`, `acknowledge_review`

Done never claims to wake an idle agent. If no agent is waiting, the overlay shows a copy/downloadable batch.

## Docs

- `docs/BUILD_PLAN.MD` — authoritative plan
- `docs/decisions.md` — decision log
- `docs/dogfood-recording-checklist.md` — human demo/recording handoff
- `docs/product-brief.md`, `docs/design-decision.md`, `apps/landing/DESIGN.md`

## License

MIT — see `LICENSE`.

## Publish / deploy gates

Public npm publish names/version/account and paid/DNS hosting decisions require explicit human approval after Phase 9 hardening.
