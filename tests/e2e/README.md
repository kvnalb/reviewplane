# End-to-end tests

`npm run test:e2e` starts the instrumented fixture and the untouched demo through Playwright's `webServer` support. The suite covers selection, previews, lasso review, submission and fallback, a pending WebMCP handoff, reload/stale-target behavior, narrow viewports, keyboard access, production exclusion, and source-mapping coverage.

The WebMCP bridge is mocked only for deterministic automation. The release gate also requires a separate check in the real target browser.
