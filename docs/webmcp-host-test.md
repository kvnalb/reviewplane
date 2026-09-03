# WebMCP host test

Date: 2026-09-03  
Result: **Blocked — the target browser does not expose `document.modelContext`.**

## Purpose

This test asks whether ReviewPlane can register `wait_for_review`, let a coding-agent tool call remain pending while a human reviews the page, and resume that same call when the human presses Done.

## Probe implementation

The development-only probe is implemented in `apps/landing/src/WebMcpProbe.tsx`.

- It feature-detects `document.modelContext`.
- When available, it registers `wait_for_review` with `document.modelContext.registerTool(...)`.
- The `execute` callback returns a Promise and retains one resolver.
- Done resolves that Promise with a structured `review_complete` result.
- The callback listens to its execution `AbortSignal` and rejects on cancellation.
- A second simultaneous call is rejected with a clear `another review is already pending` error.
- The registration is removed through a registration `AbortSignal` when the component unmounts.
- When the API is absent, the probe displays exactly: “WebMCP is unavailable in this browser.” It does not register a substitute or simulate success.

## Reference behavior

The [WebMCP draft specification](https://webmachinelearning.github.io/webmcp/) defines an asynchronous imperative tool callback, permits it to return a Promise, and supplies an execution `AbortSignal`. It also defines cleanup for pending executions when documents unload.

Chrome's [WebMCP overview](https://developer.chrome.com/docs/ai/webmcp) says local development currently requires `chrome://flags/#enable-webmcp-testing`, that the API requires an origin-isolated document, and that an agent must visit a page before discovering its tools. Chrome's [security guidance](https://developer.chrome.com/docs/ai/webmcp/secure-tools) recommends exposing tools narrowly and applying accurate annotations.

## Environment

| Field | Observed value |
| --- | --- |
| Coding-agent host | Codex desktop task |
| Browser surface | Codex in-app browser |
| Browser user agent | Chrome 151.0.0.0 on macOS |
| Page host | `localhost:5173` |
| Secure context | `true` |
| Origin-agent cluster | `true` |
| `document.modelContext` | Absent (`undefined`) |
| Local WebMCP flag | Not exposed through this in-app browser surface; effective state is unavailable |

## Required test results

| Step | Result | Evidence |
| --- | --- | --- |
| 1. Open the page | Pass | The landing application rendered at `http://localhost:5173/`. |
| 2. Discover `wait_for_review` | **Blocked** | `"modelContext" in document` returned `false`; the page showed the required unavailable message. |
| 3. Invoke the tool | Not runnable | No WebMCP API or discoverable tool exists in this host. |
| 4. Keep it pending for two minutes | Not runnable | Invocation could not begin. |
| 5–6. Press Done and resume the same turn | Not runnable | Done correctly remains disabled when no execution is pending. |
| 7–8. Invoke again, cancel, and observe abort | Not runnable | Invocation could not begin. |
| 9–10. Reload during a pending execution | Not runnable | No pending execution can be created. |
| 11. Attempt a simultaneous waiter | Not runnable in host | The implemented callback rejects it, but host behavior cannot be claimed until the host invokes the tool. |

## Timeout and cancellation

No host timeout or cancellation behavior can be measured because the target host cannot discover or invoke a page tool. The implementation follows the specification's Promise and `AbortSignal` mechanisms, but that is not evidence that this coding-agent host will preserve a pending turn.

## Acceptance decision

Phase 1 does **not** pass either allowed acceptance outcome:

1. No pending execution could be resolved after Done.
2. No host timeout or bounded repeated-wait behavior could be measured.

Per the build plan, work must stop before Phase 2. The source-editing handoff must not be simulated.

## Unblocking action

Run this same page in the actual browser-agent host with WebMCP enabled, then repeat all eleven steps. For Chrome local development, enable `chrome://flags/#enable-webmcp-testing` and relaunch Chrome. If the intended coding-agent host is the Codex in-app browser, that host must expose page tools before the test can pass.
