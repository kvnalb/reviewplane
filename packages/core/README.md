# `@reviewplane/core`

> **Early release:** ReviewPlane `0.1.0` is experimental software. It may contain bugs or behave unexpectedly with unsupported React or Vite configurations.

Framework-independent correction schemas and review state for ReviewPlane.

`ReviewStore` keeps one active draft, persists it through a `StorageLike` adapter, recomputes visual previews from captured baselines, and freezes submitted correction snapshots. Browser consumers can pass `browserSessionStorage()`; tests and non-browser hosts can provide any compatible in-memory adapter.

The lifecycle is intentionally small:

```text
begin draft → create/edit/remove/undo/reset → submit (ready)
                                                ↓
                                      acknowledge (applying)
                                                ↓
                                     applied | partial | failed
```

Undo marks a correction inactive. It does not issue an inverse DOM change. Call `computePreview()` to replay the remaining active corrections from the target's original baseline.
