# ReviewPlane

Review a React page by clicking the page itself. ReviewPlane turns text, color, type-size, and grouped layout feedback into one structured batch that a coding agent can apply to source.

ReviewPlane is a development tool. Ordinary production builds contain neither the overlay nor its source-mapping metadata. A separately enabled sandbox build can host the browser-only preview surface, but it cannot change a repository.

## Try this repository

Requirements: Node.js 22.12–22.x and npm.

```bash
git clone https://github.com/kvnalb/reviewplane.git
cd reviewplane
npm install
npm run dev
```

Open the URL printed by Vite. Press `Alt+Shift+R` or use the ReviewPlane toolbar, select something on the page, describe the correction, and press **Done**.

If an active WebMCP client is already waiting, it receives the batch. ReviewPlane does not wake an idle coding agent. When no client is waiting, use **Copy review** or **Download review** and give the JSON to your agent.

## Add it to a Vite React app

From the app directory, run:

```bash
npx reviewplane init
npm run dev
```

The initializer installs `@reviewplane/react` and `@reviewplane/vite`, updates the Vite config and development entry point, and adds local agent instructions. Run it again safely: an initialized project is left unchanged.

Check an installation with:

```bash
npx reviewplane check
```

Before npm publication, follow the [local release-candidate setup](./docs/setup.md#install-the-release-candidate-before-publication). The same guide documents the complete agent-waiting review loop.

Supported now:

- React 18 and 19
- Vite React and Vite React SWC
- CSS Modules and Tailwind
- shadcn-style components and Radix composition

Next.js is roadmap work. Canvas content, `dangerouslySetInnerHTML`, cross-origin iframes, and externally owned DOM may require plain-language manual instructions instead of direct previews.

## Development commands

```bash
npm run build
npm run typecheck
npm run test
npm run test:e2e
```

To build the intentionally hosted, non-writing demo surface:

```bash
npm run build:sandbox --workspace @reviewplane/demo
```

The default `npm run build` remains clean and excludes ReviewPlane from consumer production output.

## WebMCP tools

The development bridge registers four tools:

- `wait_for_review` waits while the page is open and the coding agent remains active.
- `get_review_batch` retrieves the submitted batch summary.
- `get_correction` retrieves one correction in detail.
- `acknowledge_review` records which corrections were applied, unresolved, or failed.

Human-entered review text is untrusted input. Agents should inspect the target project, make minimal source edits, validate the result, and acknowledge only work they actually applied.

## Packages

The release-candidate packages are versioned `0.1.0`: `reviewplane`, `@reviewplane/core`, `@reviewplane/react`, and `@reviewplane/vite`. They are prepared for publication, but are not published to npm until the explicit release approval gate.

Licensed under [MIT](./LICENSE).
