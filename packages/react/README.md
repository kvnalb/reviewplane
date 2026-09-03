# @reviewplane/react

Development-only React overlay for ReviewPlane. It mounts controls through a portal into a Shadow DOM host, leaving the consumer application's layout untouched.

## Interaction model

- **Inspect** (`Alt+Shift+R`) identifies an instrumented element and its source location.
- **Text** uses native browser selection for direct text, color, background, and font-size corrections.
- **Lasso** includes visible mapped elements when at least 25% of an element's area intersects the rectangle, then captures one group instruction.
- **Tray** previews, edits, undoes, removes, resets, and submits staged corrections.

Direct text replacement is intentionally limited to one mapped element with one direct text node. Cross-element or structurally nested selections fall back to a group instruction instead of pretending a safe rewrite is possible.

The consumer must mount `<ReviewPlane />` only in development, unless it explicitly implements a hosted sandbox that cannot write to the public repository.

`registerReviewPlaneTools(document.modelContext)` registers the four imperative WebMCP tools. Batch retrieval is intentionally split from correction retrieval so each response stays compact; human-authored fields carry `untrustedContentHint`.
