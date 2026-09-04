import { Button } from './button'

export default function App() {
  return (
    <main className="mx-auto max-w-3xl space-y-6 p-8">
      <header>
        <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Radix-style fixture</p>
        <h1 className="text-3xl font-semibold">shadcn-like primitives stay mappable</h1>
      </header>
      <section className="space-y-3">
        <p>Intrinsic wrappers around Slot-based buttons should still expose static copy.</p>
        <Button type="button">Continue review</Button>
      </section>
      <section className="grid gap-3 md:grid-cols-3">
        {['Density', 'Hierarchy', 'Contrast'].map((title) => (
          <article key={title} className="border border-slate-200 p-4">
            <h2 className="font-medium">{title}</h2>
            <p className="text-sm text-slate-600">Target group item</p>
          </article>
        ))}
      </section>
    </main>
  )
}
