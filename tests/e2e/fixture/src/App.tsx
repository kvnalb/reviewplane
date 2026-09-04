import { useState } from 'react'

const cards = ['Alpha', 'Beta', 'Gamma']

export default function App() {
  const [count, setCount] = useState(0)
  return <main>
    <h1>Review fixture</h1>
    <p id="editable">The quick brown fox needs a clearer sentence.</p>
    <button type="button" onClick={() => setCount((value) => value + 1)}>Rerender {count}</button>
    <section className="cards" aria-label="Example cards">
      {cards.map((card) => <article className="card" key={card}><h2>{card}</h2><p>{card} needs more breathing room.</p></article>)}
    </section>
  </main>
}
