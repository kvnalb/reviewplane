import { describe, expect, it } from 'vitest'
import reviewplane, { instrumentSource, shouldInstrument } from '../src/index.ts'

const root = '/workspace/app'

describe('instrumentSource', () => {
  it('instruments plain JSX with stable source metadata', () => {
    const source = `function Hero() {
  return <h1 className="title">Hello</h1>
}`
    const first = instrumentSource(source, `${root}/src/Hero.jsx`, { root })
    const second = instrumentSource(source, `${root}/src/Hero.jsx`, { root })

    expect(first?.records).toEqual([
      expect.objectContaining({
        id: expect.stringMatching(/^[a-f0-9]{10}$/),
        file: 'src/Hero.jsx',
        line: 2,
        column: 10,
        tag: 'h1',
        component: 'Hero',
        fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
      }),
    ])
    expect(first?.records[0].id).toBe(second?.records[0].id)
    expect(first?.code).toContain('data-rp-source-id=')
  })

  it('parses TSX and leaves component elements uninstrumented', () => {
    const source = `type Props = { label: string }
const Card = ({ label }: Props) => <article><span>{label}</span><Widget /></article>`
    const result = instrumentSource(source, `${root}/src/Card.tsx`, { root })

    expect(result?.records.map(({ tag, component }) => [tag, component])).toEqual([
      ['article', 'Card'],
      ['span', 'Card'],
    ])
    expect(result?.code).not.toMatch(/<Widget data-rp-source-id/)
  })

  it('handles fragments, conditionals, nested elements, and markup repeated by map', () => {
    const source = `function List({ items }) {
  return <>{items.length ? <ul>{items.map((item) => <li><b>{item}</b></li>)}</ul> : <p>Empty</p>}</>
}`
    const result = instrumentSource(source, `${root}/src/List.jsx`, { root })

    expect(result?.records.map(({ tag }) => tag)).toEqual(['ul', 'li', 'b', 'p'])
    expect(result?.records.filter(({ tag }) => tag === 'li')).toHaveLength(1)
  })

  it('preserves CSS Module expressions and Tailwind class strings', () => {
    const source = `import styles from './Card.module.css'
export function Card() {
  return <div className={styles.card}><button className="px-4 py-2 text-white">Save</button></div>
}`
    const result = instrumentSource(source, `${root}/src/Card.tsx`, { root })

    expect(result?.code).toContain('className={styles.card}')
    expect(result?.code).toContain('className="px-4 py-2 text-white"')
    expect(result?.records.map(({ tag }) => tag)).toEqual(['div', 'button'])
  })

  it('changes the fingerprint, but not the source ID, when nearby text changes', () => {
    const before = instrumentSource('export const Note = () => <p>Before</p>', `${root}/src/Note.tsx`, { root })
    const after = instrumentSource('export const Note = () => <p>After!</p>', `${root}/src/Note.tsx`, { root })

    expect(before?.records[0].id).toBe(after?.records[0].id)
    expect(before?.records[0].fingerprint).not.toBe(after?.records[0].fingerprint)
  })
})

describe('file filtering', () => {
  it('excludes dependencies, output, generated files, non-JSX, and configured patterns', () => {
    expect(shouldInstrument(`${root}/node_modules/pkg/View.tsx`, '', { root })).toBe(false)
    expect(shouldInstrument(`${root}/dist/View.jsx`, '', { root })).toBe(false)
    expect(shouldInstrument(`${root}/src/View.generated.tsx`, '', { root })).toBe(false)
    expect(shouldInstrument(`${root}/src/View.ts`, '', { root })).toBe(false)
    expect(shouldInstrument(`${root}/src/overlay/View.tsx`, '', { root, exclude: ['src/overlay/**'] })).toBe(false)
    expect(shouldInstrument(`${root}/src/View.tsx`, '// @generated\nexport const View = () => <div />', { root })).toBe(false)
  })
})

describe('Vite plugin', () => {
  it('runs in builds only for an explicit hosted sandbox', () => {
    const developmentOnly = reviewplane()
    const sandbox = reviewplane({ sandbox: true })
    const applies = developmentOnly.apply as (config: object, environment: { command: 'serve' | 'build' }) => boolean
    const sandboxApplies = sandbox.apply as typeof applies

    expect(applies({}, { command: 'serve' })).toBe(true)
    expect(applies({}, { command: 'build' })).toBe(false)
    expect(sandboxApplies({}, { command: 'build' })).toBe(true)
  })

  it('emits the source manifest for a hosted sandbox build', async () => {
    const plugin = reviewplane({ sandbox: true })
    await (plugin.configResolved as never as (config: { root: string }) => void)({ root })
    await (plugin.transform as never as (code: string, id: string) => unknown)(
      'export function App() { return <main>Sandbox</main> }',
      `${root}/src/App.tsx`,
    )

    let asset: { type: string; fileName: string; source: string } | undefined
    const generate = plugin.generateBundle as never as (this: { emitFile: (value: typeof asset) => void }) => void
    generate.call({ emitFile: (value) => { asset = value } })

    expect(asset?.fileName).toBe('__reviewplane/manifest.json')
    expect(JSON.parse(asset?.source ?? '{}').records).toEqual(plugin.api.getManifest())
  })

  it('refreshes the manifest during hot updates and serves the endpoint', async () => {
    const plugin = reviewplane()
    const file = `${root}/src/App.tsx`
    const firstSource = 'export function App() { return <main>First</main> }'
    const updatedSource = 'export function App() {\n  return <main>Updated</main>\n}'

    await (plugin.configResolved as never as (config: { root: string }) => void)({ root })
    await (plugin.transform as never as (code: string, id: string) => unknown)(firstSource, file)
    const first = plugin.api.getManifest()[0]
    const firstRevision = plugin.api.getRevision()

    await (plugin.handleHotUpdate as never as (context: { file: string; read: () => Promise<string> }) => Promise<void>)({
      file,
      read: async () => updatedSource,
    })
    const updated = plugin.api.getManifest()[0]

    expect(first.line).toBe(1)
    expect(updated.line).toBe(2)
    expect(updated.fingerprint).not.toBe(first.fingerprint)
    expect(plugin.api.getRevision()).toBeGreaterThan(firstRevision)

    let middleware: ((request: { url?: string }, response: TestResponse, next: () => void) => void) | undefined
    type TestResponse = {
      statusCode: number
      headers: Record<string, string>
      body: string
      setHeader: (name: string, value: string) => void
      end: (body: string) => void
    }
    await (plugin.configureServer as never as (server: { middlewares: { use: (handler: typeof middleware) => void } }) => void)({
      middlewares: { use: (handler) => { middleware = handler } },
    })
    const response: TestResponse = {
      statusCode: 0,
      headers: {},
      body: '',
      setHeader(name, value) { this.headers[name] = value },
      end(body) { this.body = body },
    }
    middleware?.({ url: '/__reviewplane/manifest.json' }, response, () => undefined)

    expect(response.statusCode).toBe(200)
    expect(response.headers['Cache-Control']).toBe('no-store')
    expect(JSON.parse(response.body).revision).toBe(plugin.api.getRevision())
    expect(JSON.parse(response.body).records[0]).toEqual(updated)

    await (plugin.handleHotUpdate as never as (context: { file: string; read: () => Promise<string> }) => Promise<void>)({
      file,
      read: async () => '// @generated\nexport function App() { return <main /> }',
    })
    expect(plugin.api.getManifest()).toEqual([])
  })
})
