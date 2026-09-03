# WebMCP host test

Date: 2026-09-03  
Result: **Pass for the complete four-tool bridge and pending same-turn resumption; Chrome 152 cancellation caveat recorded.**

## Purpose

This test asks whether ReviewPlane can register `wait_for_review`, let a WebMCP execution remain pending while a human reviews the page, and resume that same execution when the human presses Done.

## Probe implementation

The development-only probe is implemented in `apps/landing/src/WebMcpProbe.tsx`.

- It feature-detects `document.modelContext`.
- When available, it registers `wait_for_review` with `document.modelContext.registerTool(...)`.
- Its `execute` callback returns a Promise and retains one resolver.
- Done resolves that Promise with a structured `review_complete` result.
- It listens for the execution `AbortSignal` when the browser supplies one.
- A second simultaneous call returns a clear `review_already_pending` response.
- The registration is removed through a registration `AbortSignal` when the component unmounts.
- A small development-only host-test client uses the documented `getTools()` and `executeTool()` methods. This tests the Chrome WebMCP lifecycle deterministically; it is not presented as evidence that a language model will always choose the tool.
- When the API is absent, the probe displays exactly: “WebMCP is unavailable in this browser.” It does not register a substitute or simulate success.

## Reference behavior

The [WebMCP draft specification](https://webmachinelearning.github.io/webmcp/) defines an asynchronous imperative tool callback and permits it to return a Promise. Chrome's [imperative API documentation](https://developer.chrome.com/docs/ai/webmcp/imperative-api) documents `getTools()`, `executeTool()`, cancellation through an execution `AbortSignal`, and registration cleanup. Chrome's [WebMCP overview](https://developer.chrome.com/docs/ai/webmcp) documents the local-development flag, while its [security guidance](https://developer.chrome.com/docs/ai/webmcp/secure-tools) recommends narrow exposure and accurate annotations.

## Environment

| Field | Observed value |
| --- | --- |
| Coding-agent host | Codex desktop task controlling the user's Chrome tab |
| Browser surface | Chrome extension connection |
| Browser user agent | Chrome 152.0.0.0 on macOS |
| Page host | `localhost:5173` |
| Secure context | `true` |
| Origin-agent cluster | `true` |
| `document.modelContext` | Present |
| Local WebMCP flag | Enabled by the user; Chrome relaunched |

An earlier attempt in the Codex in-app browser used Chrome 151 and found `document.modelContext` absent. The Chrome result supersedes that blocked test for local development; it does not prove that every in-app browser rollout exposes page tools.

## Required test results

| Step | Result | Evidence |
| --- | --- | --- |
| 1. Open the page | Pass | The landing application rendered at `http://localhost:5173/`. |
| 2. Discover `wait_for_review` | Pass | The page reported `registered`, and Chrome's `document.modelContext.getTools()` returned `wait_for_review`. |
| 3. Invoke the tool | Pass | The development host client called Chrome's documented `executeTool()` method. The tool entered `pending`. |
| 4. Keep it pending for two minutes | Pass | The execution remained pending for 138 seconds without a host timeout. |
| 5–6. Press Done and resume the same turn | Pass | Done resolved the same execution with `status: review_complete` and `waitedMs: 137739`; this Codex task continued after the result. |
| 7–8. Invoke again, cancel, and observe abort | Partial | Aborting the `executeTool()` caller rejected that caller with `Cancelled by the Phase 1 host test`, but Chrome 152 did not supply the documented execution `AbortSignal` to the registered callback. The callback remained pending until Done. |
| 9–10. Reload during a pending execution | Pass with host limitation | Reload discarded the pending document. The replacement document registered a fresh tool and returned to `registered`. Because the deterministic caller lived in the unloaded document, it could not display the old promise's terminal result. |
| 11–12. Attempt a simultaneous waiter | Pass | A second execution returned `status: rejected`, `code: review_already_pending`, and an instruction to finish or cancel the active review. The first execution remained pending and later resolved normally. |

## Timeout and cancellation

No timeout was observed over 138 seconds, so ReviewPlane does not need repeated bounded waits for this Chrome version.

Cancellation is not yet portable enough to depend on as the only cleanup mechanism. In this Chrome 152 test, the caller's `AbortController` cancelled the caller-facing promise but the registered callback received no execution signal. ReviewPlane therefore keeps explicit single-waiter state and page-unload cleanup. Phase 5 must preserve those safeguards and repeat cancellation testing in the submission browser.

## Agent-selection boundary

The Chrome WebMCP host contract was tested directly with `getTools()` and `executeTool()`. The Codex Chrome-control surface used in this task does not expose page-registered tools as native task tool calls, so natural-language model selection was not separately measured here. That probabilistic selection check remains part of the Phase 5 and final end-to-end verification. No source-editing handoff was simulated.

## Acceptance decision

Phase 1 passes the first allowed acceptance outcome: a real Chrome WebMCP execution remained pending for more than two minutes, Done resolved that same execution, and the active Codex task continued. The cancellation mismatch is documented as a compatibility risk rather than treated as a false pass.

## Phase 5 bridge verification

The Chrome 152 test was repeated after replacing the single-tool probe with the production bridge.

| Step | Result | Evidence |
| --- | --- | --- |
| Discover four tools | Pass | `getTools()` returned `wait_for_review`, `get_review_batch`, `get_correction`, and `acknowledge_review`. |
| Existing ready batch | Pass | `wait_for_review` immediately returned a persisted four-correction batch after reload. |
| Retrieve compact data | Pass | The host fetched the batch summary, then each correction separately by ID. |
| Acknowledge without false application | Pass | The transport-only test recorded all four corrections as unresolved and finalized the batch as `partial`. |
| Pending human flow | Pass | A second `wait_for_review` remained pending; the overlay showed “Agent waiting · connected.” Selecting real landing-page text and pressing Done resumed the same host execution with one correction. |
| Retrieve and acknowledge pending batch | Pass | The resumed host fetched that correction and honestly acknowledged it as unresolved because no source edit was attempted. |

Chrome serializes callback return objects as JSON strings at the `executeTool()` host boundary. The development probe now normalizes that documented host result before chaining retrieval calls. The browser again did not expose the callback execution signal during caller cancellation, so unload cleanup and duplicate-wait protection remain necessary.
