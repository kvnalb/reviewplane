import { createHash } from 'node:crypto'
import { extname, relative, resolve } from 'node:path'
import generate from '@babel/generator'
import { parse } from '@babel/parser'
import traverse, { type NodePath } from '@babel/traverse'
import * as t from '@babel/types'
import { normalizePath } from 'vite'

export type SourceRecord = {
  id: string
  file: string
  line: number
  column: number
  tag: string
  component?: string
  fingerprint: string
}

export type Exclusion = string | RegExp

export type InstrumentOptions = {
  root: string
  exclude?: Exclusion[]
}

export type TransformResult = {
  code: string
  map: ReturnType<typeof generate>['map']
  records: SourceRecord[]
}

const SOURCE_ATTRIBUTE = 'data-rp-source-id'
const GENERATED_MARKER = /(?:^|\n)\s*(?:\/\/|\/\*|<!--)\s*@generated\b/i

function digest(value: string, length: number) {
  return createHash('sha256').update(value).digest('hex').slice(0, length)
}

function cleanModuleId(id: string) {
  return normalizePath(id.split('?')[0])
}

function globPattern(pattern: string) {
  const escaped = normalizePath(pattern).replace(/[.+^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`^${escaped.replaceAll('**', '\u0000').replaceAll('*', '[^/]*').replaceAll('\u0000', '.*')}$`)
}

function matchesExclusion(file: string, absoluteFile: string, exclusion: Exclusion) {
  if (exclusion instanceof RegExp) {
    exclusion.lastIndex = 0
    return exclusion.test(file) || exclusion.test(absoluteFile)
  }

  const normalized = normalizePath(exclusion)
  if (normalized.includes('*')) return globPattern(normalized).test(file)
  return file === normalized || file.startsWith(`${normalized}/`) || file.includes(normalized)
}

export function shouldInstrument(id: string, code: string, options: InstrumentOptions) {
  const absoluteFile = cleanModuleId(id)
  const extension = extname(absoluteFile)
  if (extension !== '.jsx' && extension !== '.tsx') return false

  const root = normalizePath(resolve(options.root))
  const file = normalizePath(relative(root, absoluteFile))
  if (file.startsWith('../') || file === '..') return false
  if (absoluteFile.includes('/node_modules/')) return false
  if (/(^|\/)(?:dist|build|coverage|generated)(?:\/|$)/.test(file)) return false
  if (/\.(?:generated|gen)\.[jt]sx$/.test(file)) return false
  if (GENERATED_MARKER.test(code.slice(0, 500))) return false
  if (options.exclude?.some((entry) => matchesExclusion(file, absoluteFile, entry))) return false
  return true
}

function intrinsicTag(path: NodePath<t.JSXOpeningElement>) {
  const name = path.node.name
  if (!t.isJSXIdentifier(name) || !/^[a-z]/.test(name.name)) return undefined
  return name.name
}

function enclosingComponent(path: NodePath<t.JSXOpeningElement>) {
  let current: NodePath | null = path.parentPath

  while (current) {
    const node = current.node as t.Node
    const parentNode = current.parentPath?.node as t.Node | undefined
    if (t.isFunctionDeclaration(node) && node.id?.name) return node.id.name
    if (t.isClassDeclaration(node) && node.id?.name) return node.id.name
    if ((t.isArrowFunctionExpression(node) || t.isFunctionExpression(node)) && t.isVariableDeclarator(parentNode)) {
      const id = parentNode.id
      if (t.isIdentifier(id)) return id.name
    }
    if ((t.isArrowFunctionExpression(node) || t.isFunctionExpression(node)) && t.isObjectProperty(parentNode)) {
      const key = parentNode.key
      if (t.isIdentifier(key)) return key.name
      if (t.isStringLiteral(key)) return key.value
    }
    current = current.parentPath
  }

  return undefined
}

function attributeNames(node: t.JSXOpeningElement) {
  return node.attributes.map((attribute) => {
    if (t.isJSXSpreadAttribute(attribute)) return '...'
    return t.isJSXIdentifier(attribute.name) ? attribute.name.name : 'namespaced'
  }).sort()
}

function hasSourceAttribute(node: t.JSXOpeningElement) {
  return node.attributes.some((attribute) => t.isJSXAttribute(attribute) && t.isJSXIdentifier(attribute.name, { name: SOURCE_ATTRIBUTE }))
}

export function instrumentSource(source: string, id: string, options: InstrumentOptions): TransformResult | null {
  if (!shouldInstrument(id, source, options)) return null

  const absoluteFile = cleanModuleId(id)
  const file = normalizePath(relative(resolve(options.root), absoluteFile))
  const isTypeScript = extname(absoluteFile) === '.tsx'
  const ast = parse(source, {
    sourceType: 'unambiguous',
    sourceFilename: file,
    plugins: isTypeScript ? ['typescript', 'jsx'] : ['jsx'],
  })
  const records: SourceRecord[] = []

  traverse(ast, {
    JSXOpeningElement(path) {
      const tag = intrinsicTag(path)
      const location = path.node.loc?.start
      if (!tag || !location || hasSourceAttribute(path.node)) return

      const component = enclosingComponent(path)
      const line = location.line
      const column = location.column + 1
      const identity = [file, line, column, tag, component ?? ''].join(':')
      const id = digest(identity, 10)
      const start = Math.max(0, (path.node.start ?? 0) - 96)
      const end = Math.min(source.length, (path.node.end ?? start) + 96)
      const nearbySource = source.slice(start, end).replace(/\s+/g, ' ').trim()
      const fingerprint = digest(JSON.stringify({ tag, component, attributes: attributeNames(path.node), nearbySource }), 16)

      path.node.attributes.unshift(t.jsxAttribute(t.jsxIdentifier(SOURCE_ATTRIBUTE), t.stringLiteral(id)))
      records.push({ id, file, line, column, tag, ...(component ? { component } : {}), fingerprint })
    },
  })

  const output = generate(ast, {
    sourceMaps: true,
    sourceFileName: file,
    retainLines: true,
  }, source)

  return { code: output.code, map: output.map, records }
}
