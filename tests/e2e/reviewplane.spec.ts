import { expect, test, type Page } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

const modelContextMock = () => {
  const tools = new Map<string, { name: string; title?: string; description: string; execute: (input: Record<string, unknown>, options?: { signal?: AbortSignal }) => Promise<unknown> }>()
  const context = {
    async registerTool(tool: { name: string; title?: string; description: string; execute: (input: Record<string, unknown>, options?: { signal?: AbortSignal }) => Promise<unknown> }) { tools.set(tool.name, tool) },
    async getTools() { return [...tools.values()].map(({ name, title, description }) => ({ name, title, description })) },
    async executeTool(tool: { name: string }, input: string, options?: { signal?: AbortSignal }) {
      const registered = tools.get(tool.name)
      if (!registered) throw new Error(`Unknown tool: ${tool.name}`)
      return JSON.stringify(await registered.execute(JSON.parse(input || '{}'), options))
    },
  }
  Object.defineProperty(Document.prototype, 'modelContext', { configurable: true, get: () => context })
}

async function selectText(page: Page, selector: string, selected: string) {
  await page.locator(selector).evaluate((element, value) => {
    const node = [...element.childNodes].find((candidate) => candidate.nodeType === Node.TEXT_NODE && candidate.nodeValue?.includes(value))
    if (!node?.nodeValue) throw new Error(`Text not found: ${value}`)
    const start = node.nodeValue.indexOf(value)
    const range = document.createRange()
    range.setStart(node, start)
    range.setEnd(node, start + value.length)
    const selection = document.getSelection()
    selection?.removeAllRanges()
    selection?.addRange(range)
    element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, composed: true }))
  }, selected)
}

function productionText(directory: string): string {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name)
    return entry.isDirectory() ? productionText(target) : /\.(js|html)$/.test(entry.name) ? readFileSync(target, 'utf8') : ''
  }).join('\n')
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(modelContextMock)
  await page.goto('/')
  await expect(page.getByRole('toolbar', { name: 'ReviewPlane tools' })).toBeVisible()
})

test('supports keyboard activation, hover targeting, and bounded popups', async ({ page }) => {
  await page.keyboard.press('Alt+Shift+R')
  await expect(page.getByRole('button', { name: 'Inspect', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('heading', { name: 'Review fixture' }).hover()
  await expect(page.locator('.rp-hover-label')).toHaveText('Heading')
  await page.getByRole('heading', { name: 'Review fixture' }).click()
  const popup = page.locator('.rp-popup')
  await expect(popup).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Foreground color', exact: true })).toHaveValue('rgb(20, 32, 27)')
  await expect(page.getByRole('textbox', { name: 'Background color', exact: true })).toHaveValue('rgba(0, 0, 0, 0)')
  await expect(page.getByRole('slider', { name: 'Font size' })).toHaveValue('54')
  const box = await popup.boundingBox()
  expect(box).not.toBeNull()
  expect(box!.x).toBeGreaterThanOrEqual(0)
  expect(box!.y).toBeGreaterThanOrEqual(0)
  expect(box!.x + box!.width).toBeLessThanOrEqual(1280)
  expect(box!.y + box!.height).toBeLessThanOrEqual(800)
  await page.keyboard.press('Escape')
  await expect(popup).toBeHidden()
})

test('previews four direct changes, supports middle undo, and resets to baseline', async ({ page }) => {
  await page.evaluate(() => { window.location.hash = 'same-page-section' })
  await page.getByRole('button', { name: 'Text', exact: true }).click()
  await selectText(page, '#editable', 'quick brown')
  await page.getByRole('textbox', { name: 'Replacement text' }).fill('careful blue')
  await page.getByRole('textbox', { name: 'Foreground color', exact: true }).fill('#be3227')
  await page.getByRole('textbox', { name: 'Background color', exact: true }).fill('#fff7ed')
  await page.getByRole('slider', { name: 'Font size' }).fill('20')
  await page.getByRole('button', { name: 'Add correction' }).click()

  const editable = page.locator('#editable')
  await expect(editable).toContainText('careful blue fox')
  await expect(editable).toHaveCSS('color', 'rgb(190, 50, 39)')
  await expect(editable).toHaveCSS('background-color', 'rgb(255, 247, 237)')
  await expect(editable).toHaveCSS('font-size', '20px')
  await expect(page.getByRole('heading', { name: '4 pending' })).toBeVisible()

  await page.locator('.rp-correction').nth(1).getByRole('button', { name: 'Undo' }).click()
  await expect(editable).not.toHaveCSS('color', 'rgb(190, 50, 39)')
  await page.getByRole('button', { name: 'Reset all' }).click()
  await expect(editable).toHaveText('The quick brown fox needs a clearer sentence.')
  await expect(editable).toHaveCSS('font-size', '18px')
  await expect(page.getByRole('heading', { name: '0 pending' })).toBeVisible()
})

test('lassos repeated content, removes a target, and stages one group instruction', async ({ page }) => {
  await page.getByRole('button', { name: 'Lasso' }).click()
  const cards = page.locator('.cards')
  const box = await cards.boundingBox()
  expect(box).not.toBeNull()
  await page.mouse.move(box!.x + 2, box!.y + 2)
  await page.mouse.down()
  await page.mouse.move(box!.x + box!.width - 2, box!.y + box!.height - 2, { steps: 8 })
  await page.mouse.up()
  await expect(page.getByRole('heading', { name: /selected items/ })).toBeVisible()
  const removeButtons = page.getByRole('button', { name: 'Remove' })
  const before = await removeButtons.count()
  expect(before).toBeGreaterThan(1)
  await removeButtons.first().click()
  await expect(removeButtons).toHaveCount(before - 1)
  await page.getByRole('textbox', { name: 'Instruction for this group' }).fill('Give these cards more breathing room.')
  await page.getByRole('button', { name: 'Add correction' }).click()
  await expect(page.getByRole('heading', { name: '1 pending' })).toBeVisible()
  await expect(page.locator('.rp-correction')).toContainText('Give these cards more breathing room.')
})

test('submits without a waiter, offers fallback, and restores the page', async ({ page }) => {
  await page.getByRole('button', { name: 'Inspect', exact: true }).click()
  await page.getByRole('heading', { name: 'Review fixture' }).click()
  await page.getByRole('textbox', { name: 'Foreground color', exact: true }).fill('#be3227')
  await page.getByRole('button', { name: 'Add correction' }).click()
  await page.getByRole('button', { name: 'Done' }).click()
  await expect(page.getByRole('button', { name: 'Copy review' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Download JSON' })).toBeVisible()
  await expect(page.locator('body')).not.toContainText('src/App.tsx')
  await page.getByRole('button', { name: 'Reset page' }).click()
  await expect(page.getByRole('heading', { name: '0 pending' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Review fixture' })).not.toHaveCSS('color', 'rgb(190, 50, 39)')
})

test('resolves a real pending mock WebMCP wait on Done', async ({ page }) => {
  await page.getByRole('button', { name: 'Tray 0' }).click()
  await page.evaluate(() => {
    const context = document.modelContext!
    ;(window as unknown as { reviewPromise: Promise<unknown> }).reviewPromise = context.getTools().then((tools) => {
      const tool = tools.find(({ name }) => name === 'wait_for_review')!
      return context.executeTool(tool, JSON.stringify({ requestId: 'e2e' }))
    })
  })
  await expect(page.locator('.rp-status')).toHaveText('Agent connected and waiting')
  await page.getByRole('button', { name: 'Inspect', exact: true }).click()
  await page.getByRole('heading', { name: 'Review fixture' }).click()
  await page.getByRole('slider', { name: 'Font size' }).fill('48')
  await page.getByRole('button', { name: 'Add correction' }).click()
  await page.getByRole('button', { name: 'Done' }).click()
  const result = await page.evaluate(async () => JSON.parse(await (window as unknown as { reviewPromise: Promise<string> }).reviewPromise))
  expect(result).toMatchObject({ status: 'review_ready', requestId: 'e2e' })
})

test('restores a draft after reload and warns when its target disappears', async ({ page }) => {
  await page.getByRole('button', { name: 'Text', exact: true }).click()
  await selectText(page, '#editable', 'quick brown')
  await page.getByRole('textbox', { name: 'Replacement text' }).fill('restored draft')
  await page.getByRole('button', { name: 'Add correction' }).click()
  await page.reload()
  await page.getByRole('button', { name: 'Tray 1' }).click()
  await expect(page.getByRole('heading', { name: '1 pending' })).toBeVisible()
  await expect(page.locator('#editable')).toContainText('restored draft')
  await page.locator('#editable').evaluate((element) => element.remove())
  await expect(page.locator('.rp-stale')).toHaveText('Page changed · select again')
})

test('keeps controls reachable at a narrow viewport and supports keyboard navigation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 })
  await expect(page.getByRole('toolbar', { name: 'ReviewPlane tools' })).toBeInViewport()
  await page.keyboard.press('Tab')
  await expect(page.locator(':focus')).toBeVisible()
  await page.getByRole('button', { name: 'Tray 0' }).click()
  await expect(page.locator('.rp-tray')).toBeInViewport()
})

test('keeps ReviewPlane out of an ordinary production build', () => {
  const output = mkdtempSync(path.join(tmpdir(), 'reviewplane-production-'))
  execFileSync('npx', ['vite', 'build', '--config', 'tests/e2e/fixture/vite.config.ts', '--outDir', output, '--emptyOutDir'], { cwd: repository })
  expect(productionText(output)).not.toMatch(/data-rp-source-id|reviewplane-preview-styles|wait_for_review|reviewplane-dev/)
})

test('maps at least 90 percent of ordinary visible targets in both fixtures', async ({ page }) => {
  const measure = () => page.locator('#root').evaluate((root) => {
    const visible = [...root.querySelectorAll<HTMLElement>('*')].filter((element) => {
      const style = getComputedStyle(element)
      const rect = element.getBoundingClientRect()
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0
    })
    return { visible: visible.length, mapped: visible.filter((element) => element.hasAttribute('data-rp-source-id')).length }
  })

  const testbed = await measure()
  await page.goto('http://127.0.0.1:5192')
  const demo = await measure()
  expect(testbed.mapped / testbed.visible).toBeGreaterThanOrEqual(.9)
  expect(demo.mapped / demo.visible).toBeGreaterThanOrEqual(.9)
})
