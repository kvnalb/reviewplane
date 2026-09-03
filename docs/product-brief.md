# ReviewPlane landing-page product brief

## Product in one sentence

ReviewPlane turns corrections marked on a running React page into one source-aware batch for a coding agent.

## Intended users

The primary user is a developer, designer, product manager, or founder reviewing a React interface produced with a coding agent. They can recognize what feels wrong in the rendered page, but translating every visual judgment into file names, selectors, component names, and separate prose prompts slows the review loop.

A secondary user is a coding agent operating inside a cloned ReviewPlane repository or a React and Vite project that has adopted the SDK. The agent needs structured evidence that connects human intent to the likely source while preserving responsibility for the final source-level decision.

## The concrete workflow problem

Frontend review currently loses information at the handoff:

1. A person notices weak copy, an incorrect color, or a dense group of cards in the browser.
2. They describe the problem in chat, often without a precise source location or the computed browser state.
3. The coding agent searches for the target, guesses whether the change applies once or everywhere, and asks follow-up questions.
4. The person repeats this process for each correction.

ReviewPlane keeps the review anchored to the rendered interface. The person selects text or draws a rectangle, stages several corrections, and presses **Done** once. The batch includes source hints, runtime context, scope, and requested values. A waiting coding agent retrieves the batch through WebMCP, inspects the canonical source, applies a minimal patch, validates it, and lets Vite rerender the page.

## Positioning

ReviewPlane is a development layer for React frontends, not a visual page builder and not an autonomous source rewriter. Its role ends at communicating a precise, structured review. The coding agent still interprets the repository and owns the implementation.

## Current state of the art and existing alternatives

Reviewed on September 3, 2026. This comparison uses each project's official documentation or repository and is intentionally scoped to visible product capabilities. The category changes quickly, and the absence of a documented feature does not establish that no private or newly released implementation exists.

Current tools converge on one useful principle: pointing at the rendered interface carries more context than describing it from memory. They diverge on what happens next. Hosted builders tend to apply visual edits inside their own managed environment; integrated agentic IDEs combine the browser, repository, and agent; lightweight overlays copy source context into an existing agent workflow. ReviewPlane focuses on a fourth workflow: accumulate several corrections in the running application, freeze them into one structured batch, and let a compatible external coding agent decide how to modify and validate the canonical source.

| Alternative | Current strength | Boundary relative to ReviewPlane |
|---|---|---|
| [v0 Design Mode](https://v0.dev/docs/quickstart) | A user can select preview elements, adjust styles or give natural-language instructions, and apply the result back to source as a new project version. This provides a tight visual-edit loop inside v0's hosted project workflow. | v0 owns the generation and revision environment. ReviewPlane is intended for an existing React and Vite repository and communicates a review batch to a compatible coding-agent host rather than requiring the page to live in one builder. |
| [Lovable Visual Edits](https://docs.lovable.dev/changelog?page=1) | Visual Edits support direct text and multi-element editing, plus margins, padding, borders, shadows, colors, icons, and images. Lovable also connects selected elements to its code and agent surfaces. | Lovable applies edits within the Lovable project environment and offers a broader application-building product. ReviewPlane keeps its browser preview deliberately narrow and delegates all durable source edits to the coding agent. |
| [stagewise](https://docs.stagewise.io/) | The current open-source agentic IDE combines a browser engine, DOM-element selection, design previews, repository access, agents, terminal tools, and diff review. Among documented alternatives, it is the closest end-to-end substitute for browser-grounded agent editing. | stagewise is an integrated IDE and agent environment. ReviewPlane is a smaller development layer designed to expose review tools from the page itself through WebMCP, allowing the compatible host agent to remain the source editor. |
| [Onlook](https://www.onlook.ai/for/react) | Onlook treats real React components as the design canvas and writes visual or AI-assisted changes back to the repository. It supports broader composition, styling, and design-system work than ReviewPlane's MVP. | Onlook is a visual editor for directly authoring the application. ReviewPlane is a review-and-handoff layer: it captures requested outcomes and evidence without becoming the source-writing visual editor. |
| [React Grab](https://github.com/aidenybai/react-grab) | React Grab provides a lightweight development overlay that resolves a selected element to source and component context, then copies that context for Codex, Claude Code, Cursor, or another agent. Its primitives also expose hit testing and source-context hooks. | React Grab optimizes one selected element's context transfer. ReviewPlane extends the review unit to several staged corrections, temporary previews, explicit scope, rectangular group instructions, immutable batches, and an imperative WebMCP retrieval and acknowledgement flow. |

### Positioning implication

ReviewPlane should not claim that visual element selection, source mapping, or agent-assisted UI editing is new. The defensible distinction is the combination and boundary of responsibilities:

- The human reviews the real rendered page and stages several corrections before submitting.
- ReviewPlane preserves source hints, runtime occurrences, computed browser context, scope, and preview state in one immutable batch.
- The browser does not make durable source edits.
- A compatible coding agent retrieves corrections individually, verifies the repository, applies a minimal patch, runs validation, and acknowledges partial or failed outcomes honestly.
- Hosted sandbox mode remains useful without pretending it can mutate the public repository or wake an idle agent.

This section should guide product decisions and submission language. The public landing page does not need a competitor logo wall or superiority table; it should demonstrate the differentiated workflow directly and use measured language when comparison is necessary.

## Primary value proposition

Mark several corrections where you see them. Give your coding agent one batch with the context to find and fix each target.

## Information hierarchy

The page should answer five questions in this order:

1. **What is it?** A rendered-page review layer for React and coding agents.
2. **Can I understand it by using it?** Yes; the visitor can start reviewing the landing page itself.
3. **What happens after Done?** A waiting agent receives the batch; otherwise the browser displays the payload.
4. **How does it reach source?** Instrumented JSX supplies source hints, while the agent verifies the canonical value.
5. **Can I use it in my project?** Yes, for the supported React and Vite development path, with explicit limits.

The live review experience is the page's main proof. Architecture, compatibility, installation, and trust details support that proof rather than competing with it.

## Copy goals

- Address the developer reviewing the page as **you**. Start instructions with the action they can take.
- Describe visible actions and concrete outputs: select text, draw around elements, stage corrections, press Done, inspect the batch, and edit source.
- Give each sentence one job. Split the human action, ReviewPlane handoff, and agent action into separate sentences.
- Use **review**, **stage corrections**, **Done**, **batch**, **source hint**, and **coding agent** consistently.
- Distinguish temporary browser previews from persisted source changes.
- Explain hosted sandbox and cloned developer mode before asking the visitor to choose between them.
- Keep headings specific enough to explain the product. Do not trade meaning for a three-word slogan.
- Avoid generic claims about accelerating creativity, transforming development, or making work effortless.

These rules adapt the [Stripe Atlas landing-page copy guide](https://stripe.com/guides/atlas/landing-page-copy): focus on the visitor, match an emerging market's awareness level, keep one idea per sentence, name the specific pain, and place an action after the argument has earned it.

### One reader, idea, promise, and offer

- **One reader:** a developer reviewing a React interface produced with a coding agent.
- **One big idea:** the rendered page can carry the review context that gets lost in a prose prompt.
- **One promise:** stage several corrections and hand the agent one batch with targets, source hints, scope, and browser context.
- **One offer:** start reviewing the landing page itself.

ReviewPlane defines an emerging workflow, so the hero should begin with the familiar problem rather than terms such as WebMCP, runtime occurrence, or source manifest. Introduce those terms only after the visitor sees the selection-to-correction path.

### Required core copy

- Audience line: **For developers reviewing React interfaces with a coding agent.**
- Positioning line: **Mark what you want changed without hunting through the component tree.**
- Supporting line: **Select text, adjust a visible style, or draw around a group. ReviewPlane packages your corrections with source hints and browser context, ready for your coding agent.**
- Primary action: **Start reviewing this page**
- Secondary action: **Inspect a sample batch**
- Objection line: **You can mark a supported target even if you do not know which file or class produced it.**
- Done explanation: **Done freezes the corrections you staged. A waiting agent receives the batch; otherwise, ReviewPlane shows you the payload.**
- Hosted-mode notice: **Preview changes in this tab. The public sandbox cannot edit the repository.**
- Cloned-mode notice: **Work from a clone to let a waiting coding agent edit source, run checks, and trigger Vite's rerender.**

### Required section copy

#### Problem

- Heading: **“Make this card tighter” leaves your coding agent guessing.**
- Body: **You can see the weak phrase, wrong color, or crowded group. A chat prompt can omit the target, scope, and browser state.**

#### Workflow

- Heading: **Move from rendered element to validated source.**
- **Select:** **Point to the exact text or elements that need work.**
- **Stage:** **Preview supported changes and keep adding corrections.**
- **Done:** **Freeze the review into one immutable batch.**
- **Apply:** **Your coding agent checks the source, edits it, and runs validation.**

#### Handoff anatomy

- Heading: **Give the agent the target, request, scope, and runtime context.**
- Body: **ReviewPlane returns a compact batch summary first. The agent retrieves each correction before editing the repository.**

#### Modes

- Heading: **Know what Done can do here.**
- Hosted: **In the public sandbox, Done displays your batch in this tab. Your corrections stay in the browser session.**
- Cloned: **In a clone, Done resolves an active `wait_for_review` call. The same agent turn can inspect the batch and edit source.**

#### Installation

- Heading: **Add ReviewPlane to a React and Vite project.**
- Body: **Run the initializer, verify the integration, then start your existing development server.**

#### Supported scope

- Heading: **Use ReviewPlane where source mapping stays honest.**
- Body: **The MVP targets visible React DOM rendered from JSX or TSX. Ambiguous and stale targets produce warnings instead of guessed edits.**

#### Trust

- Heading: **The browser previews. Your coding agent edits source.**
- Body: **ReviewPlane sends requested outcomes and supporting evidence. Your agent still reads the repository, chooses the implementation, and validates the result.**

#### Closing action

- Heading: **Review the page before you write another repair prompt.**
- Body: **Start with one phrase, add the remaining corrections, then press Done once.**
- Primary action: **Start reviewing this page**
- Secondary action: **Clone on GitHub**

## Claims the page may make

- ReviewPlane maps supported rendered React elements to instrumented JSX or TSX source hints during development.
- A person can stage several supported corrections and submit them as one immutable review batch.
- Supported previews include text replacement, foreground color, background color, and font size.
- Rectangular selections can attach one natural-language instruction to several mapped targets.
- A waiting compatible browser agent can retrieve a batch through registered WebMCP tools after the real host flow has passed its acceptance test.
- The hosted sandbox keeps corrections in the browser session and cannot modify the public repository.
- Default consumer production builds exclude ReviewPlane runtime code and source metadata after this is verified by the production-exclusion tests.

Claims about WebMCP handoff and production exclusion must be presented as implementation goals until their corresponding phases pass. The baseline page may explain the intended workflow, but it must label unverified behavior honestly.

## Claims the page may not make

- Done starts, wakes, or creates an idle coding-agent turn.
- ReviewPlane directly rewrites source files.
- Every rendered React pattern maps perfectly to source.
- ReviewPlane supports Next.js, Vue, Svelte, canvas, WebGL, cross-origin iframes, or CMS and API writes in the MVP.
- Temporary previews are already saved to the repository.
- The public hosted sandbox can change the public repository.
- The product automatically discovers or edits every design token.
- ReviewPlane eliminates the need for developer review or validation.

## Required landing-page sections

1. **Navigation:** ReviewPlane wordmark, Workflow, Scope, Install, GitHub, and one **Start reviewing** action.
2. **Hero:** required audience, positioning, and supporting lines; primary and secondary actions; and an interactive product composition showing a selection connected to a correction tray.
3. **Live self-review sandbox:** toolbar, selectable page content, correction tray, connection status, reset, Done, and a payload viewer for visitors without a waiting agent. Before ReviewPlane is implemented, the baseline may use a clearly labeled nonfunctional product illustration; it must not fake successful tool behavior.
4. **Workflow:** four ordered actions, **Select → Stage → Done → Apply**, with one sentence explaining the responsibility at each step.
5. **Handoff anatomy:** show the compact batch summary first, followed by a single correction with target, source hint, requested value, scope, and context.
6. **Before and after:** reserve a truthful comparison region. The baseline side must eventually come from the `baseline-agent-generated` tag and the after side from the real dogfood batch. Before those artifacts exist, label the region as pending rather than inventing evidence.
7. **Hosted versus cloned modes:** compare what happens after Done and who can edit source.
8. **Installation:** clone commands for this repository plus the planned SDK path using `npx reviewplane init` and `npx reviewplane check`. Unpublished commands must be labeled as local or forthcoming until the CLI exists.
9. **Supported scope:** a compact supported/unsupported table matching the MVP contract.
10. **Demo video:** reserve a clear media region for the public, sub-three-minute video. Use an honest placeholder until the video exists.
11. **Trust notes:** development-only instrumentation, session-local hosted corrections, source hints rather than permanent truth, and no arbitrary cross-origin tool exposure.
12. **Closing action and footer:** clone the repository, open GitHub, license, and concise project status.

## Required interactions

- The **Start reviewing this page** action activates the real ReviewPlane inspect flow when available.
- Navigation links scroll to their matching sections and preserve visible keyboard focus.
- The workflow composition should remain understandable without animation.
- Copy buttons for installation commands provide visible success feedback when implemented.
- The before-and-after control must work with keyboard and pointer input once real artifacts exist.
- Payload disclosure must be user-controlled and readable without horizontal page scrolling.
- Reduced-motion preferences disable nonessential motion.

The Phase 0C baseline should implement normal page interactions, but it must not simulate the ReviewPlane overlay, WebMCP registration, source handoff, or dogfood evidence before those phases exist.

## Installation path

### Clone ReviewPlane

```bash
git clone <repository-url>
cd reviewplane
npm install
npm run dev
```

### Adopt ReviewPlane in a React and Vite project

The intended path is:

```bash
npx reviewplane init
npx reviewplane check
```

Until Phase 7 ships the CLI, the landing page must label these commands as planned and direct contributors to the repository instructions instead of claiming they are publicly installable.

## Supported and unsupported cases

### Supported MVP target

- React with TypeScript and Vite
- JSX and TSX intrinsic DOM elements
- Static text and ordinary component-prop text
- CSS, CSS Modules, Tailwind class strings, and inline styles
- Direct text selection within one mapped element
- Cross-element and rectangular group instructions
- This-element and matching-instances scopes
- Chrome with WebMCP enabled and compatible in-app browsers

### Unsupported in the MVP

- Next.js, Vue, and Svelte adapters
- Canvas and WebGL-rendered interfaces
- Cross-origin iframe inspection
- CMS, database, and API writes
- Generated patterns that cannot be mapped safely
- Automatic component replacement or drag-and-drop layout construction
- Automatic discovery or editing of every design token
- Starting an idle external agent through WebMCP

## Responsive requirements

- Design from 360px mobile width through large desktop displays.
- Preserve the primary action, product thesis, and sandbox-mode explanation above the first major scroll on mobile.
- Collapse multi-column sections to one column without changing the reading order.
- Keep code and payload examples inside scrollable local containers; the page itself must not scroll horizontally.
- Maintain at least 44px touch targets for primary controls.
- Keep the correction tray reachable without obscuring the entire reviewed page; on narrow screens it becomes a bottom sheet.
- Test at 360×800, 768×1024, 1280×800, and 1440×900.

## Accessibility expectations

- Meet WCAG 2.2 AA contrast for text, controls, focus indicators, and meaningful review marks.
- Use semantic landmarks and a logical heading order.
- Support full keyboard navigation for page controls and ReviewPlane controls.
- Never communicate selection, status, or scope through color alone.
- Announce correction counts, stale targets, preview state, and Done outcomes to assistive technology.
- Preserve browser zoom to 200 percent without clipped critical controls.
- Respect `prefers-reduced-motion` and avoid motion that blocks interaction.
- Provide text alternatives for product illustrations and captions or transcripts for video.

## Technical constraints

- React, TypeScript, Vite, JSX, and TSX
- ESM throughout the monorepo
- No SaaS, dashboard, authentication, or database starter
- No product implementation during Phase 0B
- No ReviewPlane runtime in ordinary production consumer builds
- No invented `document.modelContext` methods
- No unverified claims that a browser agent resumed, cancelled, or survived reload
- Keep baseline dependencies small; prefer CSS and browser APIs over a general animation or component framework
- Pass `npm run build` and `npm run typecheck`; inspect desktop and mobile renders before declaring the baseline complete
