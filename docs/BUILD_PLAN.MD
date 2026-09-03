# ReviewPlane MVP Build Plan

## Instructions for Codex

Treat this document as the authoritative implementation plan. Read it completely before changing the repository.

Execute one phase at a time. Do not begin the next phase until:

1. The current acceptance gate passes.
2. You report the evidence.
3. The user approves continuation when the phase contains a human approval gate.

At the end of each phase:

- Run the specified checks.
- Inspect the rendered interface when browser behavior changed.
- Record deviations and failed assumptions in `docs/decisions.md`.
- Report files changed, commands run, test results, and unresolved risks.
- Commit accepted work with a message beginning `phase-N:`.

When implementation assumptions conflict with linked primary documentation, follow the documentation and record the change. Do not invent WebMCP methods or claim browser-agent behavior that has not been tested.

---

## I. Product contract

ReviewPlane is a development layer for React frontends.

A human selects text or draws a rectangular selection over rendered elements, stages several corrections, and presses **Done** once. ReviewPlane sends a structured review batch to a coding agent with source references and browser context. The coding agent edits the real repository, runs validation, and lets Vite rerender the page.

ReviewPlane has four responsibilities:

1. Map rendered elements to their JSX or TSX source.
2. Capture text and rectangular multi-element selections.
3. Manage staged corrections and temporary browser previews.
4. Expose review batches to a browser agent through WebMCP.

ReviewPlane does not rewrite source files. The coding agent remains responsible for understanding the repository, choosing the correct implementation, editing source, and validating the result.

### Supported MVP target

- React
- TypeScript
- Vite
- JSX and TSX
- Static text
- Text supplied through ordinary component props
- CSS
- CSS Modules
- Tailwind class strings
- Inline styles
- Chrome with WebMCP enabled
- In-app browsers that expose a page’s WebMCP tools

### Explicit non-goals

- Next.js support
- Vue or Svelte adapters
- Canvas and WebGL interfaces
- Cross-origin iframe inspection
- CMS or API writes
- Drag-and-drop layout building
- Automatic component replacement
- Automatic design-token discovery or editing
- Support for every generated React pattern
- Waking a completely idle external agent through an API that WebMCP does not define

---

## II. Fixed MVP interaction rules

Do not expand these rules without recording a product decision.

### A. Immediate previews

ReviewPlane previews only:

1. Text replacement
2. Foreground color
3. Background color
4. Font size

Color and font-size previews use temporary CSS rules. Text previews temporarily modify one mapped text node.

ReviewPlane must label these states as previews because the React source remains unchanged until the coding agent applies the batch.

### B. Text-selection boundary

A direct text replacement must remain within one mapped text element.

The correction records:

- Original element text
- Selected substring
- Start and end offsets
- Replacement text
- Source ID
- Runtime occurrence ID
- Text fingerprint
- Route and viewport

If a selection crosses several mapped elements, ReviewPlane creates a natural-language instruction containing the selected text and target elements. It does not attempt a direct text preview.

### C. Rectangular-selection boundary

A rectangular selection identifies several mapped elements and attaches one instruction, such as:

> Reduce the density of these cards and emphasize failures.

ReviewPlane highlights the selected targets and stages the instruction. It does not invent or preview a semantic redesign.

### D. Scope choices

The MVP exposes two scopes:

- **This element:** the selected rendered occurrence.
- **Matching instances:** every rendered element originating from the same instrumented JSX location.

ReviewPlane does not expose component-wide or global-token scopes.

The coding agent may decide to implement a correction through an existing component, content source, CSS rule, or design token after inspecting the repository.

### E. Done behavior

Done has two valid outcomes.

#### Waiting agent

1. Done freezes the current corrections into an immutable batch.
2. ReviewPlane resolves the pending `wait_for_review` WebMCP execution.
3. The agent continues the same turn.
4. The agent retrieves the corrections and edits the repository.

#### No waiting agent

1. Done freezes the current corrections into an immutable batch.
2. ReviewPlane stores the batch as ready.
3. ReviewPlane displays the structured payload.
4. An agent that connects later may retrieve the batch.

The page must never claim that Done started a new idle agent turn.

### F. Hosted and cloned modes

#### Hosted sandbox

Visitors can select, preview, stage, and inspect a review batch. Corrections remain inside the browser session and cannot modify the public repository.

#### Cloned developer mode

The user opens the cloned repository in Codex or another compatible coding-agent host. A waiting agent receives the review batch, edits source, validates the result, and rerenders the local page.

---

# Phase 0A: Create the repository foundation

Use npm workspaces and the official Vite React TypeScript starter.

Do not use:

- A SaaS starter
- A dashboard template
- An authentication template
- A database starter
- A prebuilt product architecture

Primary references:

- Vite getting started: https://vite.dev/guide/
- npm workspaces: https://docs.npmjs.com/cli/using-npm/workspaces/

Create:

```text
reviewplane/
├── apps/
│   └── landing/
├── packages/
│   ├── core/
│   ├── react/
│   ├── vite/
│   └── cli/
├── skills/
│   ├── reviewplane-create-react/
│   └── reviewplane-adopt-react/
├── tests/
│   └── e2e/
├── docs/
│   ├── BUILD_PLAN.MD
│   └── decisions.md
├── AGENTS.md
├── LICENSE
└── package.json
```

Scaffold the landing application:

```bash
npm create vite@latest apps/landing -- --template react-ts
```

Use TypeScript and ESM throughout.

Add root commands for:

```bash
npm run dev
npm run build
npm run typecheck
npm run test
npm run test:e2e
```

Record a Node version supported by the installed Vite release in:

- `.nvmrc`
- `package.json#engines`

Do not generate the landing-page content during this phase.

## Phase 0A acceptance gate

- A clean root `npm install` succeeds.
- `npm run dev` serves the default Vite application.
- `npm run build` succeeds.
- `npm run typecheck` succeeds.
- Workspace packages resolve without `npm link`.
- No ReviewPlane product implementation exists yet.

## Phase 0A human approval gate

Stop after reporting the acceptance results.

Do not begin Phase 0B until the user approves the repository foundation.

---

# Phase 0B: Prepare and approve the baseline-generation inputs

The baseline must represent a serious attempt to generate a high-quality landing page with current agentic-development practices.

It must not come from a generic “build a landing page” prompt.

Create:

```text
docs/product-brief.md
docs/design-decision.md
docs/baseline-generation-prompt.md
apps/landing/DESIGN.md
```

## A. Product brief

Draft `docs/product-brief.md` with:

- ReviewPlane’s intended users
- The concrete workflow problem
- Product positioning
- Primary value proposition
- Required landing-page sections
- Intended information hierarchy
- Copy goals
- Claims the page may and may not make
- Required interactions
- Installation path
- Supported and unsupported cases
- Responsive requirements
- Accessibility expectations
- Technical constraints

The copy should explain the actual workflow rather than rely on vague claims about AI productivity.

## B. Design-language research

Use these resources as possible inputs:

- Curated `DESIGN.md` files: https://github.com/VoltAgent/awesome-design-md
- UI design principles and examples: https://www.learnui.design/

Review several plausible visual directions for a developer tool.

For each serious candidate, record:

- Typography character
- Color system
- Density
- Layout principles
- Component treatment
- Motion principles
- Suitability for an interactive developer tool
- Risks of looking derivative
- Implementation cost

Write the comparison and recommendation in `docs/design-decision.md`.

Do not copy another company’s identity wholesale. Adapt the chosen principles into a ReviewPlane-specific design language.

## C. Approved `DESIGN.md`

Create `apps/landing/DESIGN.md` with:

- Visual theme
- Color roles and exact values
- Typography scale
- Font choices and fallbacks
- Spacing scale
- Grid and maximum widths
- Buttons and interactive states
- Cards and surfaces
- Borders and radii
- Elevation
- Navigation
- Inspector and correction-tray styling
- Responsive behavior
- Motion timing
- Accessibility constraints
- Design anti-patterns
- Examples of desired composition

## D. Baseline-generation prompt

Write the exact prompt Codex will receive in `docs/baseline-generation-prompt.md`.

The prompt must reference:

- `docs/product-brief.md`
- `docs/design-decision.md`
- `apps/landing/DESIGN.md`
- Any approved screenshots or visual references
- The React and- and Vite-based technical constraints
- Required build and verification commands

The prompt should allow Codex to inspect its work, run the application, correct functional defects, and complete its normal verification loop.

## Phase 0B acceptance gate

- Every required document exists.
- The product brief contains concrete copy and information requirements.
- The design decision compares several plausible alternatives.
- `DESIGN.md` defines a coherent system rather than a list of adjectives.
- The baseline prompt references all approved inputs.
- No landing-page generation has begun.

## Phase 0B human approval gate

Present the following to the user:

1. Product-brief summary
2. Design alternatives considered
3. Recommended design language
4. Full `DESIGN.md`
5. Exact baseline-generation prompt

Stop and wait.

Do not generate the baseline until the user explicitly approves the brief, design language, and prompt.

---

# Phase 0C: Generate and freeze the baseline landing page

After approval, ask Codex to build the complete landing page from the approved artifacts.

Allow the agent to:

- Inspect repository conventions
- Implement the page
- Run the development server
- Inspect the rendered result
- Fix functional defects
- Fix responsive breakage
- Fix accessibility failures
- Run build and typechecking
- Complete its normal verification loop

Do not:

- Starve the agent of context
- Request intentionally generic copy
- Introduce artificial defects
- Interrupt generation to manufacture a worse result
- Make manual aesthetic edits after the agent finishes
- Send targeted repair prompts after the agent declares completion

When Codex reports completion, freeze the result.

The residual issues should arise despite the strong prompt and approved design language. These issues form the authentic ReviewPlane baseline.

Commit and tag the result:

```bash
git tag baseline-agent-generated
```

## Phase 0C acceptance gate

- The implementation uses the approved product brief and `DESIGN.md`.
- The page works at desktop and mobile widths.
- Build and typechecking pass.
- Codex completed a normal implementation and verification cycle.
- No manual aesthetic cleanup followed completion.
- No targeted copy, typography, hierarchy, or composition repair prompt followed completion.
- The baseline has a named commit and tag.

---

# Phase 1: Test the WebMCP handoff

Resolve the main integration risk before building the review interface.

Determine whether the target browser agent can keep a WebMCP execution pending and resume after the human presses Done.

Read:

- WebMCP specification: https://webmachinelearning.github.io/webmcp/
- Chrome WebMCP overview: https://developer.chrome.com/docs/ai/webmcp
- Chrome WebMCP security guidance: https://developer.chrome.com/docs/ai/webmcp/secure-tools

Create a small probe inside the landing application.

Register `wait_for_review` using:

```js
document.modelContext.registerTool(...)
```

Its `execute` callback should return a promise. Retain the resolver until a temporary Done button resolves it.

Test in the real target environment:

1. Open the page.
2. Verify that the browser agent discovers `wait_for_review`.
3. Invoke the tool.
4. Leave it pending for at least two minutes.
5. Press Done.
6. Verify that the same agent turn resumes.
7. Invoke the tool again and cancel it.
8. Verify that the execution `AbortSignal` fires.
9. Reload the page during a pending execution.
10. Record the resulting behavior.
11. Attempt a second simultaneous waiter.
12. Confirm that the app rejects it with a clear response.

Feature-detect `document.modelContext`.

When unavailable, show:

> WebMCP is unavailable in this browser.

Do not crash or silently simulate tool registration.

Chrome currently documents this local-development flag:

```text
chrome://flags/#enable-webmcp-testing
```

Record the browser version, host, timeout behavior, cancellation behavior, and results in:

```text
docs/webmcp-host-test.md
```

## Phase 1 acceptance gate

Proceed only after documenting one of these outcomes:

- A pending WebMCP execution resolves after Done and the agent continues the same turn.
- The host imposes a known timeout and bounded repeated waits preserve the intended interaction.

If the target coding-agent host cannot discover page tools, stop and report the blocker. Do not simulate the source-editing handoff.

---

# Phase 2: Instrument rendered elements with source references

Build `packages/vite` as a development Vite plugin.

Read:

- Vite Plugin API: https://vite.dev/guide/api-plugin.html
- Babel plugin documentation: https://babeljs.io/docs/plugins/

Use a Vite `transform` hook before React compilation to inspect:

- `.jsx`
- `.tsx`

Exclude:

- `node_modules`
- Build output
- ReviewPlane’s overlay
- Generated files
- Explicit user-configured exclusions

Instrument intrinsic DOM elements with a compact development attribute:

```tsx
<h1 data-rp-source-id="a84f29c201">
  Review agent-built interfaces
</h1>
```

Create source IDs from:

- Normalized repository-relative file path
- Source location
- Element tag
- Enclosing component

Maintain a development manifest:

```ts
type SourceRecord = {
  id: string;
  file: string;
  line: number;
  column: number;
  tag: string;
  component?: string;
  fingerprint: string;
};
```

Treat line and column as hints. Include nearby source characteristics in the fingerprint so the coding agent can recover after another correction shifts line numbers.

Expose the current manifest through a local Vite endpoint:

```text
/__reviewplane/manifest.json
```

Ensure ordinary production builds contain no:

- `data-rp-source-id`
- Source file paths
- ReviewPlane manifest endpoint
- ReviewPlane overlay
- ReviewPlane WebMCP tools

Add transform tests for:

- Plain JSX
- TypeScript JSX
- Nested elements
- Fragments
- Conditional rendering
- Repeated markup inside `.map()`
- CSS Modules
- Tailwind class strings
- Excluded files
- Hot reload

## Phase 2 acceptance gate

- Selecting a fixture element yields the correct file, line, tag, and enclosing component.
- Repeated rendered elements share a source ID but receive distinguishable runtime occurrence IDs.
- Hot reload refreshes the manifest.
- Transform tests pass.
- A production build contains no `data-rp-source-id` strings.

---

# Phase 3: Implement the correction domain

Build framework-independent schemas and state in `packages/core`.

Define explicit unions:

```ts
type ReviewScope =
  | "element"
  | "matching-instances";

type Correction =
  | TextReplacementCorrection
  | ForegroundColorCorrection
  | BackgroundColorCorrection
  | FontSizeCorrection
  | GroupInstructionCorrection;

type ReviewBatch = {
  id: string;
  createdAt: string;
  route: string;
  viewport: {
    width: number;
    height: number;
  };
  correctionIds: string[];
  status:
    | "draft"
    | "ready"
    | "applying"
    | "applied"
    | "partial"
    | "failed";
};
```

Each correction must contain:

- Stable correction ID
- Source record
- Runtime occurrence ID
- Original value
- Requested value
- Scope
- Route
- Viewport
- Relevant computed styles
- Component ancestry
- DOM ancestry
- Selected text and offsets when applicable
- Optional human instruction
- Preview status
- Stale-target status

Store drafts in memory and `sessionStorage` so hot reload does not destroy the active review.

Freeze submitted batches so later UI actions cannot change what the agent received.

Several corrections may target one element. Store a baseline and recompute previews by replaying active corrections from that baseline.

Do not implement undo as a chain of unrelated inverse mutations.

## Phase 3 acceptance gate

Unit tests cover:

- Create
- Edit
- Remove
- Undo
- Middle-item undo
- Reset
- Submit
- Restore after reload
- Acknowledge
- Stale targets
- Invalid state transitions

---

# Phase 4: Build the selection and review interface

Build `packages/react` as an overlay that does not alter application layout.

Read:

- React `createPortal`: https://react.dev/reference/react-dom/createPortal
- Selection API: https://developer.mozilla.org/en-US/docs/Web/API/Selection
- Range geometry: https://developer.mozilla.org/en-US/docs/Web/API/Range/getBoundingClientRect
- Element hit testing: https://developer.mozilla.org/en-US/docs/Web/API/Document/elementsFromPoint

Mount the controls in an isolated overlay host.

Use a Shadow DOM boundary where practical so application styles do not leak into the inspector. Exclude the overlay from selection and source instrumentation.

## A. Inspect mode

Implement:

- Toolbar activation
- Documented keyboard shortcut
- Stable hover outlines
- Component breadcrumb
- Element tag
- Source file and line
- Clear mode-exit behavior

Disable application clicks while inspect or lasso mode captures input.

## B. Text selection

Use the browser Selection and Range APIs.

Open the direct-edit popup only when a non-collapsed selection belongs to one mapped text element.

Expose:

- Replacement text
- Foreground color
- Background color
- Font size
- Scope: this element or matching instances
- Add Correction
- Cancel

If the selection crosses mapped elements:

- Show the selected targets.
- Show an instruction field.
- Do not expose direct replacement controls.
- Do not claim to preview the rewrite.

## C. Rectangular selection

Use pointer events to draw the selection rectangle.

Compare it with visible instrumented elements’ bounding boxes.

Implement:

- Documented intersection threshold
- Invisible-element exclusion
- Overlay exclusion
- Redundant nested-target removal
- Selected-target list
- Individual target removal
- Freeform instruction field
- Add Correction
- Cancel

## D. Correction tray

The tray must support:

- Pending correction count
- Concise summaries
- Edit
- Undo
- Remove
- Reset all
- Done
- Connection status
- Stale-target status

## E. Preview engine

### Color and font-size previews

For foreground color, background color, and font size:

1. Add a temporary `data-rp-preview-id` to the runtime occurrence.
2. Generate a rule in:

```html
<style id="reviewplane-preview-styles">
```

3. Regenerate the stylesheet when corrections change.
4. Remove the runtime attribute and rule during reset.
5. Reapply matching-instance previews to each mapped occurrence.

### Text previews

For text replacement:

1. Store the original text-node value.
2. Store the selected offsets.
3. Store the source ID and runtime occurrence path.
4. Store a surrounding-text fingerprint.
5. Replace the selected substring in the live text node.
6. Restore the baseline before replaying active corrections.
7. Reapply the preview after React rerenders only when the fingerprint matches.
8. Mark the correction stale when the target cannot be recovered safely.

React may overwrite temporary DOM text during a rerender. Use a `MutationObserver` and one scheduled animation-frame reconciliation.

Avoid recursive mutation loops.

### Lasso previews

Group instructions receive:

- Persistent target highlighting
- Target list
- Tray entry

They do not receive speculative visual previews.

## F. Geometry and motion

Implement these rules:

- Clamp popups to the viewport.
- Place a popup below the selection when space permits.
- Flip it above the selection when necessary.
- Recalculate position on scroll and resize.
- Preserve native text selection while the popup stays open.
- Animate opacity and transform for approximately 100 to 150 milliseconds.
- Avoid spring motion.
- Avoid layout-shifting entrances.
- Avoid controls appearing at arbitrary page locations.
- Keep the correction tray anchored in one stable location.

## Phase 4 acceptance gate

A user can:

1. Select text.
2. Replace it.
3. Change its foreground color, background color, or size.
4. Stage another text correction.
5. Lasso several elements.
6. Attach one group instruction.
7. View all corrections in the tray.
8. Remove the middle correction.
9. Submit the remaining batch.

Popups remain anchored during scrolling and resizing.

Cross-element selections and stale targets produce honest fallback states.

---

# Phase 5: Register the WebMCP review tools

Register these imperative tools:

```text
wait_for_review
get_review_batch
get_correction
acknowledge_review
```

Use the API shapes defined by the current WebMCP specification.

Add a local TypeScript declaration for `document.modelContext` only when the installed DOM types do not provide one. Keep the declaration aligned with the specification.

## Tool behavior

### `wait_for_review`

- Allow one active waiter.
- Resolve when Done freezes a ready batch.
- Return an existing ready batch without waiting.
- Listen to the execution `AbortSignal`.
- Release abandoned resolvers.
- Return clear states for cancellation and duplicate waiters.

### `get_review_batch`

Return:

- Batch ID
- Status
- Route
- Viewport
- Summary
- Correction IDs

### `get_correction`

Return one correction with:

- Target
- Source hint
- Original value
- Requested value
- Scope
- Relevant context
- Human instruction

### `acknowledge_review`

Record:

- Applied corrections
- Unresolved corrections
- Failed corrections
- Validation summary
- Optional failure reason

## Output limits and security

Chrome’s WebMCP security guidance recommends concise tool descriptions and outputs, including approximately:

- 500 characters per tool description
- 150 characters per parameter description
- 30 characters per tool or parameter name
- 1.5K characters per individual output

Return a compact batch summary and correction IDs first. Let the agent retrieve corrections individually.

Mark tools returning human-authored text with:

```ts
untrustedContentHint: true
```

Apply:

```ts
readOnlyHint: true
```

to retrieval tools where appropriate.

Do not expose tools to arbitrary cross-origin callers.

Done must interact with the correction store:

```text
Done
  -> freeze batch
  -> if waiter exists, resolve it
  -> otherwise persist batch as ready
  -> show accurate connection status
```

Done must not call a nonexistent “start agent” API.

Create a mock `document.modelContext` for automated tests. Repeat the acceptance flow in the real supported browser.

## Phase 5 acceptance gate

The complete bridge works:

1. The agent calls `wait_for_review`.
2. The human stages several corrections.
3. The human presses Done.
4. The agent receives the batch summary.
5. The agent retrieves each correction.
6. The agent acknowledges the outcome.

Cancellation, reload, duplicate waiters, unavailable WebMCP, and Done without an agent produce understandable states.

---

# Phase 6: Define how Codex applies a review

Create:

```text
skills/reviewplane-create-react/SKILL.md
skills/reviewplane-adopt-react/SKILL.md
```

Add repository-local copies in the skill location supported by the current Codex environment.

Keep `AGENTS.md` as the fallback operating contract.

The skills must tell Codex to:

1. Start or locate the Vite development server.
2. Verify that ReviewPlane is active.
3. Verify that its WebMCP tools are available.
4. Call `wait_for_review`.
5. Retrieve the complete batch after Done.
6. Treat source locations as evidence rather than permanent truth.
7. Inspect the canonical source for each requested value.
8. Group compatible corrections into a minimal patch.
9. Run typechecking, linting, relevant tests, and build.
10. Acknowledge applied, unresolved, and failed corrections separately.
11. Let Vite rerender.
12. Report the result.
13. Reenter the review loop when requested.

Codex should determine whether a value comes from:

- JSX literal
- Component prop
- Content module
- Localization key
- CSS declaration
- Tailwind class
- Design token
- API response
- Dynamic expression

ReviewPlane communicates the desired result. Codex chooses the source-level implementation.

## Scope semantics for Codex

### This element

Edit instance-specific content or data when a stable instance-specific source exists.

If one rendered occurrence comes from shared code without stable instance-specific data, report the ambiguity.

### Matching instances

Edit the shared JSX, component style, class, or content source that produced those instances.

## Phase 6 acceptance gate

Starting from an active `wait_for_review` call, Codex can:

1. Receive several corrections.
2. Locate the relevant source.
3. Apply the changes.
4. Run validation.
5. Acknowledge the batch.
6. Produce a correct live rerender.

At least one test batch must contain:

- Text replacement
- Color or font-size correction
- Lasso instruction

---

# Phase 7: Build installation and compatibility checks

Build `packages/cli` with:

```bash
npx reviewplane init
npx reviewplane check
```

## `reviewplane init`

Implement:

- React and Vite detection
- Package-manager detection
- Required package installation or exact install instructions
- Vite-plugin configuration
- Repository-local skill installation
- Bounded `AGENTS.md` insertion
- `--dry-run`
- Idempotency
- Manual fallback instructions for unsupported Vite configuration shapes

Do not attempt to rewrite arbitrary build systems.

## `reviewplane check`

Report:

- React detection
- Vite-plugin detection
- Overlay availability
- WebMCP availability
- Source-manifest coverage
- Unsupported dynamic content
- Externally owned content
- Stale mappings
- Production-bundle exclusion

## Linting

Add custom ESLint rules only for failures the implementation can identify reliably.

Reasonable initial rules include:

- Forbid manually authored `data-rp-*` attributes.
- Warn that `dangerouslySetInnerHTML` cannot receive normal text mapping.
- Warn that canvas-rendered text cannot receive normal DOM mapping.

Follow the ESLint custom-rule API:

https://eslint.org/docs/latest/extend/custom-rules

## External-package test

Test packed packages outside the monorepo:

1. Run `npm pack`.
2. Create a fresh Vite React application.
3. Install the package tarballs.
4. Run `reviewplane init`.
5. Start the application.
6. Complete one review batch.
7. Produce a production build.
8. Confirm that production excludes ReviewPlane.

npm package-testing and publishing reference:

https://docs.npmjs.com/creating-and-publishing-scoped-public-packages/

## Phase 7 acceptance gate

A clean external React and Vite application can install the packed SDK, complete the review loop, and produce a production build without ReviewPlane code.

---

# Phase 8: Dogfood ReviewPlane on its own landing page

Return to the frozen baseline landing page.

Use ReviewPlane to correct genuine residual problems. Do not script artificial defects.

The dogfood pass must include:

1. Rewrite weak hero copy through text selection.
2. Correct a real font-size ratio.
3. Change a foreground or background color.
4. Select and shorten another piece of copy.
5. Lasso a repeated section.
6. Add a hierarchy or density instruction.
7. Show several corrections in the tray.
8. Press Done once.
9. Let Codex edit the React source.
10. Show the source diff.
11. Show the live rerender.

Commit and tag the agent-applied result:

```bash
git tag reviewplane-edited
```

## Landing-page requirements

The public landing page should contain:

- One-sentence positioning
- A **Start reviewing this page** action
- The interactive ReviewPlane experience
- Correction tray
- Payload viewer for visitors without a waiting agent
- Before-and-after comparison backed by the real baseline
- Clone instructions
- SDK installation instructions
- Demo video
- Supported-scope table
- GitHub link

## Hosted sandbox mode

Add an explicit hosted sandbox build mode.

It may include ReviewPlane in the deployed landing page, but:

- Corrections remain in the visitor’s browser.
- Done cannot mutate the public repository.
- Done displays the structured batch when no agent waits.
- Reset restores the canonical page.
- The interface explains the difference between sandbox and cloned mode.

Default consumer production builds must exclude ReviewPlane.

## Phase 8 acceptance gate

- ReviewPlane has improved its own baseline landing page.
- The before state comes from the tagged agent-generated baseline.
- The after state comes from a real ReviewPlane batch applied by Codex.
- The public sandbox works without repository write access.
- The cloned mode supports the real source-editing loop.

---

# Phase 9: Test the complete product path

Use Playwright for browser behavior.

Reference:

https://playwright.dev/docs/test-webserver

Configure Playwright to launch the Vite development server through `webServer`.

Automate:

- Overlay activation
- Hover targeting
- Text selection
- Popup placement
- Text preview
- Foreground-color preview
- Background-color preview
- Font-size preview
- Rectangular selection
- Lasso target removal
- Correction staging
- Middle-item undo
- Reset
- Done without an agent
- Mock WebMCP submission
- Hot-reload restoration
- Stale-target behavior
- Production exclusion
- Narrow viewport behavior
- Keyboard navigation

Manually test the real WebMCP flow in the intended submission environment.

A mocked tool bridge does not satisfy the real-browser gate.

## Release gate

- A clean clone works by following the README literally.
- A fresh external Vite app works with packed SDK packages.
- At least 90 percent of ordinary visible static DOM targets map correctly in both fixtures.
- Several corrections reach the agent in one batch.
- Ambiguous targets produce warnings.
- Stale targets produce warnings.
- Agent changes survive reload because they exist in source.
- Default production builds contain no ReviewPlane runtime or source metadata.
- The hosted sandbox cannot mutate the repository.
- The complete demo flow can be performed reliably several times.

---

# Phase 10: Prepare the public submission

Review the current requirements before submitting:

- OpenAI challenge page: https://openai.com/webmcp-challenge/
- Devpost requirements: https://webmcp.devpost.com/

The repository must include:

- All required source code
- Assets
- Open-source license
- Clean-clone instructions
- SDK installation instructions
- Supported and unsupported cases
- WebMCP tool documentation
- Security and privacy notes
- Live application URL
- Public demo-video URL

The current Devpost requirements call for:

- A working public URL
- A public source repository
- An open-source license
- Actual `document.modelContext.registerTool(...)` usage
- A project description
- A public YouTube demo under three minutes
- Audio in the demo

Verify these requirements again on the day of submission.

## Demo-video structure

The video must establish that the baseline came from a serious agentic workflow, then spend most of its runtime on ReviewPlane.

### 0:00 to 0:12: Frame the problem

Explain that a detailed prompt and design system can produce a plausible frontend while leaving copy and visual decisions the user still wants to change.

### 0:12 to 0:25: Show the product brief

Show a sped-up view of `docs/product-brief.md`.

The voiceover should establish that Codex received real product context rather than a generic request to build a landing page.

### 0:25 to 0:40: Show the design decision

Show:

- Candidate design references
- The selected `DESIGN.md`
- The decision record
- The user approving the direction

If an agent helped compare the alternatives, show that comparison.

Keep this section visual and compressed.

### 0:40 to 0:55: Show baseline generation

Show Codex receiving:

- Product brief
- `DESIGN.md`
- Exact baseline prompt
- Technical requirements

Speed up the implementation and verification footage.

End on the unedited page Codex considered complete.

### 0:55 to 1:08: Identify the residual problem

Point to:

- One weak phrase
- One typography or color decision
- One grouped layout or hierarchy issue

Do not frame the entire page as a failure. The page should appear plausible while still benefiting from human judgment.

### 1:08 to 1:58: Edit with ReviewPlane

Show the human:

1. Selecting and rewriting copy.
2. Changing font size or color.
3. Selecting another text fragment.
4. Drawing a rectangle around several elements.
5. Adding a group instruction.
6. Reviewing the accumulated tray.

### 1:58 to 2:18: Submit the review

Press Done once.

Show Codex receiving the structured batch without another prose prompt.

### 2:18 to 2:38: Apply the source changes

Show Codex:

- Locating the relevant source
- Editing the React files
- Running focused validation
- Producing a readable diff

### 2:38 to 2:50: Show the result

Return to the rerendered landing page.

Compare the result with the tagged baseline.

### 2:50 to 2:58: Show how to try it

Show:

```bash
git clone <repository-url>
cd reviewplane
npm install
npm run dev
```

Display the live URL and repository URL.

The sped-up preparation demonstrates that the baseline received strong inputs. Keep it under one minute so the ReviewPlane interaction, WebMCP handoff, source edit, and rerender remain the video’s main subject.

---

# III. MVP cut line

The submission requires:

- Accurate React and Vite source mapping
- Text selection
- Rectangular selection
- Text preview
- Foreground-color preview
- Background-color preview
- Font-size preview
- Several staged corrections
- Honest Done behavior
- A real WebMCP review batch
- A coding agent applying the batch to source
- The dogfooded landing page
- A clean-clone path
- A live hosted sandbox
- A public repository
- An open-source license
- A demo video

If time becomes constrained, cut work in this order:

1. Public npm publication
2. Automatic rewriting of unfamiliar Vite configurations
3. Custom ESLint rules
4. Broad compatibility reporting
5. Additional styling controls

Do not cut the central demonstration:

> The human edits the rendered page, stages several precise corrections, presses Done once, and the coding agent changes the real React source.