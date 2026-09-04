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

## Phase 4

- Replaced the baseline's simulated pricing-card playground with a live launcher because the strongest product proof is ReviewPlane reviewing its own landing page. The generated baseline remains preserved by the Phase 0C tag.
- Mounted the overlay through a React portal into a Shadow DOM host. Fixed-position controls and highlights do not alter consumer layout, and the landing app loads the package only behind `import.meta.env.DEV`.
- Chose `Alt+Shift+R` for inspect-mode toggling and a 25% target-area intersection threshold for lasso inclusion. Invisible targets and redundant mapped containers are excluded.
- Limited direct replacement to a mapped element with one direct text node. Nested or cross-element text becomes an instruction-only group with an explicit no-preview message.
- Browser acceptance uncovered two overlay hit-testing issues: Shadow DOM events need `composedPath()` checks, and a tall lasso popup could sit under the fixed toolbar. Popup input now suspends lasso capture, and popups/trays stack above the toolbar and avoid the tray's desktop column.
- Kept Done honest: it freezes and displays a ready payload but states that no idle agent wake-up is implied. WebMCP delivery belongs to Phase 5.

## Phase 5

- Moved WebMCP behavior into a shared bridge owned by `@reviewplane/react`. The overlay publishes its immutable submitted snapshot; the four tools retrieve or acknowledge the same store-backed batch.
- Split batch summary from correction detail to keep tool outputs compact. Human-authored outputs use `untrustedContentHint`; retrieval tools use `readOnlyHint`; correction text is clipped with an explicit truncation flag and group target lists are capped with a total count.
- Restored the latest submitted batch from session storage so `wait_for_review` can return an existing ready batch immediately after reload.
- Defined unresolved-only acknowledgement as `partial`, not `failed`. A batch becomes `failed` only when it has failures or a failure reason and no applied corrections.
- Chrome 152 returned callback objects from `executeTool()` as JSON strings. The development host test now parses that boundary before chaining `get_review_batch`, `get_correction`, and `acknowledge_review`.
- Reconfirmed Chrome's Phase 1 cancellation caveat: caller cancellation still does not provide the callback execution signal. Duplicate-wait protection, registration abort, and page-unload cleanup remain; this browser limitation is not presented as successful callback cancellation.

## Phase 6

- Added separate create-new and adopt-existing React skills because source ownership differs: a new app can shape its component/content boundaries, while adoption must preserve established tokens, localization, APIs, and data flow.
- Kept the canonical instructions in `skills/` and added lightweight discoverable copies under `.agents/skills/`. The copies point to the canonical file so the operational contract has one maintained source.
- Expanded `AGENTS.md` only with the skill locations and a concise fallback workflow; it remains the repository-wide contract when skill discovery is unavailable.
- The skill validator could not start because its own Python environment lacks PyYAML. Frontmatter and required fields were checked with Ruby's standard YAML parser instead; no skill package dependency was added to the product for a validator-only need.
- Ran the acceptance path through a real active Chrome `wait_for_review`: retrieved a JSX text replacement, a foreground-color correction, and a nine-target lasso instruction; traced them to `App.tsx` and `App.css`; applied one minimal patch; passed typecheck, lint, 22 tests, production build, and live visual inspection; then acknowledged all three exact IDs as applied.
- Kept the development host harness honest and reusable: it now waits and retrieves without auto-acknowledging. The acknowledgement control is enabled only after retrieval, so Codex can apply and validate source before recording success.

## Direction update before Phase 7 completion

- Reassigned the final dogfood take to the user. Phase 8 now prepares a fresh, untouched demo page; after Phase 9 hardening, Codex waits while the user performs and records the first live review, then applies that real batch.
- Raised installability from a cuttable item to a release requirement: versioned packages and `npx reviewplane init` must be ready for next-day use, while npm publication remains behind an explicit user approval gate.
- Expanded the supported fixture matrix to React 18 and 19, Vite React and React SWC, CSS Modules, Tailwind, and shadcn/Radix. Next.js remains a documented roadmap item.
- Made the primary experience vibe-coder-first: one setup command, no provenance or confidence UI, plain-language warnings, and copy/download fallback when WebMCP delivery is unavailable.

## Phase 7

- Published package boundaries now use version `0.1.0`, public publish metadata, compiled JavaScript, declaration files, and file allowlists. npm publication itself remains intentionally unperformed pending the release approval gate.
- Bundled the Vite plugin's Babel implementation into its development package while leaving Vite and `@reviewplane/core` external. This avoids asking every consumer to compile package TypeScript or resolve Babel internals and keeps the runtime absent from production builds.
- Made `reviewplane init` install the two SDK packages through the detected package manager on the normal path. Dry runs report the exact install action, repeated initialization is a no-op, and unfamiliar Vite config shapes still receive manual instructions.
- Kept `reviewplane check` as a diagnostic command but changed its default output to plain-language pass/fix messages; `--json` remains available for CI.
- Added copy and JSON-download actions after Done so a user without WebMCP can still hand the same structured batch to a coding agent.
- Exercised packed `0.1.0` artifacts in three clean external fixtures: React 18 + Vite React + CSS Modules, React 19 + Vite React SWC + Tailwind, and React 19 + Vite React + Radix/shadcn-style composition. Every fixture initialized, mapped its local JSX, submitted a real browser correction, exposed the fallback, built successfully, and excluded ReviewPlane from production.
- Did not add ESLint rules. The CLI already reports the three reliably detectable cases from this phase (`dangerouslySetInnerHTML`, canvas, and likely external ownership), so a second configuration surface would not improve the MVP setup path.

## Phase 8

- Updated the brief and `DESIGN.md` before generation so the fresh page reflects the approved vibe-coder-first direction: source provenance stays inside the agent batch, Done falls back to copy/download, and compatibility names the supported fixture matrix.
- Recorded the exact fresh-generation input in `docs/demo-generation-prompt.md`. The page was scaffolded from the official `create-vite@9.2.0` React TypeScript template and generated independently in `apps/demo`; it does not copy the original landing page implementation.
- Chose one visual risk from the frontend-design process: a dark correction margin interrupts the hero frame and receives a routed selection line. The rest of the page stays on a restrained proof-sheet grid to avoid both dashboard-card repetition and decorative graph paper.
- Installed ReviewPlane through the `0.1.0` release-candidate workspace packages and the real initializer. A second initializer run changed nothing.
- Added an explicit Vite sandbox option and demo build mode. The sandbox build includes mapping and the overlay; the ordinary production build contains neither. The public surface explains that it cannot edit the repository.
- Added a submitted-review reset path that restores text and style previews before starting a fresh hosted review. Acknowledged cloned reviews keep the source-rendered result instead.
- Browser verification inspected only page rendering, semantics, and sandbox loading. No ReviewPlane target was selected on `apps/demo`, no correction or batch was created, no tool was invoked, and no recording sequence was rehearsed.

## Phase 9

- Added a nine-scenario Playwright suite covering activation, targeting, text and style previews, lasso review, undo/reset, fallback submission, a pending WebMCP handoff, reload and stale-target behavior, narrow viewports, keyboard access, production exclusion, and source-mapping coverage.
- Source mapping exceeds the 90 percent gate in both the dedicated fixture and the untouched Phase 8 demo. The demo check only counts mapped visible DOM; it does not select targets or rehearse the recording scene.
- Kept the automated WebMCP bridge mocked for determinism. The real Chrome lifecycle was already verified in Phases 1, 5, and 6; the next real end-to-end use is intentionally the user's unrehearsed dogfood/recording gate.
- Added a root README with literal clean-clone commands, the one-command initializer path, supported compatibility scope, production/sandbox boundaries, and the honest constraint that ReviewPlane cannot wake an idle coding agent.
- Initial Playwright setup exposed and fixed an incorrect fixture root and a closed-tray test assumption. A later port failure was sandbox permission-only; the permitted rerun passed all nine tests in 10.6 seconds.
- Reused the Phase 7 packed-package compatibility evidence for React 18/19, React/SWC, CSS Modules, Tailwind, and Radix/shadcn composition. No product code affecting that matrix changed in Phase 9.
- The first human-gate attempt exposed a sandbox-only gap: the build included mapped DOM and the overlay, but the manifest existed only as development middleware. Sandbox builds now emit `__reviewplane/manifest.json`; ordinary production builds still do not activate the plugin. This was fixed before the recording take and without interacting with the demo content.
- At the human gate, replaced example placeholders in direct-edit fields with the selected element's exact computed foreground color, background color, and font size. Staging still compares against those computed values, so untouched prefilled fields do not create no-op corrections.
- Added native color pickers beside the exact CSS color text, preserving transparent and advanced values that a native opaque picker cannot represent. Font size now uses an 8–120 px slider with a visible exact-value readout.
