export const runtimeModuleId = 'virtual:reviewplane/runtime'
export const resolvedRuntimeModuleId = `\0${runtimeModuleId}`

export const runtimeSource = String.raw`
const counters = new Map()

function assignOccurrenceIds(root = document) {
  const candidates = []
  if (root instanceof Element && root.matches('[data-rp-source-id]')) candidates.push(root)
  if ('querySelectorAll' in root) candidates.push(...root.querySelectorAll('[data-rp-source-id]'))

  for (const element of candidates) {
    const sourceId = element.getAttribute('data-rp-source-id')
    if (!sourceId) continue
    if (element.getAttribute('data-rp-occurrence-id')?.startsWith(sourceId + ':')) continue
    const occurrence = (counters.get(sourceId) ?? 0) + 1
    counters.set(sourceId, occurrence)
    element.setAttribute('data-rp-occurrence-id', sourceId + ':' + occurrence)
  }
}

assignOccurrenceIds()
new MutationObserver((records) => {
  for (const record of records) {
    if (record.type === 'attributes' && record.target instanceof Element) assignOccurrenceIds(record.target)
    for (const node of record.addedNodes) {
      if (node instanceof Element) assignOccurrenceIds(node)
    }
  }
}).observe(document.documentElement, { attributes: true, attributeFilter: ['data-rp-source-id'], childList: true, subtree: true })
`
