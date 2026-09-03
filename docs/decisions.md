# Decision log

## Phase 0A

- Used the existing uppercase path `docs/BUILD_PLAN.MD` as authoritative. The requested lowercase path did not exist, and renaming it would conflict with the plan's required repository tree.
- Used the official `react-ts` template from `create-vite@9.2.0`. It generated Vite 8.2.2, React 19.2, TypeScript 6, and Oxlint.
- Standardized on Node 22.18.0 for local development, with an engine range of `>=22.12.0 <23`. Vite 8 requires Node 20.19+ or 22.12+.
- Assigned scoped workspace names under `@reviewplane/*` so npm can link every local package without `npm link`.
- Kept `packages/*` and the future skill directories as empty foundations. Product code and skill instructions belong to later phases.

## Phase 0B

- Consolidated the Phase 0A and Phase 0B human review gates at the user's request. Phase 0A was accepted and committed before Phase 0B began; the next human pause covers the complete baseline-generation input package.
- Compared dark product chrome, editorial markup, and light technical proof-sheet directions. Selected the proof-sheet direction because it visually separates the reviewed page from ReviewPlane's dark overlay and derives its signature from selection geometry and source mapping.
- Used the Awesome DESIGN.md collection and Learn UI Design as research inputs, not templates. No external identity, proprietary font, layout, or copy is copied wholesale.
- No screenshot is an approved baseline input. The approved-candidate references are the written comparison in `docs/design-decision.md` and the ReviewPlane-specific tokens in `apps/landing/DESIGN.md`.
- Added a dated alternatives analysis to the product brief using official sources for v0, Lovable, stagewise, Onlook, and React Grab. The analysis treats stagewise as the closest documented end-to-end substitute and avoids claiming that visual selection or source mapping is unique to ReviewPlane.
- Revised the landing-page copy using Joanna Wiebe's Stripe Atlas guide. The brief now defines one primary reader, one idea, one promise, and one offer; leads with the source-hunting problem; keeps sentences to one job; and places specific actions after the relevant explanation. The claims boundary remains unchanged.
