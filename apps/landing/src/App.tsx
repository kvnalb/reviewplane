import { lazy, Suspense, useRef, useState, type ReactNode } from 'react'
import '@fontsource/familjen-grotesk/latin-500.css'
import '@fontsource/familjen-grotesk/latin-600.css'
import '@fontsource/ibm-plex-sans/latin-400.css'
import '@fontsource/ibm-plex-sans/latin-500.css'
import '@fontsource/ibm-plex-sans/latin-600.css'
import '@fontsource/ibm-plex-mono/latin-400.css'
import '@fontsource/ibm-plex-mono/latin-500.css'
import './App.css'

const sandboxEnabled = import.meta.env.VITE_REVIEWPLANE_SANDBOX === 'true'
const reviewPlaneEnabled = import.meta.env.DEV || sandboxEnabled
const WebMcpProbe = import.meta.env.DEV ? lazy(() => import('./WebMcpProbe')) : null
const ReviewPlane = reviewPlaneEnabled
  ? lazy(() => import('@reviewplane/react').then(({ ReviewPlane }) => ({ default: ReviewPlane })))
  : null
const reviewPlaneDeploymentMode = sandboxEnabled ? 'sandbox' : 'development'

type IconName =
  | 'arrow'
  | 'check'
  | 'code'
  | 'copy'
  | 'cursor'
  | 'external'
  | 'menu'
  | 'plane'
  | 'rectangle'
  | 'text'

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, ReactNode> = {
    arrow: <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    code: <><path d="m8 9-3 3 3 3"/><path d="m16 9 3 3-3 3"/><path d="m14 5-4 14"/></>,
    copy: <><rect x="8" y="8" width="11" height="11" rx="1"/><path d="M16 8V5H5v11h3"/></>,
    cursor: <path d="m5 4 13 8-6 2-3 6Z"/>,
    external: <><path d="M14 5h5v5"/><path d="m11 13 8-8"/><path d="M19 14v5H5V5h5"/></>,
    menu: <><path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/></>,
    plane: <><path d="m3 11 18-8-8 18-2-8Z"/><path d="m11 13 4-4"/></>,
    rectangle: <rect x="4" y="6" width="16" height="12" rx="1"/>,
    text: <><path d="M5 6h14"/><path d="M12 6v12"/><path d="M8 18h8"/></>,
  }

  return <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>
}

const workflow = [
  ['01', 'Select', 'Point at text, a visible style, or a group of elements on the page.'],
  ['02', 'Stage', 'Review the proposed corrections together before anything reaches your code.'],
  ['03', 'Done', 'Package the batch with page context and the best source hints available.'],
  ['04', 'Apply', 'Your coding agent reads the handoff, edits the project, and verifies the result.'],
]

const supported = [
  ['React + Vite', 'Best-fit starter environment'],
  ['JSX / TSX DOM', 'Selectable page elements'],
  ['CSS, modules, Tailwind, inline styles', 'Visible style corrections'],
  ['Text content', 'Direct copy corrections'],
  ['Multi-element regions', 'Grouped layout feedback'],
]

const unsupported = [
  ['Next.js, Vue, Svelte', 'Not verified in the first release'],
  ['Canvas and WebGL', 'No reliable DOM target'],
  ['Cross-origin iframes', 'Browser security boundary'],
]

const batchSummary = `{
  "page": "/pricing",
  "corrections": 3,
  "status": "ready",
  "sourceHints": 2
}`

const correctionDetail = `{
  "target": "PricingCard",
  "instruction": "Tighten this card",
  "styles": {
    "padding": "24px",
    "gap": "12px"
  },
  "source": "src/components/PricingCard.tsx:41"
}`

function App() {
  const [navOpen, setNavOpen] = useState(false)
  const [payloadOpen, setPayloadOpen] = useState(false)
  const [copied, setCopied] = useState('')
  const [announcement, setAnnouncement] = useState('')
  const handoffRef = useRef<HTMLElement>(null)

  const closeAndScroll = (id: string) => {
    setNavOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  const openPreview = () => {
    window.dispatchEvent(new Event('reviewplane:activate'))
    setAnnouncement('ReviewPlane opened. Select text on this page, or choose Lasso in the bottom toolbar.')
  }

  const inspectBatch = () => {
    setPayloadOpen(true)
    handoffRef.current?.scrollIntoView({ behavior: 'smooth' })
    setAnnouncement('Sample correction batch expanded.')
  }

  const copyCommand = async (command: string) => {
    try {
      await navigator.clipboard.writeText(command)
      setCopied(command)
      setAnnouncement(`Copied ${command}`)
      window.setTimeout(() => setCopied(''), 1800)
    } catch {
      setAnnouncement(`Copy unavailable. Select this command: ${command}`)
    }
  }

  return (
    <div className="site-shell">
      <a className="skip-link" href="#main">Skip to content</a>

      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="ReviewPlane home">
          <span className="wordmark-mark"><Icon name="plane" /></span>
          ReviewPlane
        </a>
        <button
          className="nav-toggle icon-button"
          type="button"
          aria-label="Toggle navigation"
          aria-expanded={navOpen}
          onClick={() => setNavOpen((open) => !open)}
        >
          <Icon name="menu" />
        </button>
        <nav className={navOpen ? 'site-nav is-open' : 'site-nav'} aria-label="Main navigation">
          <button type="button" onClick={() => closeAndScroll('workflow')}>Workflow</button>
          <button type="button" onClick={() => closeAndScroll('scope')}>Scope</button>
          <button type="button" onClick={() => closeAndScroll('install')}>Install</button>
          <span className="nav-disabled" aria-label="GitHub repository link coming soon">GitHub <small>soon</small></span>
          <button className="button button-small" type="button" onClick={openPreview}>Start reviewing</button>
        </nav>
      </header>

      <main id="main" tabIndex={-1}>
        <section className="hero-section section-grid" id="top">
          <div className="hero-copy">
            <p className="eyebrow">Visual corrections for React</p>
            <h1>Mark what you want changed without hunting through the component tree.</h1>
            <p className="hero-lede">Select text, adjust a visible style, or draw around a group. ReviewPlane packages your corrections with source hints and browser context, ready for your coding agent.</p>
            <div className="button-row">
              <button className="button" type="button" onClick={openPreview}>Start reviewing this page <Icon name="arrow" /></button>
              <button className="button button-secondary" type="button" onClick={inspectBatch}>Inspect a sample batch</button>
            </div>
            <p className="objection-line"><Icon name="check" /> Your agent edits the code. ReviewPlane makes your intent precise.</p>
          </div>

          <div className="product-preview" aria-label="Illustration of ReviewPlane connecting a page selection to a correction tray">
            <div className="browser-frame">
              <div className="browser-bar"><span/><span/><span/><p>localhost:5173/pricing</p></div>
              <div className="proof-page">
                <div className="proof-nav"><b>Northstar</b><span>Product</span><span>Pricing</span></div>
                <p className="proof-kicker">PLANS FOR EVERY TEAM</p>
                <div className="proof-title">Choose your plan</div>
                <div className="proof-cards">
                  <div><span/><span/><span/></div>
                  <div className="selected-card">
                    <span className="selection-tag">PricingCard</span>
                    <strong>Scale</strong><span/><span/><span/>
                  </div>
                  <div><span/><span/><span/></div>
                </div>
                <div className="source-chip"><Icon name="code" /> PricingCard.tsx:41</div>
              </div>
            </div>
            <svg className="connector" viewBox="0 0 180 110" aria-hidden="true"><path d="M6 6c65 0 58 96 166 96"/><circle cx="6" cy="6" r="4"/><path d="m163 94 9 8-12 3"/></svg>
            <aside className="correction-tray">
              <div className="tray-heading"><span>Corrections</span><span className="preview-badge">Preview</span></div>
              <div className="tray-item"><Icon name="text" /><span><b>Headline</b><small>“Choose a plan that fits”</small></span><em>01</em></div>
              <div className="tray-item active"><Icon name="rectangle" /><span><b>Pricing card</b><small>Padding 32 → 24</small></span><em>02</em></div>
              <div className="tray-item"><Icon name="cursor" /><span><b>CTA group</b><small>Align to baseline</small></span><em>03</em></div>
              <div className="tray-actions"><button type="button" disabled>Reset</button><button type="button" disabled>Done</button></div>
              <p>Source handoff arrives in Phase 5.</p>
            </aside>
          </div>
        </section>

        <section className="problem-section ruled-section">
          <div>
            <p className="eyebrow">The translation gap</p>
            <h2>“Make this card tighter” leaves your coding agent guessing.</h2>
            <p>Words alone rarely identify the exact element, visual scope, or source file. That turns a small correction into a long back-and-forth.</p>
          </div>
          <div className="context-receipt" aria-label="Context available in a vague design request">
            <div><span>Target element</span><b>?</b></div>
            <div><span>Selected region</span><b>?</b></div>
            <div><span>Visible styles</span><b>?</b></div>
            <div><span>Source location</span><b>?</b></div>
            <p>Four missing clues. One avoidable guessing loop.</p>
          </div>
        </section>

        <section className="sandbox-section ruled-section" aria-labelledby="sandbox-title">
          <div className="section-intro">
            <p className="eyebrow">Live on this page</p>
            <h2 id="sandbox-title">Edit the page, simulation. Review the page you’re reading.</h2>
            <p>ReviewPlane is dogfooding itself here. Open the overlay, select this headline or any other copy, and watch your proposed change preview in place.</p>
          </div>
          <div className="live-review-card">
            <ol>
              <li><span>01</span><div><b>Select real copy</b><p>Drag across text anywhere on this landing page.</p></div></li>
              <li><span>02</span><div><b>Preview the correction</b><p>Replace it or change its visible color and size.</p></div></li>
              <li><span>03</span><div><b>Try a region</b><p>Choose Lasso, draw around several elements, and leave one instruction.</p></div></li>
            </ol>
            <button className="button" type="button" onClick={openPreview}>Review this page now <Icon name="arrow" /></button>
            <p className="live-shortcut">Keyboard: <kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>R</kbd></p>
          </div>
        </section>

        <section className="workflow-section ruled-section" id="workflow">
          <div className="section-intro compact">
            <p className="eyebrow">A review loop you can inspect</p>
            <h2>From visible problem to code-ready handoff.</h2>
          </div>
          <ol className="workflow-list">
            {workflow.map(([number, title, body]) => <li key={number}><span>{number}</span><h3>{title}</h3><p>{body}</p></li>)}
          </ol>
        </section>

        <section className="handoff-section ruled-section" ref={handoffRef}>
          <div className="handoff-copy">
            <p className="eyebrow">Inspect before you send</p>
            <h2>One batch, with the details your agent needs.</h2>
            <p>ReviewPlane keeps the human decision separate from the code change. You can see what will be handed off before your agent acts.</p>
            <button className="text-button" type="button" onClick={() => setPayloadOpen((open) => !open)} aria-expanded={payloadOpen}>
              {payloadOpen ? 'Hide correction detail' : 'Show correction detail'} <Icon name="arrow" />
            </button>
          </div>
          <div className={payloadOpen ? 'payload-grid is-open' : 'payload-grid'}>
            <div className="payload-panel"><div><span>batch.summary.json</span><i>ready</i></div><pre><code>{batchSummary}</code></pre></div>
            {payloadOpen && <div className="payload-panel payload-detail"><div><span>correction-02.json</span><i>detail</i></div><pre><code>{correctionDetail}</code></pre></div>}
          </div>
        </section>

        <section className="evidence-section ruled-section">
          <div className="section-intro compact">
            <p className="eyebrow">The proof will stay visible</p>
            <h2>Compare the generated baseline with the reviewed result.</h2>
            <p>These slots will hold real repository snapshots once ReviewPlane can apply its own correction batch.</p>
          </div>
          <div className="comparison-grid">
            <figure><div className="future-proof"><span>01</span><p>Baseline snapshot reserved</p></div><figcaption><b>Before</b><code>baseline-agent-generated</code></figcaption></figure>
            <figure><div className="future-proof after"><span>02</span><p>Reviewed snapshot reserved</p></div><figcaption><b>After</b><code>reviewplane-edited</code></figcaption></figure>
          </div>
        </section>

        <section className="done-section ruled-section">
          <div className="section-intro compact">
            <p className="eyebrow">What “Done” means</p>
            <h2>The handoff changes with where ReviewPlane runs.</h2>
          </div>
          <div className="fork-diagram">
            <div className="fork-start"><Icon name="check" /><span><b>Done</b><small>Package approved corrections</small></span></div>
            <div><span className="branch-label">CLONED LOCALLY</span><h3>Your agent receives the batch</h3><p>ReviewPlane can expose correction context inside the development environment.</p></div>
            <div><span className="branch-label">HOSTED DEMO</span><h3>You copy or download it</h3><p>A sandbox cannot assume access to your editor, repository, or a waiting agent.</p></div>
          </div>
        </section>

        <section className="install-section ruled-section" id="install">
          <div className="section-intro compact">
            <p className="eyebrow">Built for local development</p>
            <h2>Add it to a React + Vite project.</h2>
            <p>One setup command configures the Vite plugin, development overlay, and agent skills for a standard React + Vite app.</p>
          </div>
          <div className="command-stack">
            {['npm install -D reviewplane @reviewplane/react @reviewplane/vite', 'npx reviewplane init'].map((command) => <div className="command" key={command}><code>{command}</code><button type="button" onClick={() => copyCommand(command)} aria-label={`Copy ${command}`}><Icon name={copied === command ? 'check' : 'copy'} />{copied === command ? 'Copied' : 'Copy'}</button></div>)}
          </div>
          <p className="dev-warning"><b>Development only.</b> Ordinary production builds exclude ReviewPlane. Hosted sandbox is an explicit separate mode.</p>
        </section>

        <section className="scope-section ruled-section" id="scope">
          <div className="scope-column">
            <p className="eyebrow">First-release scope</p><h2>Know what works before you install.</h2>
            <table><caption>Supported in the first release</caption><thead><tr><th>Surface</th><th>What it covers</th></tr></thead><tbody>{supported.map(([surface, detail]) => <tr key={surface}><th scope="row"><Icon name="check" />{surface}</th><td>{detail}</td></tr>)}</tbody></table>
          </div>
          <div className="scope-column muted-table">
            <table><caption>Not supported yet</caption><thead><tr><th>Surface</th><th>Reason</th></tr></thead><tbody>{unsupported.map(([surface, detail]) => <tr key={surface}><th scope="row">{surface}</th><td>{detail}</td></tr>)}</tbody></table>
          </div>
        </section>

        <section className="demo-section ruled-section">
          <div className="video-placeholder" aria-label="Demo video placeholder"><span>00:00 / 00:45</span><button type="button" disabled aria-label="Demo video is not available yet">▶</button><p>Recorded product demo arrives after the working overlay.</p></div>
          <div><p className="eyebrow">No simulated magic</p><h2>A real walkthrough will replace this frame.</h2><p>We will record the selection, staging, handoff, and agent edit only after the full path works in the target environment.</p></div>
        </section>

        <section className="responsibility-section ruled-section">
          <div className="section-intro compact"><p className="eyebrow">Clear responsibility</p><h2>You stay in the review loop.</h2></div>
          <div className="responsibility-grid">
            <div><span>01</span><h3>You</h3><p>Choose the target, describe the correction, and approve the batch.</p></div>
            <div><span>02</span><h3>ReviewPlane</h3><p>Capture page context, source hints, and the exact set of requested changes.</p></div>
            <div><span>03</span><h3>Your coding agent</h3><p>Edit the repository, run checks, and report what changed.</p></div>
          </div>
        </section>

        {WebMcpProbe && <Suspense fallback={null}><WebMcpProbe /></Suspense>}
        {ReviewPlane && <Suspense fallback={null}><ReviewPlane deploymentMode={reviewPlaneDeploymentMode} /></Suspense>}

        <section className="closing-section ruled-section">
          <div><p className="eyebrow">Make the next edit visible</p><h2>Turn “something feels off” into a correction your agent can act on.</h2></div>
          <button className="button" type="button" onClick={openPreview}>Start reviewing this page <Icon name="arrow" /></button>
        </section>
      </main>

      <footer><a className="wordmark" href="#top"><span className="wordmark-mark"><Icon name="plane" /></span>ReviewPlane</a><p>Visual correction infrastructure for React development.</p><span>Baseline build · 2026</span></footer>
      <p className="sr-only" aria-live="polite">{announcement}</p>
    </div>
  )
}

export default App
