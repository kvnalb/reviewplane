# ReviewPlane design system: Precision Proof Sheet

## I. Visual theme

ReviewPlane should feel like a technical proof under active review. The marketing page is a calm, light application plane. Review controls appear on a distinct dark utility plane above it. Blueprint-blue geometry identifies targets and focus; vermilion marks a requested change; green communicates a verified or connected state.

The signature is one visible path from rendered element to correction: selection rectangle → plain target label → routed line → correction tray entry. Spend visual boldness there. Elsewhere, use disciplined spacing, exact alignment, and restrained color.

The interface must not resemble a generic dark AI dashboard, a purple-gradient SaaS page, or a nostalgic paper document. “Proof sheet” describes the relationship between content and review marks, not a decorative texture.

## II. Color roles

### Page plane

| Token | Value | Role |
|---|---:|---|
| `--rp-canvas` | `#F1F4F2` | Cool drafting-paper page background |
| `--rp-surface` | `#FFFFFF` | Primary reading and product surfaces |
| `--rp-surface-soft` | `#E7ECE9` | Inset examples, quiet section divisions |
| `--rp-ink` | `#14201B` | Headings and high-emphasis text |
| `--rp-body` | `#3F4E47` | Default body text |
| `--rp-muted` | `#627069` | Captions and secondary metadata |
| `--rp-hairline` | `#C7D0CB` | Borders and structural rules |
| `--rp-hairline-strong` | `#8D9C94` | Active boundaries and emphasized dividers |

### Action and review

| Token | Value | Role |
|---|---:|---|
| `--rp-blue` | `#2453FF` | Primary action, selection, focus, links |
| `--rp-blue-hover` | `#173ED1` | Primary hover and pressed emphasis |
| `--rp-blue-soft` | `#E2E9FF` | Selected row and explanatory highlight |
| `--rp-red` | `#BE3227` | Requested-change mark, error, destructive reset |
| `--rp-red-soft` | `#FBE5E1` | Change background and error explanation |
| `--rp-green` | `#167457` | Connected, ready, or applied state |
| `--rp-green-soft` | `#DDF3EA` | Success background |
| `--rp-amber` | `#8B5A12` | Warning and stale-target state |
| `--rp-amber-soft` | `#F8EBCF` | Warning background |

### Tool plane

| Token | Value | Role |
|---|---:|---|
| `--rp-tool-canvas` | `#101713` | Inspector, popup, and correction-tray foundation |
| `--rp-tool-surface` | `#19231E` | Raised tool sections and fields |
| `--rp-tool-surface-hover` | `#243129` | Hovered rows and secondary buttons |
| `--rp-tool-ink` | `#F5F8F6` | Primary tool text |
| `--rp-tool-body` | `#C7D1CC` | Secondary tool text |
| `--rp-tool-muted` | `#91A098` | Tool metadata |
| `--rp-tool-hairline` | `#34433B` | Tool borders and separators |

### Color rules

- Blue means target, focus, or primary action. It does not fill large decorative areas.
- Vermilion means a human-requested change, failure, or destructive reset. Pair it with an icon or label; never use color alone.
- Green means a state that is presently true, such as **Connected**, **Ready**, or **Applied**.
- Tool surfaces remain dark even when embedded in a light section. This reinforces the separate review plane.
- Do not add purple, neon gradients, or multiple decorative accent colors.

## III. Typography

### Families

- **Display:** `"Familjen Grotesk", "Arial Narrow", sans-serif`. Use weights 500 and 600. Its compact, engineered shapes carry headings and large numeric markers.
- **Body/UI:** `"IBM Plex Sans", "Helvetica Neue", Arial, sans-serif`. Use weights 400, 500, and 600.
- **Technical:** `"IBM Plex Mono", "SFMono-Regular", Consolas, monospace`. Use weights 400 and 500 for commands, keycaps, package versions, and compact status metadata.

Load only required webfont files. The page must remain legible with the fallback stack.

### Scale

| Token | Desktop | Mobile | Weight | Line height | Tracking | Use |
|---|---:|---:|---:|---:|---:|---|
| `display-xl` | `72px` | `42px` | 600 | 0.98 | `-0.035em` | Hero thesis only |
| `display-lg` | `52px` | `36px` | 600 | 1.02 | `-0.025em` | Major section opener |
| `display-md` | `36px` | `30px` | 600 | 1.10 | `-0.018em` | Subsection heading |
| `heading-lg` | `26px` | `24px` | 600 | 1.20 | `-0.012em` | Card-group heading |
| `heading-md` | `20px` | `19px` | 600 | 1.30 | `-0.006em` | Card title |
| `body-lg` | `19px` | `18px` | 400 | 1.55 | `0` | Lead explanation |
| `body-md` | `16px` | `16px` | 400 | 1.60 | `0` | Default text |
| `body-sm` | `14px` | `14px` | 400 | 1.50 | `0` | Supporting copy |
| `label` | `13px` | `13px` | 600 | 1.30 | `0.02em` | Controls and compact headings |
| `caption` | `12px` | `12px` | 500 | 1.40 | `0.025em` | Metadata |
| `mono-md` | `13px` | `13px` | 400 | 1.55 | `0` | Payload and commands |
| `mono-sm` | `11px` | `11px` | 500 | 1.45 | `0.04em` | Coordinates and status labels |

### Typography rules

- Keep prose measures between 48 and 68 characters.
- Use sentence case for headings, buttons, labels, and navigation.
- Use mono only when the content is actually technical or machine-readable.
- Do not use all-caps paragraphs. Uppercase is allowed only for `mono-sm` status labels of three words or fewer.
- Use one line of `display-xl` where possible and never more than three lines on mobile.

## IV. Spacing

Use a 4px base with this fixed scale:

| Token | Value |
|---|---:|
| `space-1` | `4px` |
| `space-2` | `8px` |
| `space-3` | `12px` |
| `space-4` | `16px` |
| `space-6` | `24px` |
| `space-8` | `32px` |
| `space-12` | `48px` |
| `space-18` | `72px` |
| `space-24` | `96px` |
| `space-32` | `128px` |

- Desktop sections use 96–128px vertical spacing.
- Mobile sections use 72px vertical spacing.
- Default card padding is 24px; large proof panels use 32px.
- Dense tool rows use 12px vertical and 14–16px horizontal padding.
- Do not create one-off spacing values unless required by optical alignment.

## V. Grid and widths

- Maximum content width: `1240px`.
- Wide proof composition: up to `1360px`, with at least 24px viewport margin.
- Reading column: `680px` maximum.
- Desktop: 12 columns, 24px gutters.
- Tablet: 8 columns, 20px gutters.
- Mobile: 4 columns, 16px gutters and 20px page padding.
- Align headings, section rules, and product panels to the same grid lines.
- Use asymmetry only when it communicates the page/tool split or a source-to-correction path.

## VI. Buttons and interactive states

### Primary button

- Blue background, white label, 1px blue border.
- Height `44px`; padding `0 18px`; radius `8px`; `label` typography.
- Hover: `--rp-blue-hover`; translateY `-1px` only when reduced motion is not requested.
- Pressed: no translation; use `--rp-blue-hover`.
- Focus-visible: 3px `--rp-blue-soft` outer ring plus 2px `--rp-blue` outline.
- Disabled: `--rp-surface-soft` background, `--rp-muted` text, no shadow.

### Secondary button

- Transparent or white surface, `--rp-ink` label, 1px `--rp-hairline-strong` border.
- Same dimensions as primary.
- Hover: `--rp-surface-soft` background and `--rp-ink` border.

### Tool button

- Tool-surface background, tool ink, 1px tool-hairline border.
- Primary tool action may use blue; destructive actions use transparent red text until confirmed.
- Compact tool buttons may be 36px high; touch layouts expand them to at least 44px.

### General interaction rules

- Buttons use 8px corners, never pill shapes.
- Status badges may use a 999px radius because they are labels, not actions.
- Every hover treatment has a visible focus counterpart.
- Never disable a button without explaining the unmet condition nearby.

## VII. Cards and surfaces

- Standard card: white surface, 1px hairline border, 12px radius, 24px padding.
- Proof panel: white surface, 1px strong hairline, 12px radius, 32px padding, optional 4px offset edge in `--rp-surface-soft`.
- Technical inset: surface-soft background, 1px hairline, 8px radius, mono type where appropriate.
- Tool panel: tool-canvas, 1px tool-hairline, 10px radius, tool text colors.
- Review change row: tool-surface with a 3px vermilion leading rule and a visible **Change** label.
- Avoid floating-card mosaics. Cards should express a real grouping, comparison, or step.

## VIII. Borders, radii, and elevation

### Radii

- `4px`: tiny status chips and keycaps
- `8px`: buttons, inputs, code blocks
- `10px`: tool panels
- `12px`: page cards and proof panels
- `999px`: status labels and avatar circles only

### Elevation

- Page depth comes from surface changes and borders.
- Standard card: no shadow.
- Floating tool popup: `0 16px 40px rgba(8, 18, 13, 0.22)`.
- Correction tray: `0 24px 64px rgba(8, 18, 13, 0.26)`.
- Selection geometry and routed connector lines remain flat and crisp.
- Do not use colored glow, glassmorphism, or large blurred gradients.

## IX. Navigation

- Height: `64px` desktop, `56px` mobile.
- Sticky at the top with a translucent `--rp-canvas` background and 1px bottom hairline after scrolling.
- Wordmark left; Workflow, Scope, and Install centered; GitHub plus **Start reviewing** right.
- At widths below 800px, retain the wordmark and primary action; move section links into an accessible disclosure.
- The wordmark may pair a compact plane glyph with **ReviewPlane**, but the glyph must remain legible at 20px.

## X. Inspector and correction tray

### Inspector popup

- Dark tool surface with a maximum width of `360px`.
- Top row: a plain-language target label such as **Heading** or **Button** and a clear close control.
- Main controls follow the selected content: replacement first, then previewable style changes, then scope.
- Labels stay visible above fields; placeholders never replace labels.
- The popup uses blue for current selection and vermilion only for explicit changes.

### Correction tray

- Desktop: fixed to the right with width `360px`, maximum height `min(720px, calc(100vh - 32px))`.
- Mobile: anchored bottom sheet, maximum height `62vh`, with page context still visible.
- Header: **Review batch**, pending count, and connection state.
- Body: ordered correction rows with a plain-language change label, summary, scope, stale state, edit, undo, and remove. Source paths and confidence stay in the agent batch, not this UI.
- Footer: Reset as a quiet destructive action; Done as the one primary action.
- Done helper text must state whether an agent is waiting or the review can be copied or downloaded.

### Target geometry

- Hover outline: 1px blue with a 2px blue-soft outer halo.
- Selected outline: 2px blue with 6px square corner handles.
- Group selection: 2px dashed blue boundary plus numbered target labels.
- Stale target: amber dashed outline and a **Target changed** label.
- Never rely on the outline color alone; include labels or icons.

## XI. Responsive behavior

### Breakpoints

| Name | Width | Behavior |
|---|---:|---|
| Wide | `≥1280px` | 12-column grid; hero proof and tray shown side by side |
| Desktop | `1024–1279px` | 12-column grid; tray overlaps proof edge deliberately |
| Tablet | `768–1023px` | 8 columns; hero proof stacks above tray |
| Mobile | `<768px` | 4 columns; single-column reading order; tray becomes bottom sheet |

### Responsive rules

- Use `clamp()` between the documented mobile and desktop display sizes.
- Preserve the source-to-correction path on tablet; simplify it to a vertical connector on mobile.
- Tables become labeled cards below 640px rather than forcing horizontal page scroll.
- Code and JSON examples may scroll inside their own containers.
- All primary touch targets are at least 44×44px.
- Avoid hiding explanatory content solely to make mobile shorter.

## XII. Motion

- Page transitions: `180–240ms`, ease `cubic-bezier(0.2, 0.8, 0.2, 1)`.
- Review tool transitions: `120–150ms`, ease-out.
- Hero signature: after content is visible, trace the connector from selected phrase to tray once in no more than `650ms`; then reveal the correction row.
- Hover movement is at most 1px. No spring physics, looping marquee, parallax, or layout-shifting entrance.
- Under `prefers-reduced-motion: reduce`, disable connector tracing and transforms; show the complete static relationship immediately.

## XIII. Accessibility constraints

- Meet WCAG 2.2 AA contrast for text and interactive elements.
- Preserve visible focus across both page and dark tool surfaces.
- Keep DOM order consistent with reading order even when grid placement is asymmetric.
- Use semantic landmarks, native controls, and one `h1`.
- Announce correction count, preview status, stale targets, and Done outcome through an `aria-live` region.
- Pair every color-coded status with text and, where useful, an icon.
- Mark decorative registration lines and connector paths as hidden from assistive technology.
- Provide a pause or static alternative for any motion longer than five seconds; the current system defines no such motion.
- Support 200 percent zoom and keyboard operation without clipped Done, Reset, or close controls.

## XIV. Design anti-patterns

- Generic black canvas with purple, green, or blue glow
- Warm cream plus high-contrast serif as the entire identity
- Dashboard grids of interchangeable feature cards
- Decorative graph paper across every section
- Fake terminal prompts used as marketing decoration
- Unsupported success states or fake agent activity
- Multiple solid primary buttons in one local decision area
- Pill-shaped action buttons
- Excessive mono text for ordinary prose
- Low-contrast gray text presented as sophistication
- Floating controls without an obvious target relationship
- Animation that is required to understand the workflow
- Preview language that implies the repository is already changed

## XV. Desired composition examples

### Hero

```text
┌─────────────────────────────────────────────────────────────┐
│ ReviewPlane     Workflow  Scope  Install       [Start review]│
├─────────────────────────────────────────────────────────────┤
│ Mark what you want changed         ┌─ Review batch ─────────┐│
│ without hunting through source.    │ ● Ready       3 items ││
│                                    │                       ││
│ Select copy, adjust visible        │ ▌Text change          ││
│ styles, or mark a group.           │  Heading              ││
│                                    │  This item            ││
│ [Start reviewing] [Inspect batch]  │                       ││
│         ┌──────────────────────┐   │ [Reset]       [Done] ││
│         │ [rendered page] ─────┼──▶│                       ││
│         │       Selected text  │   └───────────────────────┘│
│         └──────────────────────┘                            │
└─────────────────────────────────────────────────────────────┘
```

### Workflow section

Use one horizontal source path on desktop and one vertical path on mobile:

```text
SELECT ───── STAGE ───── DONE ───── APPLY
browser      draft       frozen     source + checks
```

The numbers represent real sequence and are therefore allowed. Each step contains one concrete artifact, not a generic icon.

### Hosted versus cloned comparison

Use one shared **Done** row that forks into two outcomes. This makes the difference structural rather than burying it in paragraphs:

```text
                         ┌─ Hosted: copy or download review
DONE freezes batch ──────┤
                         └─ Clone: resolve waiting agent tool
```

## XVI. Final design test

Before accepting a render, answer yes to each question:

1. Is the selected rendered target visually connected to one correction?
2. Can a visitor distinguish the page plane from the ReviewPlane tool plane?
3. Is vermilion reserved for an actual requested change, error, or destructive action?
4. Does every card encode a real grouping or comparison?
5. Does the page remain understandable with motion disabled?
6. Are hosted and cloned outcomes described without implying that Done wakes an idle agent?
7. Does the mobile layout preserve the thesis, interaction entry point, and honest sandbox explanation?
