import { useEffect, useRef, useState } from 'react'

type RegisteredTool = { name: string; title?: string; description: string }
type ToolExecutionOptions = { signal: AbortSignal }

type ModelContext = {
  registerTool: (tool: {
    name: string
    title?: string
    description: string
    inputSchema?: object
    annotations?: { readOnlyHint?: boolean; untrustedContentHint?: boolean; consequentialHint?: boolean }
    execute: (input: object, options: ToolExecutionOptions) => Promise<unknown>
  }, options?: { signal?: AbortSignal }) => Promise<void>
  getTools: () => Promise<RegisteredTool[]>
  executeTool: (tool: RegisteredTool, input?: object, options?: { signal?: AbortSignal }) => Promise<string>
}

declare global {
  interface Document { readonly modelContext?: ModelContext }
}

type PendingWaiter = {
  resolve: (value: unknown) => void
  reject: (reason?: unknown) => void
  startedAt: number
}

export function WebMcpProbe() {
  const hasModelContext = Boolean(document.modelContext)
  const [status, setStatus] = useState<'checking' | 'unavailable' | 'registered' | 'pending' | 'resolved' | 'cancelled' | 'error'>(hasModelContext ? 'checking' : 'unavailable')
  const [detail, setDetail] = useState(hasModelContext ? 'Checking this browser for document.modelContext…' : 'WebMCP is unavailable in this browser.')
  const [elapsed, setElapsed] = useState(0)
  const pendingRef = useRef<PendingWaiter | null>(null)

  useEffect(() => {
    if (!import.meta.env.DEV) return
    const modelContext = document.modelContext
    if (!modelContext) return

    const registration = new AbortController()
    let active = true

    void modelContext.registerTool({
      name: 'wait_for_review',
      title: 'Wait for ReviewPlane review',
      description: 'Wait for the human reviewer to inspect the current page and press Done. Call only when a human review is required; this execution remains pending until the reviewer finishes or the call is cancelled.',
      inputSchema: {
        type: 'object',
        properties: {
          requestId: {
            type: 'string',
            description: 'Optional identifier used to correlate the review with the calling agent.',
            maxLength: 128,
          },
        },
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false, consequentialHint: false },
      execute: async (input, { signal }) => {
        if (pendingRef.current) {
          throw new Error('wait_for_review rejected: another review is already pending. Finish or cancel the active review before starting a second waiter.')
        }

        setStatus('pending')
        setElapsed(0)
        setDetail('An agent is waiting. Inspect the page, then press Done.')

        return new Promise((resolve, reject) => {
          const waiter: PendingWaiter = { resolve, reject, startedAt: Date.now() }
          pendingRef.current = waiter
          signal.addEventListener('abort', () => {
            if (pendingRef.current !== waiter) return
            pendingRef.current = null
            setStatus('cancelled')
            setDetail('The agent cancelled the pending review. The execution AbortSignal fired.')
            reject(signal.reason ?? new DOMException('Review cancelled', 'AbortError'))
          }, { once: true })
          void input
        })
      },
    }, { signal: registration.signal }).then(() => {
      if (!active) return
      setStatus('registered')
      setDetail('wait_for_review is registered and ready for a browser agent.')
    }).catch((error: unknown) => {
      if (!active) return
      setStatus('error')
      setDetail(error instanceof Error ? error.message : 'Tool registration failed.')
    })

    return () => {
      active = false
      registration.abort()
      const waiter = pendingRef.current
      if (waiter) {
        pendingRef.current = null
        waiter.reject(new DOMException('Page unloaded', 'AbortError'))
      }
    }
  }, [])

  useEffect(() => {
    if (status !== 'pending') return
    const timer = window.setInterval(() => {
      if (pendingRef.current) setElapsed(Math.floor((Date.now() - pendingRef.current.startedAt) / 1000))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [status])

  if (!import.meta.env.DEV) return null

  const finishReview = () => {
    const waiter = pendingRef.current
    if (!waiter) return
    pendingRef.current = null
    const waitedMs = Date.now() - waiter.startedAt
    waiter.resolve({ status: 'review_complete', waitedMs, message: 'The human reviewer pressed Done.' })
    setStatus('resolved')
    setDetail(`Done resolved the same execution after ${Math.round(waitedMs / 1000)} seconds.`)
  }

  return (
    <section className="webmcp-probe ruled-section" aria-labelledby="webmcp-probe-title">
      <div>
        <p className="eyebrow">Phase 1 integration probe</p>
        <h2 id="webmcp-probe-title">Can an agent wait for a human review?</h2>
        <p>This development-only panel registers one real WebMCP tool. It never pretends the tool exists when the browser API is missing.</p>
      </div>
      <div className="probe-console">
        <div className="probe-status"><span className={`status-dot status-${status}`} /><b>{status}</b><span>{status === 'pending' ? `${elapsed}s` : 'wait_for_review'}</span></div>
        <p role="status">{detail}</p>
        <dl>
          <div><dt>Host</dt><dd>{window.location.host}</dd></div>
          <div><dt>Secure context</dt><dd>{String(window.isSecureContext)}</dd></div>
          <div><dt>Origin isolated</dt><dd>{String(window.originAgentCluster)}</dd></div>
          <div><dt>User agent</dt><dd>{window.navigator.userAgent}</dd></div>
        </dl>
        <button className="button" type="button" onClick={finishReview} disabled={status !== 'pending'}>Done <span aria-hidden="true">→</span></button>
      </div>
    </section>
  )
}
