import { registerReviewPlaneTools, type ModelContext } from '@reviewplane/react'
import { useEffect, useRef, useState } from 'react'
import './WebMcpProbe.css'

const toolNames = ['wait_for_review', 'get_review_batch', 'get_correction', 'acknowledge_review']
type RetrievedBatch = { batchId: string; correctionIds: string[] }

export function WebMcpProbe() {
  const hasModelContext = Boolean(document.modelContext)
  const [status, setStatus] = useState<'checking' | 'unavailable' | 'registered' | 'pending' | 'resolved' | 'cancelled' | 'error'>(hasModelContext ? 'checking' : 'unavailable')
  const [detail, setDetail] = useState(hasModelContext ? 'Registering the ReviewPlane bridge…' : 'WebMCP is unavailable here. Reviews remain saved in this browser session.')
  const [hostDetail, setHostDetail] = useState('No host execution has started.')
  const [retrieved, setRetrieved] = useState<RetrievedBatch | null>(null)
  const hostControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!import.meta.env.DEV || !document.modelContext) return
    const registration = new AbortController()
    let active = true
    void registerReviewPlaneTools(document.modelContext, registration.signal).then(() => {
      if (!active) return
      setStatus('registered')
      setDetail('Four review tools are registered and ready for a browser agent.')
    }).catch((error: unknown) => {
      if (!active) return
      setStatus('error')
      setDetail(error instanceof Error ? error.message : 'Tool registration failed.')
    })
    return () => { active = false; registration.abort() }
  }, [])

  if (!import.meta.env.DEV) return null

  const invokeHostTest = async () => {
    const modelContext: ModelContext | undefined = document.modelContext
    if (!modelContext) return
    const discovered = await modelContext.getTools()
    const tools = new Map(discovered.map((tool) => [tool.name, tool]))
    const waitTool = tools.get('wait_for_review')
    if (!waitTool || toolNames.some((name) => !tools.has(name))) { setHostDetail('Chrome did not return all four ReviewPlane tools from getTools().'); return }
    const controller = new AbortController()
    hostControllerRef.current = controller
    setStatus('pending')
    setHostDetail('A real host call is waiting. Use Review this page now, stage corrections, and press Done in the overlay.')
    try {
      const rawResult = await modelContext.executeTool(waitTool, JSON.stringify({ requestId: `probe-${Date.now()}` }), { signal: controller.signal })
      const result = (typeof rawResult === 'string' ? JSON.parse(rawResult) : rawResult) as { batchId?: string; correctionIds?: string[]; status?: string }
      if (result.batchId && result.correctionIds) {
        await modelContext.executeTool(tools.get('get_review_batch')!, JSON.stringify({ batchId: result.batchId }))
        const corrections = []
        for (const correctionId of result.correctionIds) corrections.push(await modelContext.executeTool(tools.get('get_correction')!, JSON.stringify({ correctionId })))
        setRetrieved({ batchId: result.batchId, correctionIds: result.correctionIds })
        setHostDetail(`Retrieved ${result.correctionIds.length} corrections: ${corrections.join(' | ')}`)
      } else {
        setHostDetail(`Host result: ${JSON.stringify(result)}`)
      }
      setStatus(controller.signal.aborted ? 'cancelled' : 'resolved')
    } catch (error: unknown) {
      setStatus(controller.signal.aborted ? 'cancelled' : 'error')
      setHostDetail(error instanceof Error ? error.message : 'The host execution failed.')
    } finally {
      if (hostControllerRef.current === controller) hostControllerRef.current = null
    }
  }

  const acknowledgeApplied = async () => {
    if (!retrieved || !document.modelContext) return
    const tool = (await document.modelContext.getTools()).find((candidate) => candidate.name === 'acknowledge_review')
    if (!tool) return
    const result = await document.modelContext.executeTool(tool, JSON.stringify({ batchId: retrieved.batchId, applied: retrieved.correctionIds, unresolved: [], failed: [], validationSummary: 'Typecheck, lint, tests, production build, and live rerender passed.' }))
    setHostDetail(`Acknowledged applied: ${JSON.stringify(result)}`)
    setRetrieved(null)
  }

  return (
    <section className="webmcp-probe ruled-section" aria-labelledby="webmcp-probe-title">
      <div>
        <p className="eyebrow">Live browser bridge</p>
        <h2 id="webmcp-probe-title">Can an agent receive the review you just staged?</h2>
        <p>This development-only panel uses Chrome’s real WebMCP host. Done resolves an active waiter or leaves the batch ready for a later connection.</p>
      </div>
      <div className="probe-console">
        <div className="probe-status"><span className={`status-dot status-${status}`} /><b>{status}</b><span>{toolNames.length} tools</span></div>
        <p role="status">{detail}</p>
        <dl>
          <div><dt>Registered</dt><dd>{toolNames.join(', ')}</dd></div>
          <div><dt>Host</dt><dd>{window.location.host}</dd></div>
          <div><dt>Secure context</dt><dd>{String(window.isSecureContext)}</dd></div>
          <div><dt>Origin isolated</dt><dd>{String(window.originAgentCluster)}</dd></div>
        </dl>
        <div className="probe-actions">
          <button className="button button-secondary" type="button" onClick={() => void invokeHostTest()} disabled={status === 'checking' || status === 'unavailable' || status === 'pending'}>Wait + retrieve</button>
          <button className="button button-secondary" type="button" onClick={() => hostControllerRef.current?.abort()} disabled={status !== 'pending'}>Cancel execution</button>
          <button className="button" type="button" onClick={() => void acknowledgeApplied()} disabled={!retrieved}>Acknowledge applied</button>
        </div>
        <p className="probe-host-detail"><b>Host trace:</b> {hostDetail}</p>
      </div>
    </section>
  )
}

export default WebMcpProbe
