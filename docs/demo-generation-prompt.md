# Exact Phase 8 fresh-demo generation prompt

Build a fresh ReviewPlane landing page in `apps/demo`. This is the untouched page the user will review for the first time during the recorded dogfood gate.

Read completely before editing:

1. `docs/BUILD_PLAN.MD`, especially the revised Product contract and Phases 8–10
2. `docs/product-brief.md`
3. `docs/design-decision.md`
4. `apps/landing/DESIGN.md`

Treat the product brief as the claims and content contract and `DESIGN.md` as the visual contract. Use the approved Precision Proof Sheet direction without copying the existing `apps/landing` implementation. Do not copy its component structure, markup, or CSS. Generate a genuinely fresh page from the written inputs.

The primary reader is a vibe coder building a React app with a coding agent. The page’s single job is to get that person to try reviewing the page itself. Lead with the familiar source-hunting problem, not WebMCP or implementation jargon. Use this exact hero core:

- Audience: **For people building React apps with coding agents.**
- Headline: **Fix the page you see. Skip the source hunt.**
- Support: **Select words, adjust a visible style, or draw around a group. ReviewPlane gives your coding agent one review with the context to make the changes.**
- Primary action: **Start reviewing this page**

Build these sections in this order:

1. Compact navigation with Workflow, Modes, Install, Scope, and the primary action
2. Hero with the exact core copy and a restrained “correction margin” composition
3. Short problem explanation
4. Select → Stage → Done → Apply workflow
5. Hosted sandbox versus cloned project outcomes
6. One-command release-candidate installation
7. Supported scope covering React 18/19, Vite React/SWC, CSS Modules, Tailwind, and shadcn/Radix; Next.js stays roadmap
8. Honest recording placeholder and before/after placeholder
9. Trust statement and closing action

Design plan:

- Palette: drafting canvas `#F1F4F2`, white working surface `#FFFFFF`, deep green-black `#14201B`, blueprint blue `#2453FF`, correction vermilion `#BE3227`, verified green `#167457`.
- Type: Familjen Grotesk for a restrained display role, IBM Plex Sans for prose and UI, IBM Plex Mono only for the install command and compact status.
- Layout: a quiet 12-column proof sheet whose right four columns become a dark correction margin in the hero; sections align to a shared left rule rather than a grid of interchangeable cards.
- Signature: one selected phrase crosses the page/tool boundary through a crisp routed line into the correction margin. It must remain understandable without motion.
- Aesthetic risk: let the correction margin interrupt the hero’s outer frame instead of placing another floating product screenshot inside a card. Keep every other section restrained.

Self-critique before building: the proof-sheet direction can drift into a generic editorial grid or fake product chrome. Avoid graph-paper texture, decorative source coordinates, raw payloads, fake agent success, and dashboard card mosaics. The correction margin must explain the human action; it cannot pretend to be the working overlay. The actual ReviewPlane toolbar mounted by the package is the interactive product.

Use the official React TypeScript Vite starter, then adopt the local `0.1.0` release-candidate packages through `npx reviewplane init`. Keep the ordinary production build free of ReviewPlane. Add an explicit Vite `sandbox` build mode that includes instrumentation and the overlay for the hosted public demo; it must only stage, preview, copy, and download reviews in the visitor’s browser and cannot mutate the public repository.

The primary ReviewPlane UI must use plain-language labels. Do not display source paths, line numbers, runtime occurrence IDs, provenance, or mapping confidence. Those details may exist only in the structured agent batch.

Implement responsive and accessible behavior from 360px through wide desktop: one `h1`, semantic landmarks, visible focus, 44px touch targets, reduced motion, no horizontal page scroll, and readable layout at 200% zoom. Use CSS and browser APIs rather than a component framework or motion dependency.

Functional verification is allowed: typecheck, lint, tests, ordinary production build, sandbox build, page load, navigation, copy button, responsive layout, console errors, and production-exclusion checks. Do not use ReviewPlane on this page during implementation. Specifically, do not select a correction, stage a batch, press Done, invoke its review tools, patch the page from a review, or rehearse the recording flow. Selection mechanics must be tested only in the separate Phase 7 compatibility fixtures.
