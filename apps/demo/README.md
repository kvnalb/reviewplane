# ReviewPlane demo

Fresh Phase 8 landing page generated from `docs/product-brief.md`, `docs/design-decision.md`, `apps/landing/DESIGN.md`, and `docs/demo-generation-prompt.md`.

```bash
npm run dev --workspace @reviewplane/demo
npm run build --workspace @reviewplane/demo
npm run build:sandbox --workspace @reviewplane/demo
```

The normal build excludes ReviewPlane. The `sandbox` build explicitly includes source instrumentation and the in-browser review overlay for a hosted demo that cannot write to the public repository.

Do not pre-stage or rehearse corrections on this app. After Phase 9 hardening, the user performs its first live ReviewPlane pass while Codex is waiting, and that take becomes the recorded dogfood evidence.
