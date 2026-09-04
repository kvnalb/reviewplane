import { useState } from 'react'
import './App.css'

const githubUrl = 'https://github.com/kvnalb/reviewplane'

function Arrow() {
  return <svg aria-hidden="true" viewBox="0 0 18 18"><path d="M3 9h11M10 5l4 4-4 4" /></svg>
}

function PlaneMark() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 5h16v14H4zM8 9h8M8 13h5" /></svg>
}

const workflow = [
  ['Select', 'Point to the exact words or elements that need work.'],
  ['Stage', 'Preview visible changes and keep adding corrections.'],
  ['Done', 'Package the whole review with one click.'],
  ['Apply', 'Your coding agent edits the source and runs checks.'],
]

const scope = [
  ['React 18 and 19', 'Ready'],
  ['Vite React and React SWC', 'Ready'],
  ['CSS Modules and Tailwind', 'Ready'],
  ['shadcn/ui and Radix composition', 'Ready'],
  ['Next.js', 'Roadmap'],
]

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const startReview = () => window.dispatchEvent(new Event('reviewplane:activate'))
  const copyInstall = async () => {
    try {
      await navigator.clipboard.writeText('npx reviewplane init')
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="site-header">
      <a className="wordmark" href="#top" aria-label="ReviewPlane home"><PlaneMark /><span>ReviewPlane</span></a>
      <button className="menu-button" type="button" aria-expanded={menuOpen} aria-controls="site-nav" onClick={() => setMenuOpen((open) => !open)}>Menu</button>
      <nav id="site-nav" className={menuOpen ? 'nav-open' : ''} aria-label="Primary navigation">
        <a href="#workflow">Workflow</a><a href="#modes">Modes</a><a href="#install">Install</a><a href="#scope">Scope</a>
      </nav>
      <button className="button button-small header-action" type="button" onClick={startReview}>Start reviewing</button>
    </header>

    <main id="main">
      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">For people building React apps with coding agents.</p>
          <h1>Fix the <span className="selected-phrase">page you see.</span><br />Skip the source hunt.</h1>
          <p className="hero-lede">Select words, adjust a visible style, or draw around a group. ReviewPlane gives your coding agent one review with the context to make the changes.</p>
          <div className="hero-actions">
            <button className="button" type="button" onClick={startReview}>Start reviewing this page <Arrow /></button>
            <a className="text-link" href="#workflow">See the four-step loop <Arrow /></a>
          </div>
          <p className="sandbox-note"><span aria-hidden="true">●</span> This public sandbox previews changes in your browser. It cannot edit the repository.</p>
        </div>

        <aside className="correction-margin" aria-label="How to review this page">
          <div className="margin-rule" aria-hidden="true"><span>Selected</span></div>
          <p className="tool-label">Your review</p>
          <p className="margin-title">Start with what feels off.</p>
          <ol>
            <li><span>1</span><p>Choose <strong>Text</strong> in the toolbar.</p></li>
            <li><span>2</span><p>Highlight words anywhere on this page.</p></li>
            <li><span>3</span><p>Stage more changes, then press <strong>Done</strong> once.</p></li>
          </ol>
          <div className="margin-outcome"><span className="status-dot" />No agent waiting? Copy or download the review.</div>
        </aside>
      </section>

      <section className="problem section-shell" aria-labelledby="problem-title">
        <div>
          <p className="section-label">The handoff problem</p>
          <h2 id="problem-title">“Make this card tighter” leaves your coding agent guessing.</h2>
        </div>
        <p>You can see the weak phrase, wrong color, or crowded group. A chat prompt can lose the target, the scope, and what the browser is actually showing.</p>
      </section>

      <section className="workflow section-shell" id="workflow" aria-labelledby="workflow-title">
        <div className="section-intro">
          <p className="section-label">One review, not four repair prompts</p>
          <h2 id="workflow-title">Move from rendered page to validated source.</h2>
        </div>
        <ol className="workflow-track">
          {workflow.map(([title, body], index) => <li key={title}>
            <span className="step-number">{String(index + 1).padStart(2, '0')}</span>
            <h3>{title}</h3><p>{body}</p>
          </li>)}
        </ol>
      </section>

      <section className="modes section-shell" id="modes" aria-labelledby="modes-title">
        <div className="section-intro">
          <p className="section-label">What Done does</p>
          <h2 id="modes-title">One button. Two honest outcomes.</h2>
          <p>Done packages the changes you staged. It does not start an idle agent.</p>
        </div>
        <div className="done-fork">
          <div className="done-node">Done <span>freezes the review</span></div>
          <article><p className="mode-tag">Public sandbox</p><h3>Take the review with you.</h3><p>Copy or download it. Your previews stay in this browser session.</p></article>
          <article><p className="mode-tag">Cloned project</p><h3>Hand it to a waiting agent.</h3><p>The same agent turn reads the review, edits source, and runs checks.</p></article>
        </div>
      </section>

      <section className="install section-shell" id="install" aria-labelledby="install-title">
        <div className="section-intro">
          <p className="section-label">Release candidate 0.1.0</p>
          <h2 id="install-title">Add ReviewPlane with one command.</h2>
          <p>Run it in a React and Vite project. The initializer installs the review layer and teaches your coding agent how to use it.</p>
        </div>
        <div className="command-box">
          <span aria-hidden="true">$</span><code>npx reviewplane init</code>
          <button type="button" onClick={() => void copyInstall()}>{copied ? 'Copied' : 'Copy command'}</button>
        </div>
        <p className="release-note">Package publication follows the release approval. The cloned repository already uses this exact initializer.</p>
      </section>

      <section className="scope section-shell" id="scope" aria-labelledby="scope-title">
        <div className="section-intro">
          <p className="section-label">First-release fit</p>
          <h2 id="scope-title">Know what works before you install.</h2>
        </div>
        <div className="scope-list" role="list" aria-label="ReviewPlane compatibility">
          {scope.map(([surface, status]) => <div role="listitem" key={surface}><span>{surface}</span><strong className={status === 'Roadmap' ? 'roadmap' : ''}>{status}</strong></div>)}
        </div>
      </section>

      <section className="evidence section-shell" aria-labelledby="evidence-title">
        <div className="section-intro">
          <p className="section-label">The evidence comes next</p>
          <h2 id="evidence-title">This page is the untouched “before.”</h2>
          <p>The human review, agent-applied diff, and under-three-minute demo will be recorded after the product path passes hardening.</p>
        </div>
        <div className="evidence-frame">
          <div><span>Before</span><strong>Fresh generated page</strong><p>Ready for its first live review.</p></div>
          <div className="evidence-arrow" aria-hidden="true">→</div>
          <div><span>After</span><strong>Pending human take</strong><p>No correction has been chosen in advance.</p></div>
        </div>
      </section>

      <section className="closing section-shell">
        <p className="section-label">You keep control</p>
        <h2>The browser previews. Your coding agent edits source.</h2>
        <p>ReviewPlane carries what you meant. Your agent still reads the project, chooses the implementation, and validates the result.</p>
        <div className="hero-actions">
          <button className="button" type="button" onClick={startReview}>Start reviewing this page <Arrow /></button>
          <a className="button button-secondary" href={githubUrl}>View on GitHub</a>
        </div>
      </section>
    </main>

    <footer><a className="wordmark" href="#top"><PlaneMark /><span>ReviewPlane</span></a><p>Visual review for React + coding agents.</p><a href={githubUrl}>MIT licensed · GitHub</a></footer>
    <div className="copy-status" role="status" aria-live="polite">{copied ? 'Install command copied.' : ''}</div>
  </>
}

export default App
