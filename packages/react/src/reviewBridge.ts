import type { Correction, ReviewStore, SubmittedReview } from '@reviewplane/core'

export type BridgeStatus = 'unavailable' | 'ready' | 'waiting' | 'batch-ready' | 'acknowledged'
type Waiter = { resolve: (value: unknown) => void; startedAt: number; requestId?: string }
type Acknowledgement = {
  batchId: string
  applied: string[]
  unresolved: string[]
  failed: string[]
  validationSummary: string
  failureReason?: string
}

let store: ReviewStore | null = null
let current: Readonly<SubmittedReview> | null = null
let waiter: Waiter | null = null
let status: BridgeStatus = 'unavailable'
const listeners = new Set<(next: BridgeStatus) => void>()
const acknowledgements = new Map<string, Acknowledgement>()

const announce = (next: BridgeStatus) => { status = next; listeners.forEach((listener) => listener(next)) }

function batchSummary(review: Readonly<SubmittedReview>) {
  const counts: Record<string, number> = {}
  review.corrections.forEach((correction) => { counts[correction.kind] = (counts[correction.kind] ?? 0) + 1 })
  return {
    status: 'review_ready',
    batchId: review.batch.id,
    batchStatus: review.batch.status,
    route: review.batch.route,
    viewport: review.batch.viewport,
    summary: counts,
    correctionIds: review.batch.correctionIds,
  }
}

function compactCorrection(correction: Readonly<Correction>) {
  const clip = (value: string | undefined, length = 300) => value === undefined ? undefined : value.slice(0, length)
  const base = {
    id: correction.id,
    kind: correction.kind,
    target: { tag: correction.sourceRecord.tag, component: correction.sourceRecord.component, occurrenceId: correction.runtimeOccurrenceId },
    sourceHint: `${correction.sourceRecord.file}:${correction.sourceRecord.line}:${correction.sourceRecord.column}`,
    sourceFingerprint: correction.sourceRecord.fingerprint,
    originalValue: clip(correction.originalValue),
    requestedValue: clip(correction.requestedValue),
    scope: correction.scope,
    route: correction.route,
    viewport: correction.viewport,
    styles: Object.fromEntries(Object.entries(correction.relevantComputedStyles).slice(0, 6)),
    ancestry: correction.domAncestry.slice(-3),
    humanInstruction: clip(correction.humanInstruction),
    contentTruncated: correction.originalValue.length > 300 || correction.requestedValue.length > 300 || (correction.humanInstruction?.length ?? 0) > 300,
    staleTarget: correction.staleTarget,
  }
  return correction.kind === 'text-replacement'
    ? { ...base, selection: { text: correction.selectedText, start: correction.selectionStart, end: correction.selectionEnd, fingerprint: correction.textFingerprint } }
    : correction.kind === 'group-instruction'
      ? { ...base, targetCount: correction.targets.length, targets: correction.targets.slice(0, 8).map((target) => ({ occurrenceId: target.runtimeOccurrenceId, sourceHint: `${target.sourceRecord.file}:${target.sourceRecord.line}:${target.sourceRecord.column}` })) }
      : base
}

export const reviewBridge = {
  attach(nextStore: ReviewStore, available: boolean) {
    store = nextStore
    current ??= nextStore.getLatestSubmitted()
    announce(available ? (current?.batch.status === 'ready' ? 'batch-ready' : 'ready') : 'unavailable')
  },
  subscribe(listener: (next: BridgeStatus) => void) { listeners.add(listener); listener(status); return () => listeners.delete(listener) },
  publish(review: Readonly<SubmittedReview>) {
    current = review
    const summary = batchSummary(review)
    if (waiter) {
      const pending = waiter
      waiter = null
      pending.resolve({ ...summary, waitedMs: Date.now() - pending.startedAt, requestId: pending.requestId })
    }
    announce('batch-ready')
    return summary
  },
  wait(input: Record<string, unknown>, options: { signal?: AbortSignal }) {
    if (current?.batch.status === 'ready') return Promise.resolve(batchSummary(current))
    if (waiter) return Promise.resolve({ status: 'rejected', code: 'review_already_pending', message: 'Another review is already waiting.' })
    if (options.signal?.aborted) return Promise.resolve({ status: 'cancelled', code: 'review_cancelled' })
    announce('waiting')
    return new Promise((resolve) => {
      const pending: Waiter = { resolve, startedAt: Date.now(), requestId: typeof input.requestId === 'string' ? input.requestId : undefined }
      waiter = pending
      options.signal?.addEventListener('abort', () => {
        if (waiter !== pending) return
        waiter = null
        announce('ready')
        resolve({ status: 'cancelled', code: 'review_cancelled', message: 'The pending review was cancelled.' })
      }, { once: true })
    })
  },
  getBatch(batchId?: string) {
    if (!current || (batchId && current.batch.id !== batchId)) return { status: 'not_found', message: 'No matching review batch is ready.' }
    return batchSummary(current)
  },
  getCorrection(id: string) {
    const correction = current?.corrections.find((candidate) => candidate.id === id)
    return correction ? { status: 'ok', correction: compactCorrection(correction) } : { status: 'not_found', message: 'No matching correction exists.' }
  },
  acknowledge(input: Record<string, unknown>) {
    if (!current || input.batchId !== current.batch.id || !store) return { status: 'not_found', message: 'No matching review batch is ready.' }
    const strings = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
    const acknowledgement: Acknowledgement = {
      batchId: current.batch.id,
      applied: strings(input.applied), unresolved: strings(input.unresolved), failed: strings(input.failed),
      validationSummary: typeof input.validationSummary === 'string' ? input.validationSummary : '',
      ...(typeof input.failureReason === 'string' ? { failureReason: input.failureReason } : {}),
    }
    store.acknowledge(current.batch.id)
    const finalStatus = acknowledgement.failed.length || acknowledgement.failureReason
      ? acknowledgement.applied.length ? 'partial' : 'failed'
      : acknowledgement.unresolved.length ? 'partial' : 'applied'
    current = store.transitionBatch(current.batch.id, finalStatus)
    acknowledgements.set(current.batch.id, acknowledgement)
    announce('acknowledged')
    return { status: finalStatus, batchId: current.batch.id, recorded: acknowledgement }
  },
  detach() {
    if (waiter) { waiter.resolve({ status: 'cancelled', code: 'page_unloaded', message: 'The page unloaded.' }); waiter = null }
    store = null
    announce('unavailable')
  },
}
