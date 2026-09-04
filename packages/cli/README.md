# ReviewPlane CLI

> **Early release:** ReviewPlane `0.1.0` is experimental software. It may contain bugs or behave unexpectedly with unsupported React or Vite configurations.

Add ReviewPlane to an existing React + Vite app:

```bash
npx reviewplane init
```

The command detects the package manager, installs `@reviewplane/react` and `@reviewplane/vite`, configures a standard Vite plugin array, adds the development-only overlay bootstrap, and installs the repository-local agent skill. It is safe to run again. Use `--dry-run` to preview changes.

Then start the app and check the setup:

```bash
npm run dev
npx reviewplane check --url=http://localhost:5173
```

Unusual Vite configuration shapes are left untouched and receive exact manual instructions instead of a risky rewrite. ReviewPlane supports React 18 and 19 with Vite React or Vite React SWC. Next.js is not supported yet.
