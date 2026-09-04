const MARKER_BEGIN = '/* reviewplane:begin */'
const MARKER_END = '/* reviewplane:end */'

export type VitePatchResult =
  | { status: 'updated' | 'unchanged'; code: string }
  | { status: 'manual'; reason: string; code: string }

export function patchViteConfig(source: string): VitePatchResult {
  if (source.includes('@reviewplane/vite') || source.includes('reviewplane(')) {
    return { status: 'unchanged', code: source }
  }

  if (/defineConfig\s*\(\s*(async\s*)?\(/.test(source) && !/defineConfig\s*\(\s*\{/.test(source)) {
    return {
      status: 'manual',
      reason: 'Functional vite.config detected. Add reviewplane() before your React plugin manually.',
      code: source,
    }
  }

  let next = source
  if (!/from\s+['"]@reviewplane\/vite['"]/.test(next)) {
    const importLine = `import reviewplane from '@reviewplane/vite'\n`
    if (/^import .+$/m.test(next)) {
      next = next.replace(/^(import .+$\n?)/m, `$1${importLine}`)
    } else {
      next = importLine + next
    }
  }

  if (/plugins\s*:\s*\[/.test(next)) {
    next = next.replace(/plugins\s*:\s*\[/, `plugins: [${MARKER_BEGIN} reviewplane(), ${MARKER_END} `)
  } else if (/defineConfig\s*\(\s*\{/.test(next)) {
    next = next.replace(/defineConfig\s*\(\s*\{/, `defineConfig({\n  plugins: [${MARKER_BEGIN} reviewplane(), ${MARKER_END}],`)
  } else {
    return {
      status: 'manual',
      reason: 'Could not locate a plugins array in vite.config. Add reviewplane() before your React plugin.',
      code: source,
    }
  }

  return { status: 'updated', code: next }
}

function findMatchingParen(source: string, openIndex: number) {
  let depth = 0
  for (let index = openIndex; index < source.length; index += 1) {
    const character = source[index]
    if (character === '(') depth += 1
    else if (character === ')') {
      depth -= 1
      if (depth === 0) return index
    }
  }
  return -1
}

export function patchEntry(source: string, entryFileName: string): { status: 'updated' | 'unchanged'; code: string } {
  if (source.includes('@reviewplane/react') || source.includes('<ReviewPlane')) {
    return { status: 'unchanged', code: source }
  }

  const isTsx = entryFileName.endsWith('.tsx') || entryFileName.endsWith('.jsx')
  if (!isTsx) {
    return { status: 'unchanged', code: source }
  }

  const importLine = `import { ReviewPlane } from '@reviewplane/react'\n`
  let next = source
  if (!/from\s+['"]@reviewplane\/react['"]/.test(next)) {
    if (/^import .+$/m.test(next)) next = next.replace(/^(import .+$\n?)/m, `$1${importLine}`)
    else next = importLine + next
  }

  const renderCall = next.search(/\.render\s*\(/)
  if (renderCall >= 0) {
    const open = next.indexOf('(', renderCall)
    const close = findMatchingParen(next, open)
    if (close > open) {
      const tree = next.slice(open + 1, close).trim().replace(/,\s*$/, '')
      const wrapped = `\n  <>\n    {import.meta.env.DEV ? <ReviewPlane /> : null}\n    ${tree}\n  </>\n`
      next = `${next.slice(0, open + 1)}${wrapped}${next.slice(close)}`
      return { status: 'updated', code: next }
    }
  }

  next += `\n\n// Manual fallback: mount <ReviewPlane /> behind import.meta.env.DEV in your root tree.\n`
  return { status: 'updated', code: next }
}

export function agentsSnippet() {
  return `## ReviewPlane

For ReviewPlane visual correction batches:

- New React + Vite work: \`.agents/skills/reviewplane-create-react/SKILL.md\`
- Existing React + Vite app: \`.agents/skills/reviewplane-adopt-react/SKILL.md\`

If skills are not discoverable, retrieve every correction, inspect the canonical source, apply one minimal patch, validate, and acknowledge applied, unresolved, and failed correction IDs separately.

Never claim that WebMCP wakes an idle coding agent. Keep ReviewPlane out of ordinary production builds unless an explicit hosted sandbox mode is enabled.
`
}

export { MARKER_BEGIN, MARKER_END }
