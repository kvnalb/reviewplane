# End-to-end tests

Playwright covers overlay activation, text staging, Done without an agent, and a mocked WebMCP waiter.

```bash
npm install
npx playwright install chromium
npm run test:e2e
```

Real Chrome WebMCP with the testing flag remains a manual gate for submission.
