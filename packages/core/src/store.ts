import type {
  Correction,
  CorrectionEdit,
  DraftContext,
  NewCorrection,
  PreviewBaseline,
  PreviewValues,
  ReviewBatch,
  ReviewBatchStatus,
  SubmittedReview,
  Viewport,
} from './types.ts'

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

type DraftEntry = {
  correction: Correction
  active: boolean
}

type DraftState = {
  id: string
  route: string
  viewport: Viewport
  entries: DraftEntry[]
  baselines: PreviewBaseline[]
}

type PersistedState = {
  version: 1
  draft: DraftState | null
  submitted: SubmittedReview[]
}

export type ReviewStoreOptions = {
  storage?: StorageLike
  storageKey?: string
  createId?: (prefix: 'draft' | 'correction' | 'batch') => string
  now?: () => string
}

export class ReviewDomainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ReviewDomainError'
  }
}

const DEFAULT_STORAGE_KEY = 'reviewplane:review-state:v1'

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function deepFreeze<T>(value: T): Readonly<T> {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const nested of Object.values(value as Record<string, unknown>)) deepFreeze(nested)
  }
  return value
}

function assertViewport(viewport: Viewport) {
  if (!Number.isFinite(viewport.width) || !Number.isFinite(viewport.height) || viewport.width <= 0 || viewport.height <= 0) {
    throw new ReviewDomainError('Viewport width and height must be positive finite numbers.')
  }
}

function assertContext(context: DraftContext) {
  if (!context.route) throw new ReviewDomainError('A draft requires a route.')
  assertViewport(context.viewport)
}

function assertCorrection(correction: Correction, draft: DraftState) {
  if (!correction.id) throw new ReviewDomainError('A correction requires a stable ID.')
  if (!correction.sourceRecord?.id || !correction.sourceRecord.file) throw new ReviewDomainError('A correction requires a source record.')
  if (!correction.runtimeOccurrenceId) throw new ReviewDomainError('A correction requires a runtime occurrence ID.')
  if (correction.route !== draft.route) throw new ReviewDomainError('Correction route does not match the active draft.')
  if (correction.viewport.width !== draft.viewport.width || correction.viewport.height !== draft.viewport.height) {
    throw new ReviewDomainError('Correction viewport does not match the active draft.')
  }
  if (correction.kind === 'text-replacement') {
    const validOffsets = Number.isInteger(correction.selectionStart)
      && Number.isInteger(correction.selectionEnd)
      && correction.selectionStart >= 0
      && correction.selectionEnd >= correction.selectionStart
      && correction.selectionEnd <= correction.originalValue.length
    if (!validOffsets) throw new ReviewDomainError('Text replacement offsets are outside the original value.')
    if (correction.originalValue.slice(correction.selectionStart, correction.selectionEnd) !== correction.selectedText) {
      throw new ReviewDomainError('Selected text does not match the supplied offsets.')
    }
  }
  if (correction.kind === 'group-instruction' && correction.targets.length === 0) {
    throw new ReviewDomainError('A group instruction requires at least one target.')
  }
}

const transitions: Record<ReviewBatchStatus, ReviewBatchStatus[]> = {
  draft: ['ready'],
  ready: ['applying'],
  applying: ['applied', 'partial', 'failed'],
  applied: [],
  partial: [],
  failed: [],
}

export class ReviewStore {
  private draft: DraftState | null = null
  private submitted: SubmittedReview[] = []
  private readonly storage?: StorageLike
  private readonly storageKey: string
  private readonly createId: NonNullable<ReviewStoreOptions['createId']>
  private readonly now: NonNullable<ReviewStoreOptions['now']>

  constructor(options: ReviewStoreOptions = {}) {
    this.storage = options.storage
    this.storageKey = options.storageKey ?? DEFAULT_STORAGE_KEY
    this.createId = options.createId ?? ((prefix) => `${prefix}-${globalThis.crypto.randomUUID()}`)
    this.now = options.now ?? (() => new Date().toISOString())
    this.restore()
  }

  beginDraft(context: DraftContext) {
    assertContext(context)
    if (this.draft) throw new ReviewDomainError('A draft is already active.')
    this.draft = {
      id: this.createId('draft'),
      route: context.route,
      viewport: clone(context.viewport),
      entries: [],
      baselines: clone(context.baselines ?? []),
    }
    this.persist()
    return this.getDraft()
  }

  getDraft() {
    return this.draft ? deepFreeze(clone(this.draft)) : null
  }

  getActiveCorrections() {
    if (!this.draft) return [] as ReadonlyArray<Readonly<Correction>>
    return deepFreeze(clone(this.draft.entries.filter((entry) => entry.active).map((entry) => entry.correction)))
  }

  getAllCorrections() {
    if (!this.draft) return [] as ReadonlyArray<Readonly<DraftEntry>>
    return deepFreeze(clone(this.draft.entries))
  }

  createCorrection(input: NewCorrection) {
    const draft = this.requireDraft()
    const correction = { ...clone(input), id: this.createId('correction') } as Correction
    assertCorrection(correction, draft)
    if (draft.entries.some((entry) => entry.correction.id === correction.id)) {
      throw new ReviewDomainError(`Correction ${correction.id} already exists.`)
    }
    draft.entries.push({ correction, active: true })
    this.persist()
    return deepFreeze(clone(correction))
  }

  editCorrection(id: string, edit: CorrectionEdit) {
    const entry = this.requireActiveEntry(id)
    const updated = { ...entry.correction, ...clone(edit), id: entry.correction.id, kind: entry.correction.kind } as Correction
    assertCorrection(updated, this.requireDraft())
    entry.correction = updated
    this.persist()
    return deepFreeze(clone(updated))
  }

  removeCorrection(id: string) {
    const draft = this.requireDraft()
    const index = draft.entries.findIndex((entry) => entry.correction.id === id)
    if (index < 0) throw new ReviewDomainError(`Unknown correction: ${id}.`)
    const [removed] = draft.entries.splice(index, 1)
    this.persist()
    return deepFreeze(clone(removed.correction))
  }

  undoCorrection(id?: string) {
    const draft = this.requireDraft()
    const entry = id
      ? draft.entries.find((candidate) => candidate.correction.id === id)
      : [...draft.entries].reverse().find((candidate) => candidate.active)
    if (!entry) throw new ReviewDomainError(id ? `Unknown correction: ${id}.` : 'There is no active correction to undo.')
    if (!entry.active) throw new ReviewDomainError(`Correction ${entry.correction.id} is already undone.`)
    entry.active = false
    this.persist()
    return deepFreeze(clone(entry.correction))
  }

  resetDraft() {
    const draft = this.requireDraft()
    draft.entries = []
    this.persist()
  }

  registerBaseline(baseline: PreviewBaseline) {
    const draft = this.requireDraft()
    const index = draft.baselines.findIndex((candidate) => candidate.runtimeOccurrenceId === baseline.runtimeOccurrenceId)
    if (index >= 0) draft.baselines[index] = clone(baseline)
    else draft.baselines.push(clone(baseline))
    this.persist()
  }

  computePreview(runtimeOccurrenceId: string): Readonly<PreviewValues> {
    const draft = this.requireDraft()
    const baseline = draft.baselines.find((candidate) => candidate.runtimeOccurrenceId === runtimeOccurrenceId)
    if (!baseline) throw new ReviewDomainError(`No preview baseline exists for ${runtimeOccurrenceId}.`)
    const preview: PreviewValues = {
      ...(baseline.text === undefined ? {} : { text: baseline.text }),
      ...(baseline.foregroundColor === undefined ? {} : { foregroundColor: baseline.foregroundColor }),
      ...(baseline.backgroundColor === undefined ? {} : { backgroundColor: baseline.backgroundColor }),
      ...(baseline.fontSize === undefined ? {} : { fontSize: baseline.fontSize }),
    }
    const textCorrections: Extract<Correction, { kind: 'text-replacement' }>[] = []

    for (const { correction, active } of draft.entries) {
      if (!active || correction.staleTarget || correction.previewStatus === 'failed') continue
      const targetsOccurrence = correction.scope === 'element'
        ? correction.runtimeOccurrenceId === baseline.runtimeOccurrenceId
        : correction.sourceRecord.id === baseline.sourceId
      if (!targetsOccurrence) continue

      switch (correction.kind) {
        case 'text-replacement':
          textCorrections.push(correction)
          break
        case 'foreground-color':
          preview.foregroundColor = correction.requestedValue
          break
        case 'background-color':
          preview.backgroundColor = correction.requestedValue
          break
        case 'font-size':
          preview.fontSize = correction.requestedValue
          break
        case 'group-instruction':
          break
      }
    }

    if (preview.text !== undefined) {
      for (const correction of textCorrections.sort((left, right) => right.selectionStart - left.selectionStart)) {
        if (preview.text.slice(correction.selectionStart, correction.selectionEnd) !== correction.selectedText) continue
        preview.text = preview.text.slice(0, correction.selectionStart)
          + correction.requestedValue
          + preview.text.slice(correction.selectionEnd)
      }
    }

    return deepFreeze(preview)
  }

  markCorrectionStale(id: string, staleTarget = true) {
    const entry = this.requireEntry(id)
    entry.correction = {
      ...entry.correction,
      staleTarget,
    }
    this.persist()
    return deepFreeze(clone(entry.correction))
  }

  submit(): Readonly<SubmittedReview> {
    const draft = this.requireDraft()
    const corrections = draft.entries.filter((entry) => entry.active).map((entry) => clone(entry.correction))
    if (corrections.length === 0) throw new ReviewDomainError('Cannot submit an empty review.')

    const batch: ReviewBatch = {
      id: this.createId('batch'),
      createdAt: this.now(),
      route: draft.route,
      viewport: clone(draft.viewport),
      correctionIds: corrections.map((correction) => correction.id),
      status: 'ready',
    }
    const submitted = deepFreeze({ batch, corrections }) as SubmittedReview
    this.submitted.push(submitted)
    this.draft = null
    this.persist()
    return submitted
  }

  acknowledge(batchId: string) {
    return this.transitionBatch(batchId, 'applying')
  }

  transitionBatch(batchId: string, status: ReviewBatchStatus) {
    const index = this.submitted.findIndex(({ batch }) => batch.id === batchId)
    if (index < 0) throw new ReviewDomainError(`Unknown batch: ${batchId}.`)
    const current = this.submitted[index]
    if (!transitions[current.batch.status].includes(status)) {
      throw new ReviewDomainError(`Invalid batch transition: ${current.batch.status} -> ${status}.`)
    }
    const next = deepFreeze({
      batch: { ...clone(current.batch), status },
      corrections: clone(current.corrections),
    }) as SubmittedReview
    this.submitted[index] = next
    this.persist()
    return deepFreeze(clone(next))
  }

  getSubmitted(batchId: string) {
    const submitted = this.submitted.find(({ batch }) => batch.id === batchId)
    return submitted ? deepFreeze(clone(submitted)) : null
  }

  private requireDraft() {
    if (!this.draft) throw new ReviewDomainError('No draft is active.')
    return this.draft
  }

  private requireEntry(id: string) {
    const entry = this.requireDraft().entries.find((candidate) => candidate.correction.id === id)
    if (!entry) throw new ReviewDomainError(`Unknown correction: ${id}.`)
    return entry
  }

  private requireActiveEntry(id: string) {
    const entry = this.requireEntry(id)
    if (!entry.active) throw new ReviewDomainError(`Correction ${id} is undone.`)
    return entry
  }

  private persist() {
    if (!this.storage) return
    const state: PersistedState = { version: 1, draft: this.draft, submitted: this.submitted }
    try {
      this.storage.setItem(this.storageKey, JSON.stringify(state))
    } catch {
      // Storage can be unavailable in private or restricted browser contexts.
    }
  }

  private restore() {
    if (!this.storage) return
    try {
      const serialized = this.storage.getItem(this.storageKey)
      if (!serialized) return
      const state = JSON.parse(serialized) as PersistedState
      if (state.version !== 1) return
      this.draft = clone(state.draft)
      this.submitted = state.submitted.map((submitted) => deepFreeze(clone(submitted)) as SubmittedReview)
    } catch {
      this.storage.removeItem(this.storageKey)
    }
  }
}

export function browserSessionStorage(): StorageLike | undefined {
  try {
    return typeof sessionStorage === 'undefined' ? undefined : sessionStorage
  } catch {
    return undefined
  }
}
