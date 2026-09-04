# ReviewPlane setup

ReviewPlane supports React 18 or 19 applications using Vite React or Vite React SWC. It is development-only unless the application deliberately enables the non-writing hosted sandbox mode.

> **Early release:** ReviewPlane `0.1.0` is experimental software. It may contain bugs or behave unexpectedly with unsupported React or Vite configurations.

## Try the repository demo

```bash
git clone https://github.com/kvnalb/reviewplane.git
cd reviewplane
npm install
npm run dev
```

Open the URL printed by Vite. Restart the development server after rebuilding a workspace package.

## Install after npm publication

From an existing Vite React application:

```bash
npx reviewplane init
npm run dev
```

The initializer installs the SDK, adds `reviewplane()` before the React Vite plugin, creates the development overlay bootstrap, and adds local coding-agent instructions. It is safe to run repeatedly.

Verify the setup:

```bash
npx reviewplane check --url=http://localhost:5173
```

Use the actual URL printed by Vite if it chose another port.

## Install the release candidate before publication

In this repository, create the four local packages:

```bash
npm install
npm run pack:release
```

The tarballs are written to `artifacts/`. In the Vite React application you want to test, install all four using the paths printed by the pack command:

```bash
npm install --save-dev \
  /path/to/reviewplane/artifacts/reviewplane-core-0.1.0.tgz \
  /path/to/reviewplane/artifacts/reviewplane-react-0.1.0.tgz \
  /path/to/reviewplane/artifacts/reviewplane-vite-0.1.0.tgz \
  /path/to/reviewplane/artifacts/reviewplane-0.1.0.tgz
npx reviewplane init
npm run dev
```

Because the SDK dependencies are already installed from local tarballs, `init` performs only the application setup and does not contact npm for unpublished ReviewPlane packages.

## Complete review loop

1. Keep the coding-agent task active and have it call `wait_for_review`.
2. Confirm the tray says **Agent connected and waiting**.
3. Select text or elements, stage several corrections, and press **Done** once.
4. The agent retrieves the batch and individual corrections, edits source, and validates the application.
5. The agent calls `acknowledge_review` only after the changes exist in source.

If no agent is waiting, Done saves the same batch in the browser. Use **Copy review** or **Download JSON**. ReviewPlane cannot wake an idle coding agent.
