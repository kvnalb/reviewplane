# WebMCP tools

ReviewPlane registers four page tools when `document.modelContext` is available.

| Tool | Purpose |
| --- | --- |
| `wait_for_review` | Wait for Done, or return an existing ready batch immediately |
| `get_review_batch` | Compact batch summary + correction IDs |
| `get_correction` | One correction with source hint and requested values |
| `acknowledge_review` | Record applied / unresolved / failed outcomes |

## Honest Done behavior

1. Freeze the staged corrections into an immutable batch.
2. If a waiter exists, resolve `wait_for_review`.
3. Otherwise keep the batch ready and show copy/download UI.
4. Never claim that Done woke an idle agent.

## Chrome local development

Enable:

```text
chrome://flags/#enable-webmcp-testing
```

Feature-detect `document.modelContext`. When unavailable, ReviewPlane stays in local browser mode.
