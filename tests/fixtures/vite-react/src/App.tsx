export default function App() {
  return (
    <main>
      <h1>Fixture headline</h1>
      <p className="lede">Static paragraph for mapping coverage.</p>
      <ul>
        {['Alpha', 'Beta', 'Gamma'].map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <button type="button">Primary action</button>
    </main>
  )
}
