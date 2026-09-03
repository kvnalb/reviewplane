# Exact Phase 0C baseline-generation prompt

The following text is the complete prompt to use after the Phase 0B inputs receive explicit human approval.

---

Build the complete ReviewPlane baseline landing page in `apps/landing`.

Read these files completely before changing code:

1. `AGENTS.md`
2. `docs/BUILD_PLAN.MD`, especially the product contract, fixed MVP interaction rules, Phase 0C, and Phase 8 landing-page requirements
3. `docs/product-brief.md`
4. `docs/design-decision.md`
5. `apps/landing/DESIGN.md`

Treat `docs/product-brief.md` as the content and claims contract. Treat `apps/landing/DESIGN.md` as the binding visual system. `docs/design-decision.md` explains the rejected alternatives and the rationale for the selected Precision Proof Sheet direction.

No screenshot has been approved as a visual reference. Do not invent one or imitate another company's page. The approved visual references are the written research links in `docs/design-decision.md`; use them only to understand the stated principles. The resulting identity must remain ReviewPlane-specific.

Implement a serious, production-quality landing page using the existing React, TypeScript, and Vite application. Preserve ESM and the npm workspace structure. Do not replace the starter with a SaaS template, dashboard template, authentication system, database starter, or prebuilt product architecture. Keep dependencies small and prefer semantic React, CSS, and browser APIs. Do not add a general component framework or animation library unless the approved design cannot be implemented responsibly without it.

The page must include every section required by `docs/product-brief.md`, with this hierarchy:

1. Navigation
2. Hero with the exact core positioning and **Start reviewing this page** action
3. Honest self-review sandbox region
4. Select → Stage → Done → Apply workflow
5. Handoff anatomy
6. Before-and-after region
7. Hosted versus cloned modes
8. Installation
9. Supported-scope table
10. Demo-video region
11. Trust notes
12. Closing action and footer with GitHub link

Use the audience line, positioning line, supporting line, action labels, and required section copy in the brief as the source of truth. Preserve their visitor-focused structure and specific workflow language. You may tighten secondary explanatory copy when layout requires it, but do not weaken the claims boundary or replace concrete actions with generic AI-product claims.

This is the baseline landing page, not the ReviewPlane product implementation. Do not implement source instrumentation, the overlay package, correction state, WebMCP tools, the CLI, or dogfood evidence in this phase. Do not simulate successful agent behavior. Where later-phase artifacts do not exist:

- label the sandbox product composition as an interactive preview or clearly bounded demonstration rather than a working source-editing handoff;
- label `npx reviewplane init` and `npx reviewplane check` as planned or local-development commands;
- label the before-and-after comparison and demo video as pending real dogfood evidence;
- never claim that Done wakes or starts an idle agent;
- never claim that a preview has changed repository source.

Implement normal landing-page interactions that are truthful at this phase: navigation, keyboard focus, responsive disclosures, copy buttons with feedback, and accessible static or interactive explanations. The **Start reviewing this page** action may focus or reveal the sandbox explanation, but it must not pretend the ReviewPlane overlay exists.

Follow the exact color roles, typography hierarchy, spacing, widths, button states, surfaces, border radii, overlay treatment, responsive rules, motion timing, reduced-motion behavior, and anti-patterns in `apps/landing/DESIGN.md`. The hero must express the signature source-to-correction path and remain understandable with animation disabled.

Accessibility and responsive quality are acceptance requirements:

- semantic landmarks and logical headings;
- one `h1`;
- complete keyboard operation;
- visible focus states;
- WCAG 2.2 AA contrast;
- text alternatives for meaningful visuals;
- reduced-motion support;
- no horizontal page scrolling;
- at least 44×44px primary touch targets;
- usable layouts at 360×800, 768×1024, 1280×800, and 1440×900;
- robust layout at 200 percent browser zoom.

Use the existing repository commands. You may inspect repository conventions, run the development server, inspect the rendered interface, and correct functional, responsive, accessibility, and implementation defects as part of one normal implementation cycle.

Before reporting completion:

1. Run `npm run typecheck`.
2. Run `npm run build`.
3. Run `npm run lint --workspace @reviewplane/landing`.
4. Run relevant tests if you add them.
5. Start the page with `npm run dev`.
6. Inspect the rendered result at desktop and mobile widths in a real browser.
7. Test keyboard navigation and reduced-motion behavior.
8. Check the console for errors and warnings.
9. Correct defects found during this verification loop.
10. Review the final diff for accidental ReviewPlane product implementation, unsupported claims, template residue, and unused assets.

When complete, report:

- the implemented sections and interactions;
- files changed;
- commands and checks run with their results;
- desktop and mobile inspection evidence;
- accessibility checks performed;
- any deviations from the approved documents;
- unresolved risks or assumptions.

Do not request or perform a targeted aesthetic cleanup after declaring completion. The accepted result will be frozen as the authentic agent-generated baseline, committed, and tagged `baseline-agent-generated`.

---
