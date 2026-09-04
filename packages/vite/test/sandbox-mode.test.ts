import { describe, expect, it } from 'vitest'
import reviewplane from '../src/index.ts'

describe('sandbox apply mode', () => {
  it('applies during serve by default', () => {
    const plugin = reviewplane()
    expect(typeof plugin.apply).toBe('function')
    // @ts-expect-error vitest helper for vite apply signature
    expect(plugin.apply({}, { command: 'serve' })).toBe(true)
    // @ts-expect-error vitest helper for vite apply signature
    expect(plugin.apply({}, { command: 'build' })).toBe(false)
  })

  it('applies during build when mode is sandbox', () => {
    const plugin = reviewplane({ mode: 'sandbox' })
    // @ts-expect-error vitest helper for vite apply signature
    expect(plugin.apply({}, { command: 'serve' })).toBe(true)
    // @ts-expect-error vitest helper for vite apply signature
    expect(plugin.apply({}, { command: 'build' })).toBe(true)
  })
})
