# Release gate evidence

Automated checks for Phase 9. Real Chrome WebMCP with the testing flag remains a manual submission gate.

## Commands

```bash
npm install
npm run build:packages
npm run typecheck
npm run test
npm run test:pack --workspace reviewplane
npm run test:e2e
npm run build --workspace @reviewplane/landing
npm run build:sandbox --workspace @reviewplane/landing
```

## Expected results

| Check | Evidence |
| --- | --- |
| Packages build/pack | `dist/` exports + `npm pack` tarballs |
| External init | Pack smoke configures vite + overlay with no hand-edits |
| Mapping coverage | Fixture tests ≥90% intrinsic JSX |
| Production exclusion | Ordinary landing/consumer builds omit `data-rp-source-id` / WebMCP tools |
| Hosted sandbox | `build:sandbox` includes overlay; cannot mutate the public repo |
| Playwright core flows | Overlay activate, text stage, Done without agent, mock waiter, undo/reset, narrow viewport |
| Agent skills | Installed by `reviewplane init` under `.agents/skills` |

## Manual remaining gates

1. Real-browser WebMCP wait → Done → resume in the submission host.
2. User-operated dogfood/recording (`docs/dogfood-recording-checklist.md`).
3. Public npm publish names/version/account approval.
4. Paid/DNS deploy approval for the hosted sandbox URL.
