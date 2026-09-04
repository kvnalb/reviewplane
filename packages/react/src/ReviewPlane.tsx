import {
  browserSessionStorage,
  ReviewStore,
  type Correction,
  type CorrectionTarget,
  type NewCorrection,
  type ReviewScope,
  type SourceRecord,
  type SubmittedReview,
} from '@reviewplane/core'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  clampPopup,
  intersectionRatio,
  isVisibleTarget,
  LASSO_INTERSECTION_THRESHOLD,
  mappedElement,
  rectangleFromPoints,
  removeRedundantTargets,
  type Rectangle,
} from './geometry.js'
import { overlayStyles } from './styles.js'
import { reviewBridge, type BridgeStatus } from './reviewBridge.js'

type Mode = 'idle' | 'inspect' | 'text' | 'lasso'
type Point = { x: number; y: number }
type PickedTarget = { element: HTMLElement; source: SourceRecord; occurrenceId: string }
type DirectSelection = { kind: 'direct'; target: PickedTarget; range?: Range; start?: number; end?: number; selectedText?: string }
type GroupSelection = { kind: 'group'; targets: PickedTarget[]; range?: Range; selectedText?: string }
type SelectionState = DirectSelection | GroupSelection

type ManifestResponse = { records: SourceRecord[] }

function viewport() {
  return { width: window.innerWidth, height: window.innerHeight }
}

function route() {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`
}

function textFingerprint(value: string) {
  let hash = 2166136261
  for (const character of value) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619)
  return `${value.length}:${(hash >>> 0).toString(16)}`
}

function directTextNode(element: HTMLElement) {
  const nodes = [...element.childNodes].filter((node) => node.nodeType === Node.TEXT_NODE && node.nodeValue?.trim())
  return nodes.length === 1 ? nodes[0] as Text : null
}

function offsetsWithin(element: HTMLElement, range: Range) {
  const prefix = range.cloneRange()
  prefix.selectNodeContents(element)
  prefix.setEnd(range.startContainer, range.startOffset)
  return { start: prefix.toString().length, end: prefix.toString().length + range.toString().length }
}

function ancestry(element: HTMLElement) {
  const dom: string[] = []
  let current: HTMLElement | null = element
  while (current && dom.length < 6) {
    const suffix = current.id ? `#${current.id}` : current.classList.length ? `.${[...current.classList].slice(0, 2).join('.')}` : ''
    dom.unshift(`${current.tagName.toLowerCase()}${suffix}`)
    current = current.parentElement
  }
  return dom
}

function correctionTarget(target: PickedTarget): CorrectionTarget {
  const style = getComputedStyle(target.element)
  return {
    sourceRecord: target.source,
    runtimeOccurrenceId: target.occurrenceId,
    relevantComputedStyles: {
      color: style.color,
      backgroundColor: style.backgroundColor,
      fontSize: style.fontSize,
      display: style.display,
      gap: style.gap,
      padding: style.padding,
    },
    componentAncestry: target.source.component ? [target.source.component] : [],
    domAncestry: ancestry(target.element),
  }
}

function summary(correction: Readonly<Correction>) {
  if (correction.kind === 'group-instruction') return correction.requestedValue
  if (correction.kind === 'text-replacement') return `“${correction.selectedText}” → “${correction.requestedValue}”`
  const names = { 'foreground-color': 'Text color', 'background-color': 'Background', 'font-size': 'Font size' }
  return `${names[correction.kind]} → ${correction.requestedValue}`
}

function targetLabel(source: SourceRecord) {
  if (/^h[1-6]$/.test(source.tag)) return 'Heading'
  return ({ p: 'Paragraph', a: 'Link', button: 'Button', img: 'Image', nav: 'Navigation', section: 'Section', li: 'List item', input: 'Input', textarea: 'Text field' } as Record<string, string>)[source.tag] ?? 'Page element'
}

function correctionLabel(correction: Readonly<Correction>) {
  return ({ 'text-replacement': 'Text change', 'foreground-color': 'Text color', 'background-color': 'Background color', 'font-size': 'Text size', 'group-instruction': 'Group instruction' } as const)[correction.kind]
}

export function ReviewPlane() {
  const [portal, setPortal] = useState<HTMLDivElement | null>(null)
  const [mode, setMode] = useState<Mode>('idle')
  const [manifest, setManifest] = useState<Map<string, SourceRecord>>(new Map())
  const [hover, setHover] = useState<PickedTarget | null>(null)
  const [selection, setSelection] = useState<SelectionState | null>(null)
  const [selectionVersion, setSelectionVersion] = useState(0)
  const [lasso, setLasso] = useState<Rectangle | null>(null)
  const [trayOpen, setTrayOpen] = useState(false)
  const [version, setVersion] = useState(0)
  const [submitted, setSubmitted] = useState<Readonly<SubmittedReview> | null>(null)
  const [deliveryNote, setDeliveryNote] = useState('')
  const [error, setError] = useState('')
  const [bridgeStatus, setBridgeStatus] = useState<BridgeStatus>('unavailable')
  const [editing, setEditing] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [replacement, setReplacement] = useState('')
  const [foreground, setForeground] = useState('')
  const [background, setBackground] = useState('')
  const [fontSize, setFontSize] = useState('')
  const [scope, setScope] = useState<ReviewScope>('element')
  const [instruction, setInstruction] = useState('')
  const hostRef = useRef<HTMLDivElement | null>(null)
  const popupRef = useRef<HTMLDivElement | null>(null)
  const lassoStart = useRef<Point | null>(null)
  const storeRef = useRef<ReviewStore | null>(null)
  const reconciling = useRef(false)

  if (!storeRef.current && typeof window !== 'undefined') {
    storeRef.current = new ReviewStore({ storage: browserSessionStorage() })
    if (!storeRef.current.getDraft()) storeRef.current.beginDraft({ route: route(), viewport: viewport() })
  }
  const store = storeRef.current
  const entries = useMemo(() => store?.getAllCorrections() ?? [], [store, version])
  const active = useMemo(() => entries.filter((entry) => entry.active).map((entry) => entry.correction), [entries])

  const pick = useCallback((element: HTMLElement | null): PickedTarget | null => {
    if (!element || hostRef.current?.contains(element)) return null
    const sourceId = element.dataset.rpSourceId
    const occurrenceId = element.dataset.rpOccurrenceId
    const source = sourceId ? manifest.get(sourceId) : undefined
    return source && occurrenceId ? { element, source, occurrenceId } : null
  }, [manifest])

  const refresh = () => setVersion((value) => value + 1)
  const isOverlayEvent = (event: Event) => Boolean(hostRef.current && event.composedPath().includes(hostRef.current))
  const clearForm = () => {
    setReplacement(''); setForeground(''); setBackground(''); setFontSize(''); setInstruction(''); setScope('element'); setError('')
  }
  const populateDirectForm = (target: PickedTarget, selectedText = '') => {
    const computed = getComputedStyle(target.element)
    setReplacement(selectedText)
    setForeground(computed.color)
    setBackground(computed.backgroundColor)
    setFontSize(computed.fontSize)
    setInstruction('')
    setScope('element')
    setError('')
  }
  const closePopup = () => { setSelection(null); clearForm() }

  useEffect(() => {
    const host = document.createElement('div')
    host.dataset.reviewplaneOverlay = ''
    const shadow = host.attachShadow({ mode: 'open' })
    const style = document.createElement('style')
    style.textContent = overlayStyles
    const root = document.createElement('div')
    shadow.append(style, root)
    document.body.append(host)
    hostRef.current = host
    setPortal(root)
    return () => { host.remove(); document.getElementById('reviewplane-preview-styles')?.remove() }
  }, [])

  useEffect(() => {
    if (!store) return
    reviewBridge.attach(store, Boolean(document.modelContext))
    const unsubscribe = reviewBridge.subscribe((next) => {
      setBridgeStatus(next)
      if (next === 'acknowledged') setSubmitted(store.getLatestSubmitted())
    })
    return () => { unsubscribe(); reviewBridge.detach() }
  }, [store])

  useEffect(() => {
    fetch('/__reviewplane/manifest.json', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() as Promise<ManifestResponse> : Promise.reject(new Error('manifest unavailable')))
      .then(({ records }) => setManifest(new Map(records.map((record) => [record.id, record]))))
      .catch(() => setError('Source mapping is unavailable. Reload the development server.'))
  }, [])

  useEffect(() => {
    const activate = () => { setMode('text'); setTrayOpen(true); setSubmitted(null) }
    const shortcut = (event: KeyboardEvent) => {
      if (event.altKey && event.shiftKey && event.key.toLowerCase() === 'r') { event.preventDefault(); setMode((value) => value === 'idle' ? 'inspect' : 'idle'); setTrayOpen(true) }
      if (event.key === 'Escape') { setMode('idle'); setHover(null); closePopup(); setLasso(null) }
    }
    window.addEventListener('reviewplane:activate', activate)
    window.addEventListener('keydown', shortcut)
    return () => { window.removeEventListener('reviewplane:activate', activate); window.removeEventListener('keydown', shortcut) }
  }, [])

  useEffect(() => {
    if (mode !== 'inspect') return
    const move = (event: MouseEvent) => { if (!isOverlayEvent(event)) setHover(pick(mappedElement(event.target as Node))) }
    const click = (event: MouseEvent) => {
      if (isOverlayEvent(event)) return
      const target = pick(mappedElement(event.target as Node))
      if (!target) return
      event.preventDefault(); event.stopPropagation(); setSelection({ kind: 'direct', target }); populateDirectForm(target); setTrayOpen(true)
    }
    document.addEventListener('mousemove', move, true)
    document.addEventListener('click', click, true)
    return () => { document.removeEventListener('mousemove', move, true); document.removeEventListener('click', click, true) }
  }, [mode, pick])

  useEffect(() => {
    if (mode !== 'text') return
    const selectText = (event: MouseEvent) => {
      if (isOverlayEvent(event)) return
      const nativeSelection = document.getSelection()
      if (!nativeSelection || nativeSelection.isCollapsed || nativeSelection.rangeCount === 0) return
      const range = nativeSelection.getRangeAt(0).cloneRange()
      const startElement = mappedElement(range.startContainer)
      const endElement = mappedElement(range.endContainer)
      if (!startElement || !endElement) { setError('Select text that belongs to a mapped page element.'); return }
      if (startElement === endElement) {
        const target = pick(startElement)
        if (!target || !directTextNode(startElement)) { setError('This element has nested text. Use Lasso and leave an instruction instead.'); return }
        const offsets = offsetsWithin(startElement, range)
        setSelection({ kind: 'direct', target, range, ...offsets, selectedText: range.toString() })
        populateDirectForm(target, range.toString()); setTrayOpen(true)
        return
      }
      const targets = removeRedundantTargets([...document.querySelectorAll<HTMLElement>('[data-rp-source-id]')]
        .filter((element) => { try { return range.intersectsNode(element) } catch { return false } }))
        .map((element) => pick(element as HTMLElement)).filter((target): target is PickedTarget => Boolean(target))
      if (targets.length) { setSelection({ kind: 'group', targets, range, selectedText: range.toString() }); setError(''); setTrayOpen(true) }
    }
    document.addEventListener('mouseup', selectText, true)
    return () => document.removeEventListener('mouseup', selectText, true)
  }, [mode, pick])

  useEffect(() => {
    if (mode !== 'lasso' || selection) return
    const down = (event: PointerEvent) => {
      if (isOverlayEvent(event)) return
      event.preventDefault(); event.stopPropagation(); lassoStart.current = { x: event.clientX, y: event.clientY }; setLasso(rectangleFromPoints(lassoStart.current, lassoStart.current))
    }
    const move = (event: PointerEvent) => { if (lassoStart.current) { event.preventDefault(); setLasso(rectangleFromPoints(lassoStart.current, { x: event.clientX, y: event.clientY })) } }
    const up = (event: PointerEvent) => {
      if (!lassoStart.current) return
      event.preventDefault(); event.stopPropagation()
      const rectangle = rectangleFromPoints(lassoStart.current, { x: event.clientX, y: event.clientY })
      lassoStart.current = null; setLasso(null)
      const targets = removeRedundantTargets([...document.querySelectorAll<HTMLElement>('[data-rp-source-id]')]
        .filter((element) => isVisibleTarget(element) && intersectionRatio(rectangle, element.getBoundingClientRect()) >= LASSO_INTERSECTION_THRESHOLD))
        .map((element) => pick(element as HTMLElement)).filter((target): target is PickedTarget => Boolean(target))
      if (targets.length) { setSelection({ kind: 'group', targets }); clearForm(); setTrayOpen(true) }
      else setError('The region did not cover at least 25% of a mapped element.')
    }
    document.addEventListener('pointerdown', down, true); document.addEventListener('pointermove', move, true); document.addEventListener('pointerup', up, true)
    return () => { document.removeEventListener('pointerdown', down, true); document.removeEventListener('pointermove', move, true); document.removeEventListener('pointerup', up, true) }
  }, [mode, pick, selection])

  const stage = () => {
    if (!store || !selection) return
    const context = { route: route(), viewport: store.getDraft()!.viewport }
    try {
      if (selection.kind === 'group') {
        if (!instruction.trim() || selection.targets.length === 0) throw new Error('Add an instruction for the selected group.')
        const primary = correctionTarget(selection.targets[0])
        store.createCorrection({ kind: 'group-instruction', ...primary, ...context, originalValue: selection.selectedText ?? '', requestedValue: instruction.trim(), humanInstruction: instruction.trim(), scope: 'element', previewStatus: 'not-previewed', staleTarget: false, targets: selection.targets.map(correctionTarget), selectedText: selection.selectedText })
      } else {
        const target = selection.target
        const targetData = correctionTarget(target)
        const computed = getComputedStyle(target.element)
        const baselineText = target.element.textContent ?? ''
        const occurrences = scope === 'element' ? [target.element] : [...document.querySelectorAll<HTMLElement>(`[data-rp-source-id="${target.source.id}"]`)]
        const knownBaselines = store.getDraft()?.baselines ?? []
        for (const element of occurrences) {
          if (!knownBaselines.some((baseline) => baseline.runtimeOccurrenceId === element.dataset.rpOccurrenceId)) {
            store.registerBaseline({ sourceId: target.source.id, runtimeOccurrenceId: element.dataset.rpOccurrenceId!, text: element.textContent ?? '', foregroundColor: getComputedStyle(element).color, backgroundColor: getComputedStyle(element).backgroundColor, fontSize: getComputedStyle(element).fontSize })
          }
        }
        const common = { ...targetData, ...context, scope, staleTarget: false, previewStatus: 'active' as const }
        const requests: NewCorrection[] = []
        if (selection.selectedText && selection.start !== undefined && selection.end !== undefined && replacement !== selection.selectedText) requests.push({ kind: 'text-replacement', ...common, originalValue: baselineText, requestedValue: replacement, selectedText: selection.selectedText, selectionStart: selection.start, selectionEnd: selection.end, textFingerprint: textFingerprint(baselineText) })
        if (foreground.trim() && foreground.trim() !== computed.color) requests.push({ kind: 'foreground-color', ...common, originalValue: computed.color, requestedValue: foreground.trim() })
        if (background.trim() && background.trim() !== computed.backgroundColor) requests.push({ kind: 'background-color', ...common, originalValue: computed.backgroundColor, requestedValue: background.trim() })
        if (fontSize.trim() && fontSize.trim() !== computed.fontSize) requests.push({ kind: 'font-size', ...common, originalValue: computed.fontSize, requestedValue: fontSize.trim() })
        if (!requests.length) throw new Error('Change at least one value before adding the correction.')
        requests.forEach((request) => store.createCorrection(request))
      }
      closePopup(); refresh()
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Could not stage this correction.') }
  }

  const reconcile = useCallback(() => {
    if (!store || reconciling.current) return
    reconciling.current = true
    try {
      document.querySelectorAll<HTMLElement>('[data-rp-preview-id]').forEach((element) => element.removeAttribute('data-rp-preview-id'))
      let styleElement = document.getElementById('reviewplane-preview-styles') as HTMLStyleElement | null
      if (!styleElement) { styleElement = document.createElement('style'); styleElement.id = 'reviewplane-preview-styles'; document.head.append(styleElement) }
      const rules: string[] = []
      const draft = store.getDraft()
      let staleChanged = false
      for (const correction of store.getActiveCorrections()) {
        if (correction.kind !== 'text-replacement' || correction.staleTarget) continue
        const element = document.querySelector<HTMLElement>(`[data-rp-occurrence-id="${correction.runtimeOccurrenceId}"]`)
        const baseline = draft?.baselines.find((candidate) => candidate.runtimeOccurrenceId === correction.runtimeOccurrenceId)
        if (!element || !directTextNode(element) || baseline?.text === undefined || textFingerprint(baseline.text) !== correction.textFingerprint) {
          store.markCorrectionStale(correction.id)
          staleChanged = true
        }
      }
      for (const baseline of draft?.baselines ?? []) {
        const element = document.querySelector<HTMLElement>(`[data-rp-occurrence-id="${baseline.runtimeOccurrenceId}"]`)
        if (!element) continue
        const previews = store.computePreview(baseline.runtimeOccurrenceId)
        const textNode = directTextNode(element)
        if (previews.text !== undefined && textNode && textNode.nodeValue !== previews.text) {
          if (baseline.text !== undefined && textNode.nodeValue !== baseline.text) textNode.nodeValue = baseline.text
          textNode.nodeValue = previews.text
        }
        const token = `p-${baseline.runtimeOccurrenceId.replace(/[^a-zA-Z0-9_-]/g, '-')}`
        element.dataset.rpPreviewId = token
        if (previews.foregroundColor || previews.backgroundColor || previews.fontSize) rules.push(`[data-rp-preview-id="${token}"]{${previews.foregroundColor ? `color:${previews.foregroundColor}!important;` : ''}${previews.backgroundColor ? `background-color:${previews.backgroundColor}!important;` : ''}${previews.fontSize ? `font-size:${previews.fontSize}!important;` : ''}}`)
      }
      styleElement.textContent = rules.join('\n')
      if (staleChanged) queueMicrotask(refresh)
    } finally { reconciling.current = false }
  }, [store, version])

  useEffect(() => { reconcile() }, [reconcile])
  useEffect(() => {
    let frame = 0
    const observer = new MutationObserver(() => { if (!reconciling.current) { cancelAnimationFrame(frame); frame = requestAnimationFrame(reconcile) } })
    observer.observe(document.body, { childList: true, subtree: true, characterData: true })
    return () => { observer.disconnect(); cancelAnimationFrame(frame) }
  }, [reconcile])

  useEffect(() => {
    if (!selection) return
    const reposition = () => setSelectionVersion((value) => value + 1)
    window.addEventListener('scroll', reposition, true); window.addEventListener('resize', reposition)
    return () => { window.removeEventListener('scroll', reposition, true); window.removeEventListener('resize', reposition) }
  }, [selection])

  const popupPosition = useMemo(() => {
    if (!selection) return { left: 12, top: 12 }
    let anchor: Rectangle
    if (selection.range) anchor = selection.range.getBoundingClientRect()
    else if (selection.kind === 'direct') anchor = selection.target.element.getBoundingClientRect()
    else {
      const rects = selection.targets.map((target) => target.element.getBoundingClientRect())
      anchor = { left: Math.min(...rects.map((r) => r.left)), top: Math.min(...rects.map((r) => r.top)), right: Math.max(...rects.map((r) => r.right)), bottom: Math.max(...rects.map((r) => r.bottom)), width: 0, height: 0 }
    }
    const availableViewport = viewport()
    if (trayOpen && availableViewport.width > 850) availableViewport.width -= 420
    return clampPopup(anchor, { width: popupRef.current?.offsetWidth ?? 390, height: popupRef.current?.offsetHeight ?? 430 }, availableViewport)
  }, [selection, selectionVersion, trayOpen])

  const removeTarget = (occurrenceId: string) => setSelection((current) => current?.kind === 'group' ? { ...current, targets: current.targets.filter((target) => target.occurrenceId !== occurrenceId) } : current)
  const mutate = (action: () => void) => { try { action(); setError(''); refresh() } catch (caught) { setError(caught instanceof Error ? caught.message : 'Action failed.') } }
  const reset = () => mutate(() => { store?.resetDraft(); setSubmitted(null) })
  const done = () => mutate(() => { const result = store!.submit(); reviewBridge.publish(result); setSubmitted(result); setMode('idle'); closePopup() })
  const newDraft = (restorePreview = false) => mutate(() => {
    if (restorePreview && submitted) {
      for (const correction of submitted.corrections) {
        if (correction.kind !== 'text-replacement') continue
        const element = document.querySelector<HTMLElement>(`[data-rp-occurrence-id="${correction.runtimeOccurrenceId}"]`)
        const node = element && directTextNode(element)
        if (node) node.nodeValue = correction.originalValue
      }
      document.querySelectorAll('[data-rp-preview-id]').forEach((element) => element.removeAttribute('data-rp-preview-id'))
      document.getElementById('reviewplane-preview-styles')?.remove()
    }
    store!.beginDraft({ route: route(), viewport: viewport() }); setSubmitted(null); setDeliveryNote('')
  })
  const copyBatch = async () => {
    if (!submitted) return
    try {
      await navigator.clipboard.writeText(JSON.stringify(submitted, null, 2))
      setDeliveryNote('Batch copied. Paste it into your coding agent.')
    } catch {
      setDeliveryNote('Copy was blocked by the browser. Use Download instead.')
    }
  }
  const downloadBatch = () => {
    if (!submitted) return
    const url = URL.createObjectURL(new Blob([JSON.stringify(submitted, null, 2)], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `reviewplane-${submitted.batch.id}.json`
    link.click()
    URL.revokeObjectURL(url)
    setDeliveryNote('Batch downloaded. Attach it to your coding-agent task.')
  }

  if (!portal || !store) return null
  const stagedGroupTargets = active.flatMap((correction) => correction.kind === 'group-instruction' ? correction.targets : [])
  return createPortal(<div className="rp-layer" aria-label="ReviewPlane review overlay">
    {hover && mode === 'inspect' && <div className="rp-hover" style={{ left: hover.element.getBoundingClientRect().left, top: hover.element.getBoundingClientRect().top, width: hover.element.getBoundingClientRect().width, height: hover.element.getBoundingClientRect().height }}><span className="rp-hover-label">{targetLabel(hover.source)}</span></div>}
    {lasso && <div className="rp-lasso" style={{ left: lasso.left, top: lasso.top, width: lasso.width, height: lasso.height }}/>} 
    {selection?.kind === 'group' && selection.targets.map((target) => { const rect = target.element.getBoundingClientRect(); return <div className="rp-group-target" key={target.occurrenceId} style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }}/> })}
    {!selection && stagedGroupTargets.map((target) => { const element = document.querySelector<HTMLElement>(`[data-rp-occurrence-id="${target.runtimeOccurrenceId}"]`); if (!element) return null; const rect = element.getBoundingClientRect(); return <div className="rp-group-target" key={target.runtimeOccurrenceId} style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }}/> })}

    {selection && <div className="rp-popup" ref={popupRef} style={popupPosition}>
      <div className="rp-head"><div><p className="rp-kicker">{selection.kind === 'direct' ? 'Edit this item' : 'Group instruction'}</p><h2>{selection.kind === 'direct' ? targetLabel(selection.target.source) : `${selection.targets.length} selected items`}</h2></div><button className="rp-link" onClick={closePopup}>Cancel</button></div>
      {selection.kind === 'direct' ? <>
        {selection.selectedText && <label className="rp-field"><span>Replacement text</span><textarea value={replacement} onChange={(event) => setReplacement(event.target.value)}/></label>}
        {!selection.selectedText && <p className="rp-meta">This target was picked as an element. Add one or more style changes below.</p>}
        <div className="rp-grid"><label className="rp-field"><span>Foreground color</span><input value={foreground} onChange={(event) => setForeground(event.target.value)}/></label><label className="rp-field"><span>Background color</span><input value={background} onChange={(event) => setBackground(event.target.value)}/></label></div>
        <div className="rp-grid"><label className="rp-field"><span>Font size</span><input value={fontSize} onChange={(event) => setFontSize(event.target.value)}/></label><label className="rp-field"><span>Scope</span><select value={scope} onChange={(event) => setScope(event.target.value as ReviewScope)}><option value="element">This element</option><option value="matching-instances">Matching instances</option></select></label></div>
      </> : <>
        {selection.selectedText && <p className="rp-meta">Cross-element text is captured as context only; ReviewPlane will not fake a rewrite preview.</p>}
        <div className="rp-targets">{selection.targets.map((target, index) => <div className="rp-target" key={target.occurrenceId}><span>{index + 1}. {targetLabel(target.source)}</span><button className="rp-link rp-danger" onClick={() => removeTarget(target.occurrenceId)}>Remove</button></div>)}</div>
        <label className="rp-field"><span>Instruction for this group</span><textarea placeholder="What should your coding agent change?" value={instruction} onChange={(event) => setInstruction(event.target.value)}/></label>
      </>}
      {error && <p className="rp-meta rp-stale">{error}</p>}
      <div className="rp-actions"><button className="rp-primary" onClick={stage}>Add correction</button></div>
    </div>}

    {trayOpen && <aside className="rp-tray">
      <div className="rp-head"><div><p className="rp-kicker">Correction tray</p><h3>{active.length} pending</h3></div><button className="rp-link" onClick={() => setTrayOpen(false)}>Hide</button></div>
      <p className="rp-meta rp-status">{bridgeStatus === 'waiting' ? 'Agent connected and waiting' : bridgeStatus === 'batch-ready' ? 'Review saved' : bridgeStatus === 'acknowledged' ? 'Agent finished this review' : bridgeStatus === 'ready' ? 'Ready for your coding agent' : 'No agent connection · copy after Done'}</p>
      {entries.length === 0 ? <p className="rp-empty">Select page text or lasso a region to stage your first correction.</p> : <div className="rp-corrections">{entries.map(({ correction, active: isActive }, index) => <div className="rp-correction" key={correction.id}>
        <div className="rp-correction-head"><strong>{String(index + 1).padStart(2, '0')} · {correctionLabel(correction)} · {targetLabel(correction.sourceRecord)}</strong>{correction.staleTarget && <span className="rp-stale">Page changed · select again</span>}</div>
        <p className="rp-summary" style={{ opacity: isActive ? 1 : .5 }}>{isActive ? summary(correction) : `Undone · ${summary(correction)}`}</p>
        {editing === correction.id ? <div className="rp-edit"><input value={editValue} onChange={(event) => setEditValue(event.target.value)}/><button className="rp-link" onClick={() => mutate(() => { store.editCorrection(correction.id, { requestedValue: editValue }); setEditing(null) })}>Save</button></div> : isActive && <div className="rp-actions"><button className="rp-link" onClick={() => { setEditing(correction.id); setEditValue(correction.requestedValue) }}>Edit</button><button className="rp-link" onClick={() => mutate(() => store.undoCorrection(correction.id))}>Undo</button><button className="rp-link rp-danger" onClick={() => mutate(() => store.removeCorrection(correction.id))}>Remove</button></div>}
      </div>)}</div>}
      {error && !selection && <p className="rp-meta rp-stale">{error}</p>}
      {submitted && <><p className="rp-meta">{bridgeStatus === 'waiting' ? `Your waiting agent received ${submitted.corrections.length} change${submitted.corrections.length === 1 ? '' : 's'}.` : `${submitted.corrections.length} change${submitted.corrections.length === 1 ? '' : 's'} ready. Connect a waiting agent, or copy or download the review.`}</p><div className="rp-actions"><button className="rp-quiet" onClick={() => void copyBatch()}>Copy review</button><button className="rp-quiet" onClick={downloadBatch}>Download review</button></div>{deliveryNote && <p className="rp-meta" role="status">{deliveryNote}</p>}</>}
      <div className="rp-actions">{submitted ? <button className="rp-primary" onClick={() => newDraft(bridgeStatus !== 'acknowledged')}>{bridgeStatus === 'acknowledged' ? 'Start another review' : 'Reset page'}</button> : <><button className="rp-quiet" disabled={!entries.length} onClick={reset}>Reset all</button><button className="rp-primary" disabled={!active.length} onClick={done}>Done</button></>}</div>
    </aside>}

    <div className="rp-toolbar" role="toolbar" aria-label="ReviewPlane tools">
      <span className="rp-brand">ReviewPlane</span>
      {(['inspect', 'text', 'lasso'] as const).map((tool) => <button className="rp-tool" key={tool} aria-pressed={mode === tool} title={tool === 'inspect' ? 'Inspect element (Alt+Shift+R)' : undefined} onClick={() => { setMode((current) => current === tool ? 'idle' : tool); setHover(null); closePopup() }}>{tool === 'lasso' ? 'Lasso' : tool[0].toUpperCase() + tool.slice(1)}</button>)}
      <button className="rp-quiet" onClick={() => setMode('idle')}>Exit</button>
      <button className="rp-tool" onClick={() => setTrayOpen((open) => !open)}>Tray <span className="rp-count">{active.length}</span></button>
    </div>
  </div>, portal)
}
