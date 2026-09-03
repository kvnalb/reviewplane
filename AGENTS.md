# ReviewPlane agent instructions

`docs/BUILD_PLAN.MD` is the authoritative implementation plan for this repository.

- Work through one phase at a time.
- Run the phase's acceptance checks before moving on.
- Stop at every human approval gate and wait for explicit approval.
- Record deviations and failed assumptions in `docs/decisions.md`.
- Keep ReviewPlane development-only in consumer applications unless an explicit hosted sandbox mode is enabled.
- Never imply that WebMCP can wake an idle coding agent; verify browser-agent behavior in the real target environment.

## Review batches

For a ReviewPlane-driven source change, use the appropriate canonical repository skill:

- New React + Vite work: `skills/reviewplane-create-react/SKILL.md`
- Existing React + Vite app: `skills/reviewplane-adopt-react/SKILL.md`

If skills are not discoverable, retrieve every correction, inspect the canonical source, apply one minimal patch, validate, and acknowledge applied, unresolved, and failed correction IDs separately.

## Repository commands

```bash
npm install
npm run dev
npm run build
npm run typecheck
npm run test
npm run test:e2e
```
