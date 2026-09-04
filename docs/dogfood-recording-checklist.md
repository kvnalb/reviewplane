# User dogfood / recording checklist

This checklist is for the **human operator**. The implementation agent prepares the surface; it does not choose demo corrections or record the video.

Run this only after Phase 7–9 automated checks pass.

## Before recording

1. Pull the cloud branch (do not dirty local `main` if it holds unrelated WIP):
   ```bash
   git fetch origin
   git checkout cursor/phase-7-9-submission-1e5c
   npm install
   npm run build:packages
   ```
2. Confirm baseline tag exists: `baseline-agent-generated`.
3. Start the landing app:
   ```bash
   npm run dev
   ```
4. Optional hosted-sandbox preview (separate from ordinary production):
   ```bash
   npm run build:sandbox --workspace @reviewplane/landing
   npm run preview:sandbox --workspace @reviewplane/landing
   ```
5. In Chrome, enable WebMCP testing (`chrome://flags/#enable-webmcp-testing`) when demonstrating the agent loop.
6. Have Codex (or another host) ready to call `wait_for_review` **before** you press Done. Done does not wake an idle agent.

## Reset / baseline

- Soft reset inside the overlay: **Reset all** clears staged previews without changing source.
- Hard reset to the agent-generated baseline: check out / compare against tag `baseline-agent-generated`.
- After a successful real dogfood pass, tag the result: `git tag reviewplane-edited`.

## Waiter setup

1. Agent discovers tools: `wait_for_review`, `get_review_batch`, `get_correction`, `acknowledge_review`.
2. Agent calls `wait_for_review` and leaves it pending.
3. Overlay status should read that an agent is waiting.
4. If no waiter is present, Done still freezes the batch and offers copy/download.

## Recording sequence (user-owned)

1. Open the page and show the residual issues (weak phrase, typography/color, group hierarchy).
2. Select and rewrite copy.
3. Change font size or color with a live preview.
4. Select another text fragment.
5. Lasso several elements and leave one instruction.
6. Review the tray, then press **Done once**.
7. Show the waiting agent receiving the batch (or copy/download fallback).
8. Show the agent editing React source, validating, and the live Vite rerender.
9. Compare against the baseline tag.

## External install demo (optional second take)

```bash
npm create vite@latest demo -- --template react-ts
cd demo
npm install
npm install -D /path/to/reviewplane-*.tgz   # or published packages after approval
npx reviewplane init
npm run dev
```

Do not hand-edit Vite config for the standard path.

## After recording

- Fill the landing demo-video URL placeholder.
- Decide npm publish names/version/account (human approval gate).
- Decide paid/DNS deploy for the hosted sandbox (human approval gate).
