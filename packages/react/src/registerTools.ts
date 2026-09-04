import { reviewBridge } from './reviewBridge.js'
import type { ModelContext, ToolExecutionOptions, WebMcpTool } from './webmcp-types.js'

const signalFrom = (execution: ToolExecutionOptions) => execution instanceof AbortSignal ? execution : execution?.signal

export function createReviewPlaneTools(): WebMcpTool[] {
  return [
    {
      name: 'wait_for_review', title: 'Wait for a visual review',
      description: 'Wait until the human submits a ReviewPlane batch. Returns an existing ready batch immediately. Only one waiter may be active.',
      inputSchema: { type: 'object', properties: { requestId: { type: 'string', description: 'Optional caller correlation ID.', maxLength: 128 } }, additionalProperties: false },
      annotations: { readOnlyHint: true, untrustedContentHint: true, consequentialHint: false },
      execute: (input, execution) => reviewBridge.wait(input, { signal: signalFrom(execution) }),
    },
    {
      name: 'get_review_batch', title: 'Get review batch summary',
      description: 'Return compact metadata and correction IDs for the ready ReviewPlane batch. Retrieve each correction separately.',
      inputSchema: { type: 'object', properties: { batchId: { type: 'string', description: 'Optional ready batch ID.' } }, additionalProperties: false },
      annotations: { readOnlyHint: true, untrustedContentHint: true, consequentialHint: false },
      execute: async (input) => reviewBridge.getBatch(typeof input.batchId === 'string' ? input.batchId : undefined),
    },
    {
      name: 'get_correction', title: 'Get one review correction',
      description: 'Return one human-authored correction with its source hint, target, values, scope, styles, and relevant page context.',
      inputSchema: { type: 'object', required: ['correctionId'], properties: { correctionId: { type: 'string', description: 'Correction ID from get_review_batch.' } }, additionalProperties: false },
      annotations: { readOnlyHint: true, untrustedContentHint: true, consequentialHint: false },
      execute: async (input) => reviewBridge.getCorrection(String(input.correctionId ?? '')),
    },
    {
      name: 'acknowledge_review', title: 'Record review outcome',
      description: 'Record which corrections were applied, unresolved, or failed after repository validation. Finalizes the batch status.',
      inputSchema: {
        type: 'object', required: ['batchId', 'applied', 'unresolved', 'failed', 'validationSummary'], additionalProperties: false,
        properties: {
          batchId: { type: 'string', description: 'Ready batch ID.' },
          applied: { type: 'array', items: { type: 'string' }, description: 'Applied correction IDs.' },
          unresolved: { type: 'array', items: { type: 'string' }, description: 'Unresolved correction IDs.' },
          failed: { type: 'array', items: { type: 'string' }, description: 'Failed correction IDs.' },
          validationSummary: { type: 'string', description: 'Concise checks and results.', maxLength: 500 },
          failureReason: { type: 'string', description: 'Optional concise failure reason.', maxLength: 300 },
        },
      },
      annotations: { readOnlyHint: false, untrustedContentHint: true, consequentialHint: false },
      execute: async (input) => reviewBridge.acknowledge(input),
    },
  ]
}

export async function registerReviewPlaneTools(modelContext: ModelContext, signal?: AbortSignal) {
  await Promise.all(createReviewPlaneTools().map((tool) => modelContext.registerTool(tool, { signal })))
}
