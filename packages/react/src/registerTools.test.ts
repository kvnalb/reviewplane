import { describe, expect, it } from 'vitest'
import { ReviewStore, type NewCorrection } from '@reviewplane/core'
import { createReviewPlaneTools, registerReviewPlaneTools } from './registerTools.ts'
import { reviewBridge } from './reviewBridge.ts'
import type { ModelContext, WebMcpTool } from './webmcp-types.ts'

const correction: NewCorrection = {
  kind: 'text-replacement',
  sourceRecord: { id: 'source-1', file: 'src/App.tsx', line: 12, column: 3, tag: 'h1', component: 'App', fingerprint: 'source-fingerprint' },
  runtimeOccurrenceId: 'source-1:1', relevantComputedStyles: { color: 'rgb(0, 0, 0)' }, componentAncestry: ['App'], domAncestry: ['main', 'h1'],
  route: '/', viewport: { width: 1200, height: 800 }, originalValue: 'Hello world', requestedValue: 'Hello reviewer', scope: 'element', previewStatus: 'active', staleTarget: false,
  selectedText: 'world', selectionStart: 6, selectionEnd: 11, textFingerprint: '11:abc',
}

describe('WebMCP review tools', () => {
  it('registers, waits, retrieves, acknowledges, cancels, and rejects duplicate waiters', async () => {
    const registered: WebMcpTool[] = []
    const modelContext: ModelContext = {
      registerTool: async (tool) => { registered.push(tool) },
      getTools: async () => [], executeTool: async () => ({}),
    }
    await registerReviewPlaneTools(modelContext)
    expect(registered.map(({ name }) => name)).toEqual(['wait_for_review', 'get_review_batch', 'get_correction', 'acknowledge_review'])
    expect(registered.filter(({ annotations }) => annotations?.untrustedContentHint).length).toBe(4)

    const store = new ReviewStore({ createId: (prefix) => `${prefix}-1`, now: () => '2026-09-03T00:00:00.000Z' })
    store.beginDraft({ route: '/', viewport: { width: 1200, height: 800 } })
    const created = store.createCorrection(correction)
    reviewBridge.attach(store, true)
    const tools = Object.fromEntries(createReviewPlaneTools().map((tool) => [tool.name, tool]))
    const pending = tools.wait_for_review.execute({ requestId: 'test' }, undefined)
    await expect(tools.wait_for_review.execute({}, undefined)).resolves.toMatchObject({ code: 'review_already_pending' })
    const submitted = store.submit()
    reviewBridge.publish(submitted)
    await expect(pending).resolves.toMatchObject({ status: 'review_ready', batchId: 'batch-1', correctionIds: ['correction-1'] })
    await expect(tools.get_review_batch.execute({ batchId: 'batch-1' }, undefined)).resolves.toMatchObject({ batchStatus: 'ready' })
    const detail = await tools.get_correction.execute({ correctionId: created.id }, undefined)
    expect(detail).toMatchObject({ status: 'ok', correction: { requestedValue: 'Hello reviewer', sourceHint: 'src/App.tsx:12:3' } })
    expect(JSON.stringify(detail).length).toBeLessThan(1500)
    await expect(tools.acknowledge_review.execute({ batchId: 'batch-1', applied: [created.id], unresolved: [], failed: [], validationSummary: 'typecheck and tests passed' }, undefined)).resolves.toMatchObject({ status: 'applied' })

    const controller = new AbortController()
    const cancelled = tools.wait_for_review.execute({}, { signal: controller.signal })
    controller.abort()
    await expect(cancelled).resolves.toMatchObject({ code: 'review_cancelled' })
    reviewBridge.detach()
  })
})
