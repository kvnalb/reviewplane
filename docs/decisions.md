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

## Phase 0C

- Built the baseline in one normal implementation and verification cycle from the approved brief, design decision, `DESIGN.md`, and generation prompt. No ReviewPlane product runtime or WebMCP behavior was added early.
- Used self-hosted Fontsource packages for the approved Familjen Grotesk and IBM Plex families so the page does not depend on a third-party font request. Latin subsets keep the production bundle focused.
- Rendered the product explanation as CSS and inline SVG interface diagrams. They are explanatory previews, not screenshots or claims that the later overlay and handoff phases already work.
- Left the generated binary Vite hero asset in the source tree because the editing policy does not permit removing binary files with the patch workflow. It is unreferenced and absent from the production bundle; all text-based Vite starter assets were removed or replaced.
- The repository's eventual GitHub URL is not known, so the navigation labels it as “soon” instead of linking to an unrelated repository.
- Browser verification covered 1280 px desktop, 768 px tablet, and 390 px mobile layouts; primary navigation, preview-tool selection, batch expansion, command-copy feedback, skip-link targeting, focus styles, and console output were checked. No horizontal overflow or browser warnings/errors remained.

## Phase 1

- Implemented `wait_for_review` as a real, development-only WebMCP probe with a retained Promise resolver, execution cancellation handling, reload cleanup, and single-waiter enforcement.
- The first Codex in-app-browser test was blocked because its Chrome 151 surface did not expose `document.modelContext`. After the user enabled Chrome's WebMCP testing flag, the test moved to the user's Chrome 152 tab, where the API was present.
- Added a development-only deterministic host client around Chrome's documented `getTools()` and `executeTool()` APIs. It keeps model tool-choice evaluation separate from lifecycle verification and does not claim that every agent will select the tool.
- A Chrome execution remained pending for 138 seconds, resolved from Done, and returned to the same active Codex task. No host timeout occurred, so the primary Phase 1 acceptance path passed.
- Chrome 152 cancelled the `executeTool()` caller-facing promise but did not supply the documented execution `AbortSignal` to the registered callback. Kept single-waiter state plus unload cleanup, and deferred another cancellation check to the submission-browser end-to-end test.
- Changed simultaneous-waiter handling from throwing an exception to returning a structured `review_already_pending` result because Chrome masks callback exceptions behind a generic invocation error.

## Phase 2

- Implemented `@reviewplane/vite` as an `apply: 'serve'`, `enforce: 'pre'` Vite plugin so JSX is instrumented before React compilation and the plugin is absent from ordinary production builds.
- Used Babel's parser, traversal, node builders, and generator rather than string replacement. This preserves JSX/TSX syntax such as fragments, conditional rendering, CSS Module expressions, and Tailwind class strings.
- Derived each 10-character source ID from the normalized repository-relative path, one-based source location, intrinsic tag, and nearest enclosing component. The 16-character fingerprint separately hashes nearby normalized source plus attribute names so an agent can recover when edits shift line numbers.
- Added a small development runtime that gives every rendered DOM occurrence a distinct `data-rp-occurrence-id`. Instances produced by one `.map()` location share the source ID but receive monotonically distinct occurrence IDs.
- Excluded dependencies, build output, generated files, files outside the Vite root, and user-configured path patterns. The landing app explicitly excludes the Phase 1 probe because ReviewPlane must not instrument its own control surface.
- Added a no-cache development manifest endpoint with a revision counter. A real Vite hot update advanced the manifest revision from 2 to 4 while preserving the hero's correct `src/App.tsx:147:13`, `h1`, `App` mapping.
- Moved the WebMCP probe behind a development-only lazy import and its own stylesheet. The production bundle contains no ReviewPlane source attributes, occurrence runtime, manifest route, probe UI, or WebMCP registration strings.

## Phase 3

- Defined the correction domain in `@reviewplane/core` with discriminated unions for text, foreground color, background color, font size, and group instructions. Every correction carries source/runtime identity, route and viewport context, original/requested values, styles, ancestries, preview state, and stale-target state.
- Stored draft entries as correction data plus an active flag. Undo deactivates the latest or any named middle entry; preview values are regenerated from the captured baseline, so undo never depends on a fragile chain of inverse DOM mutations.
- Applied multiple text replacements from the end of the baseline string toward the beginning so earlier offsets remain valid. A replacement is skipped for a matching occurrence when its selected substring does not match that occurrence's baseline text.
- Persisted versioned draft and submitted state through a small `StorageLike` interface. Browser consumers can use `sessionStorage`; restricted storage failures do not crash the review surface.
- Submission deep-freezes the ready batch and its correction snapshot. Later acknowledgement creates a new frozen batch state rather than mutating the payload that an agent already received.
- Limited batch transitions to `ready -> applying -> applied | partial | failed`. Empty submission, duplicate drafts, invalid text offsets, missing targets, edits to undone corrections, and illegal transitions return explicit domain errors.
