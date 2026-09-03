# ReviewPlane design-language decision

## Decision

Use **Precision Proof Sheet**: a cool, light technical canvas for the marketing page, paired with dark ReviewPlane tool surfaces, blueprint-blue targeting, and vermilion correction marks.

The visual thesis is functional: ReviewPlane adds a separate review plane above an existing interface. The page should therefore make the application layer and review layer visibly distinct. Selection rectangles, source-coordinate labels, margin marks, and a line connecting target to correction become the brand vocabulary.

## Research inputs

- [Awesome DESIGN.md](https://github.com/VoltAgent/awesome-design-md) demonstrates how design documents can encode color roles, typography, component states, layout rules, and responsive behavior rather than relying on mood words.
- [Learn UI Design](https://www.learnui.design/) emphasizes alignment, spacing, consistency, constrained sizing, luminosity, legible typography, and explicit component states. These principles matter here because the page must host both marketing content and a dense review tool.
- [Linear analysis](https://github.com/VoltAgent/awesome-design-md/blob/main/design-md/linear.app/DESIGN.md) and [Raycast analysis](https://github.com/VoltAgent/awesome-design-md/blob/main/design-md/raycast/DESIGN.md) show the strengths of restrained dark product chrome and surface ladders.
- [Warp analysis](https://github.com/VoltAgent/awesome-design-md/blob/main/design-md/warp/DESIGN.md) shows how warm neutrals and terminal imagery can make a technical product feel readable without bright decoration.
- [Replicate analysis](https://github.com/VoltAgent/awesome-design-md/blob/main/design-md/replicate/DESIGN.md) shows how editorial typography, strong color bands, and code wells can make infrastructure tangible.

These references are analytical inputs. ReviewPlane does not copy their identity, proprietary typography, layouts, or signature gradients.

## Candidate A: Dark command surface

**Typography character:** restrained grotesk sans for headings and body, with a mono face for shortcuts, source locations, and payloads.

**Color system:** near-black canvas, three or four charcoal surface levels, off-white type, and one cool accent.

**Density:** compact product controls inside generous marketing sections.

**Layout principles:** product screenshots dominate; cards sit on a continuous dark canvas; hierarchy comes from surface changes and hairline borders.

**Component treatment:** 6–12px radii, quiet buttons, command-palette rows, small status chips, almost no shadows.

**Motion principles:** quick opacity and transform transitions; keyboard-first interactions; no large decorative sequences.

**Suitability:** the dark surface fits a developer tool and would make the correction tray feel native.

**Derivative risk:** high. Linear, Raycast, Cursor, and many agent products already use near-black chrome with a blue, lavender, or green accent. ReviewPlane would look competent but interchangeable.

**Implementation cost:** low to medium. A surface ladder and restrained component set are straightforward, but maintaining legibility across dense payload examples requires care.

## Candidate B: Editorial markup

**Typography character:** an expressive grotesk or serif display face, neutral sans body, and mono code face.

**Color system:** warm paper canvas, dark ink, one saturated stamp color, and dark code bands.

**Density:** spacious headlines and narrative sections alternating with compact review artifacts.

**Layout principles:** strong full-width color bands, oversized type, asymmetric editorial crops, and callouts that resemble proofreader marks.

**Component treatment:** rounded interactive controls, flat cards with hairline borders, oversized section titles, and annotation stamps.

**Motion principles:** one orchestrated hero reveal and restrained content transitions.

**Suitability:** human judgment and revision are central to ReviewPlane, so editorial proofing is a meaningful metaphor. The contrast between prose and code also helps explain the handoff.

**Derivative risk:** medium to high. Warm cream, large editorial type, and orange-red accents have become common launch-page patterns and closely resemble Replicate when combined with dark code wells.

**Implementation cost:** medium. The typography requires careful responsive scaling, and large color bands can compete with the live review interface.

## Candidate C: Precision proof sheet, recommended

**Typography character:** Familjen Grotesk gives display text a narrow, engineered energy; IBM Plex Sans keeps explanations readable; IBM Plex Mono labels source coordinates and structured payloads.

**Color system:** cool drafting-paper canvas, white working surfaces, blue targeting marks, vermilion corrections, deep green-black text, and a dark inspector surface.

**Density:** calm narrative spacing around a deliberately information-dense interactive proof.

**Layout principles:** a 12-column technical grid, visible registration marks at a few structural edges, left-aligned copy, and a hero organized around one target-to-correction path. The inspector floats above the page as a separate layer.

**Component treatment:** squared 8–12px geometry, crisp 1px borders, source labels, selection handles, and limited status pills. Review marks use color plus icons and labels.

**Motion principles:** one hero sequence traces a target to its tray item; all tool interactions settle within 120–150ms; reduced motion removes the trace without removing information.

**Suitability:** strongest. It explains the product before the visitor reads the implementation details: a person marks the rendered proof, and a structured line carries that intent toward source.

**Derivative risk:** low to medium. Blueprint grids and editorial marks both exist elsewhere, but their combination with runtime selections, source coordinates, and the split light-page/dark-tool treatment is specific to ReviewPlane.

**Implementation cost:** medium. The signature hero needs precise CSS geometry, but it does not require 3D, canvas, a large illustration library, or a motion dependency.

## Why Candidate C wins

The other directions each collapse the page and product into one visual mode. Candidate C uses the product's core distinction as the design system: the reviewed application is one plane, and the review controls are another. This makes the dark correction tray easy to locate, lets blue selection geometry remain visible, and reserves vermilion for human-requested changes rather than generic branding.

The direction also avoids the dominant developer-tool template. It is light without becoming a generic white SaaS page, expressive without depending on a fashionable cream-and-serif combination, and technical without turning every section into a terminal screenshot.

## Signature composition

The hero contains a large browser-like proof surface. A real phrase is selected with a blue rectangle and small source-coordinate label. A thin routed line crosses the boundary into a dark correction tray, where the requested replacement appears with a vermilion change mark. The line is the only orchestrated motion on initial load.

This composition must remain useful when static. It should read as:

```text
RENDERED PAGE                         REVIEW PLANE
┌──────────────────────────┐          ┌──────────────────┐
│ Review the [rendered     │─────────▶│ Replace text     │
│ page]                    │ source   │ This element     │
│              App.tsx:18 │          │ 3 corrections    │
└──────────────────────────┘          └──────────────────┘
```

## Risks and mitigations

- **Risk: the proof-sheet metaphor becomes decorative graph paper.** Use grid lines only inside the hero proof and section registration marks; keep reading surfaces clean.
- **Risk: red implies failure everywhere.** Reserve vermilion for an explicit requested change or destructive reset. Use green for connected/applied states and blue for selection and focus.
- **Risk: three font families increase load.** Self-host only the weights used, use metric-compatible system fallbacks, and keep the mono face to technical labels.
- **Risk: the dark tray dominates mobile.** Convert it to a bounded bottom sheet after the product thesis and keep the page context visible above it.
- **Risk: the baseline accidentally fakes product behavior.** Static illustrations must be labeled as previews until the real overlay and bridge exist.

## Approval recommendation

Approve Candidate C and use `apps/landing/DESIGN.md` as the binding design specification for baseline generation.
