export type ReviewScope = 'element' | 'matching-instances'

export type Viewport = {
  width: number
  height: number
}

export type SourceRecord = {
  id: string
  file: string
  line: number
  column: number
  tag: string
  component?: string
  fingerprint: string
}

export type PreviewStatus = 'not-previewed' | 'active' | 'failed'

export type CorrectionTarget = {
  sourceRecord: SourceRecord
  runtimeOccurrenceId: string
  relevantComputedStyles: Record<string, string>
  componentAncestry: string[]
  domAncestry: string[]
}

type CorrectionBase = CorrectionTarget & {
  id: string
  originalValue: string
  requestedValue: string
  scope: ReviewScope
  route: string
  viewport: Viewport
  humanInstruction?: string
  previewStatus: PreviewStatus
  staleTarget: boolean
}

export type TextReplacementCorrection = CorrectionBase & {
  kind: 'text-replacement'
  selectedText: string
  selectionStart: number
  selectionEnd: number
  textFingerprint: string
}

export type ForegroundColorCorrection = CorrectionBase & {
  kind: 'foreground-color'
}

export type BackgroundColorCorrection = CorrectionBase & {
  kind: 'background-color'
}

export type FontSizeCorrection = CorrectionBase & {
  kind: 'font-size'
}

export type GroupInstructionCorrection = CorrectionBase & {
  kind: 'group-instruction'
  targets: CorrectionTarget[]
  selectedText?: string
}

export type Correction =
  | TextReplacementCorrection
  | ForegroundColorCorrection
  | BackgroundColorCorrection
  | FontSizeCorrection
  | GroupInstructionCorrection

type WithoutId<T> = T extends unknown ? Omit<T, 'id'> : never
export type NewCorrection = WithoutId<Correction>

export type ReviewBatchStatus = 'draft' | 'ready' | 'applying' | 'applied' | 'partial' | 'failed'

export type ReviewBatch = {
  id: string
  createdAt: string
  route: string
  viewport: Viewport
  correctionIds: string[]
  status: ReviewBatchStatus
}

export type SubmittedReview = {
  batch: ReviewBatch
  corrections: Correction[]
}

export type PreviewBaseline = {
  sourceId: string
  runtimeOccurrenceId: string
  text?: string
  foregroundColor?: string
  backgroundColor?: string
  fontSize?: string
}

export type PreviewValues = Omit<PreviewBaseline, 'sourceId' | 'runtimeOccurrenceId'>

export type DraftContext = {
  route: string
  viewport: Viewport
  baselines?: PreviewBaseline[]
}

export type CorrectionEdit = Partial<Pick<Correction,
  'requestedValue' | 'scope' | 'humanInstruction' | 'previewStatus'
>>
