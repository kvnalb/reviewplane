export default function App() {
  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-3xl font-semibold tracking-tight">SWC and Tailwind fixture</h1>
      <p className="mt-3 text-slate-600">Class-string styling should still map through intrinsic elements.</p>
      <div className="mt-6 grid gap-3">
        {['One', 'Two', 'Three'].map((label) => (
          <article key={label} className="rounded-lg border border-slate-200 p-4">
            <h2 className="text-lg font-medium">{label}</h2>
            <p className="text-sm text-slate-500">Card body {label}</p>
          </article>
        ))}
      </div>
    </main>
  )
}
