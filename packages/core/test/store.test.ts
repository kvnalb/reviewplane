import { describe, expect, it } from 'vitest'
import {
  ReviewDomainError,
  ReviewStore,
  type NewCorrection,
  type PreviewBaseline,
  type SourceRecord,
  type StorageLike,
} from '../src/index.ts'

class MemoryStorage implements StorageLike {
  private values = new Map<string, string>()
  getItem(key: string) { return this.values.get(key) ?? null }
  setItem(key: string, value: string) { this.values.set(key, value) }
  removeItem(key: string) { this.values.delete(key) }
}

const viewport = { width: 1280, height: 800 }
const sourceRecord: SourceRecord = {
  id: 'source-card',
  file: 'src/Card.tsx',
  line: 12,
  column: 5,
  tag: 'article',
  component: 'Card',
  fingerprint: 'fingerprint-card',
}
const baseline: PreviewBaseline = {
  sourceId: sourceRecord.id,
  runtimeOccurrenceId: 'source-card:1',
  text: 'Review this card',
  foregroundColor: '#111111',
  backgroundColor: '#ffffff',
  fontSize: '16px',
}

function idFactory() {
  let sequence = 0
  return (prefix: 'draft' | 'correction' | 'batch') => `${prefix}-${++sequence}`
}

function store(storage?: StorageLike) {
  return new ReviewStore({
    storage,
    createId: idFactory(),
    now: () => '2026-09-03T20:00:00.000Z',
  })
}

function correction(kind: 'foreground-color' | 'background-color' | 'font-size', requestedValue: string, scope: 'element' | 'matching-instances' = 'element'): NewCorrection {
  return {
    kind,
    sourceRecord,
    runtimeOccurrenceId: baseline.runtimeOccurrenceId,
    originalValue: kind === 'foreground-color' ? '#111111' : kind === 'background-color' ? '#ffffff' : '16px',
    requestedValue,
    scope,
    route: '/pricing',
    viewport,
    relevantComputedStyles: {
      color: '#111111',
      backgroundColor: '#ffffff',
      fontSize: '16px',
    },
    componentAncestry: ['App', 'Card'],
    domAncestry: ['main', 'section', 'article'],
    previewStatus: 'active',
    staleTarget: false,
  }
}

function begin(reviewStore: ReviewStore) {
  reviewStore.beginDraft({ route: '/pricing', viewport, baselines: [baseline] })
  return reviewStore
}

describe('ReviewStore draft operations', () => {
  it('creates, edits, and removes corrections', () => {
    const reviewStore = begin(store())
    const created = reviewStore.createCorrection(correction('foreground-color', '#cc0000'))
    const edited = reviewStore.editCorrection(created.id, { requestedValue: '#dd0000', humanInstruction: 'Use the danger color.' })

    expect(created.id).toBe('correction-2')
    expect(edited.requestedValue).toBe('#dd0000')
    expect(reviewStore.getActiveCorrections()).toHaveLength(1)
    expect(reviewStore.removeCorrection(created.id).id).toBe(created.id)
    expect(reviewStore.getActiveCorrections()).toEqual([])
  })

  it('undoes the latest correction by replaying from the baseline', () => {
    const reviewStore = begin(store())
    reviewStore.createCorrection(correction('foreground-color', '#cc0000'))
    reviewStore.createCorrection(correction('font-size', '20px'))

    reviewStore.undoCorrection()

    expect(reviewStore.computePreview(baseline.runtimeOccurrenceId)).toEqual({
      text: 'Review this card',
      foregroundColor: '#cc0000',
      backgroundColor: '#ffffff',
      fontSize: '16px',
    })
  })

  it('undoes a middle correction without reversing later corrections', () => {
    const reviewStore = begin(store())
    reviewStore.createCorrection(correction('foreground-color', '#cc0000'))
    const middle = reviewStore.createCorrection(correction('background-color', '#eeeeee'))
    reviewStore.createCorrection(correction('font-size', '20px'))

    reviewStore.undoCorrection(middle.id)

    expect(reviewStore.computePreview(baseline.runtimeOccurrenceId)).toEqual({
      text: 'Review this card',
      foregroundColor: '#cc0000',
      backgroundColor: '#ffffff',
      fontSize: '20px',
    })
    expect(reviewStore.getAllCorrections().find(({ correction }) => correction.id === middle.id)?.active).toBe(false)
  })

  it('resets every correction while preserving the draft baseline', () => {
    const reviewStore = begin(store())
    reviewStore.createCorrection(correction('foreground-color', '#cc0000'))
    reviewStore.resetDraft()

    expect(reviewStore.getActiveCorrections()).toEqual([])
    expect(reviewStore.computePreview(baseline.runtimeOccurrenceId).foregroundColor).toBe('#111111')
  })

  it('applies matching-instance corrections to another occurrence of the same source', () => {
    const second = { ...baseline, runtimeOccurrenceId: 'source-card:2', foregroundColor: '#222222' }
    const reviewStore = store()
    reviewStore.beginDraft({ route: '/pricing', viewport, baselines: [baseline, second] })
    reviewStore.createCorrection(correction('foreground-color', '#cc0000', 'matching-instances'))

    expect(reviewStore.computePreview(second.runtimeOccurrenceId).foregroundColor).toBe('#cc0000')
  })

  it('validates selected text offsets', () => {
    const reviewStore = begin(store())
    const textCorrection: NewCorrection = {
      ...correction('foreground-color', 'fixed'),
      kind: 'text-replacement',
      originalValue: 'Review this card',
      requestedValue: 'Inspect',
      selectedText: 'Review',
      selectionStart: 0,
      selectionEnd: 6,
      textFingerprint: 'text-fingerprint',
    }

    const created = reviewStore.createCorrection(textCorrection)
    expect(reviewStore.computePreview(created.runtimeOccurrenceId).text).toBe('Inspect this card')
    expect(() => reviewStore.createCorrection({ ...textCorrection, selectedText: 'Wrong' })).toThrow(ReviewDomainError)
  })
})

describe('submission and persistence', () => {
  it('submits an immutable ready batch', () => {
    const reviewStore = begin(store())
    const created = reviewStore.createCorrection(correction('foreground-color', '#cc0000'))
    const submitted = reviewStore.submit()

    expect(submitted.batch).toEqual({
      id: 'batch-3',
      createdAt: '2026-09-03T20:00:00.000Z',
      route: '/pricing',
      viewport,
      correctionIds: [created.id],
      status: 'ready',
    })
    expect(Object.isFrozen(submitted)).toBe(true)
    expect(Object.isFrozen(submitted.corrections[0].sourceRecord)).toBe(true)
    expect(() => reviewStore.editCorrection(created.id, { requestedValue: '#000000' })).toThrow('No draft is active')
  })

  it('restores a draft and submitted reviews from session storage', () => {
    const storage = new MemoryStorage()
    const first = begin(store(storage))
    const created = first.createCorrection(correction('font-size', '18px'))

    const restoredDraft = store(storage)
    expect(restoredDraft.getActiveCorrections()[0].id).toBe(created.id)
    const submitted = restoredDraft.submit()

    const restoredBatch = store(storage).getSubmitted(submitted.batch.id)
    expect(restoredBatch?.batch.status).toBe('ready')
    expect(restoredBatch?.corrections[0].requestedValue).toBe('18px')
  })

  it('acknowledges and completes a batch through valid states', () => {
    const reviewStore = begin(store())
    reviewStore.createCorrection(correction('foreground-color', '#cc0000'))
    const submitted = reviewStore.submit()

    expect(reviewStore.acknowledge(submitted.batch.id).batch.status).toBe('applying')
    expect(submitted.batch.status).toBe('ready')
    expect(reviewStore.transitionBatch(submitted.batch.id, 'applied').batch.status).toBe('applied')
  })
})

describe('stale targets and invalid transitions', () => {
  it('marks stale targets and excludes them from preview replay', () => {
    const reviewStore = begin(store())
    const created = reviewStore.createCorrection(correction('foreground-color', '#cc0000'))

    expect(reviewStore.computePreview(created.runtimeOccurrenceId).foregroundColor).toBe('#cc0000')
    expect(reviewStore.markCorrectionStale(created.id).staleTarget).toBe(true)
    expect(reviewStore.computePreview(created.runtimeOccurrenceId).foregroundColor).toBe('#111111')
    expect(reviewStore.markCorrectionStale(created.id, false).staleTarget).toBe(false)
    expect(reviewStore.computePreview(created.runtimeOccurrenceId).foregroundColor).toBe('#cc0000')
  })

  it('rejects invalid draft and batch transitions', () => {
    const reviewStore = store()
    expect(() => reviewStore.submit()).toThrow('No draft is active')
    begin(reviewStore)
    expect(() => reviewStore.submit()).toThrow('Cannot submit an empty review')
    reviewStore.createCorrection(correction('foreground-color', '#cc0000'))
    const submitted = reviewStore.submit()

    expect(() => reviewStore.transitionBatch(submitted.batch.id, 'applied')).toThrow('Invalid batch transition: ready -> applied')
    reviewStore.acknowledge(submitted.batch.id)
    reviewStore.transitionBatch(submitted.batch.id, 'failed')
    expect(() => reviewStore.acknowledge(submitted.batch.id)).toThrow('Invalid batch transition: failed -> applying')
  })
})
