import { defineConfig } from '@playwright/test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

export default defineConfig({
  testDir: '.',
  testMatch: '*.spec.ts',
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL: 'http://127.0.0.1:5190',
    channel: 'chrome',
    headless: true,
    viewport: { width: 1280, height: 800 },
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'npx vite --config tests/e2e/fixture/vite.config.ts --host 127.0.0.1 --port 5190',
      cwd: repository,
      url: 'http://127.0.0.1:5190',
      reuseExistingServer: false,
      timeout: 30_000,
    },
    {
      command: 'npm run dev --workspace @reviewplane/demo -- --host 127.0.0.1 --port 5192',
      cwd: repository,
      url: 'http://127.0.0.1:5192',
      reuseExistingServer: false,
      timeout: 30_000,
    },
  ],
})
