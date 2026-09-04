import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { instrumentSource } from '@reviewplane/vite'

const fixturesRoot = join(import.meta.dirname, '../../../tests/fixtures')

function coverageFor(appDir: string, files: string[]) {
  let totalIntrinsics = 0
  let mapped = 0
  for (const relative of files) {
    const absolute = join(fixturesRoot, appDir, relative)
    const code = readFileSync(absolute, 'utf8')
    const intrinsicTags = [...code.matchAll(/<([a-z][a-z0-9]*)\b/g)].map((match) => match[1])
    totalIntrinsics += intrinsicTags.length
    const result = instrumentSource(code, absolute, { root: join(fixturesRoot, appDir) })
    mapped += result?.records.length ?? 0
  }
  return { totalIntrinsics, mapped, ratio: totalIntrinsics === 0 ? 0 : mapped / totalIntrinsics }
}

describe('fixture source-mapping coverage', () => {
  it('maps at least 90% of ordinary intrinsic JSX in vite-react', () => {
    const coverage = coverageFor('vite-react', ['src/App.tsx'])
    expect(coverage.mapped).toBeGreaterThan(0)
    expect(coverage.ratio).toBeGreaterThanOrEqual(0.9)
  })

  it('maps at least 90% of ordinary intrinsic JSX in vite-swc-tailwind', () => {
    const coverage = coverageFor('vite-swc-tailwind', ['src/App.tsx'])
    expect(coverage.ratio).toBeGreaterThanOrEqual(0.9)
  })

  it('maps at least 90% of ordinary intrinsic JSX in vite-tailwind-radix', () => {
    const coverage = coverageFor('vite-tailwind-radix', ['src/App.tsx', 'src/button.tsx'])
    expect(coverage.ratio).toBeGreaterThanOrEqual(0.9)
  })
})
