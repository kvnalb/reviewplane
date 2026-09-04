import { expect, test, type Page } from '@playwright/test'

async function shadowText(page: Page) {
  return page.evaluate(() => document.querySelector('[data-reviewplane-overlay]')?.shadowRoot?.textContent ?? '')
}

async function clickShadowButton(page: Page, label: string | RegExp) {
  await page.evaluate((matcher) => {
    const host = document.querySelector('[data-reviewplane-overlay]')
    const buttons = [...(host?.shadowRoot?.querySelectorAll('button') ?? [])]
    const button = buttons.find((entry) => {
      const text = entry.textContent ?? ''
      return typeof matcher === 'string' ? text === matcher : new RegExp(matcher).test(text)
    })
    button?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  }, label instanceof RegExp ? label.source : label)
}

async function activateOverlay(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: /Start reviewing this page/i }).first().click()
  await expect.poll(async () => page.locator('[data-reviewplane-overlay]').count()).toBe(1)
}

async function selectAcross(page: Page, selector: string, width = 160) {
  const target = page.locator(selector).first()
  const box = await target.boundingBox()
  expect(box).toBeTruthy()
  if (!box) return
  await page.mouse.move(box.x + 6, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + Math.min(box.width - 6, width), box.y + box.height / 2, { steps: 10 })
  await page.mouse.up()
}

test.describe('ReviewPlane core flows', () => {
  test('activates overlay from the landing CTA', async ({ page }) => {
    await activateOverlay(page)
    await expect.poll(async () => (await shadowText(page)).includes('ReviewPlane')).toBe(true)
  })

  test('stages a text replacement and submits Done without an agent', async ({ page }) => {
    await activateOverlay(page)
    await clickShadowButton(page, 'Text')
    await selectAcross(page, 'h1', 200)
    await page.waitForFunction(() => Boolean(document.querySelector('[data-reviewplane-overlay]')?.shadowRoot?.querySelector('.rp-popup')))

    await page.evaluate(() => {
      const host = document.querySelector('[data-reviewplane-overlay]')
      const textarea = host?.shadowRoot?.querySelector('textarea') as HTMLTextAreaElement | null
      if (!textarea) return
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set
      setter?.call(textarea, 'Reviewed headline for the demo')
      textarea.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await clickShadowButton(page, /Add correction/i)
    await expect.poll(async () => (await shadowText(page)).includes('pending')).toBe(true)
    await clickShadowButton(page, 'Done')
    await expect.poll(async () => (await shadowText(page)).includes('text-replacement')).toBe(true)
    await expect.poll(async () => (await shadowText(page)).includes('"status": "ready"') || (await shadowText(page)).includes('"status":"ready"')).toBe(true)
  })

  test('supports middle-item undo and reset', async ({ page }) => {
    await activateOverlay(page)
    await clickShadowButton(page, 'Text')

    await selectAcross(page, 'h1', 140)
    await page.waitForFunction(() => document.querySelector('[data-reviewplane-overlay]')?.shadowRoot?.querySelector('.rp-popup'))
    await page.evaluate(() => {
      const host = document.querySelector('[data-reviewplane-overlay]')
      const textarea = host?.shadowRoot?.querySelector('textarea') as HTMLTextAreaElement | null
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set?.call(textarea, 'First correction')
      textarea?.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await clickShadowButton(page, /Add correction/i)

    await selectAcross(page, '.hero-lede', 120)
    await page.waitForFunction(() => document.querySelector('[data-reviewplane-overlay]')?.shadowRoot?.querySelector('.rp-popup'))
    await page.evaluate(() => {
      const host = document.querySelector('[data-reviewplane-overlay]')
      const textarea = host?.shadowRoot?.querySelector('textarea') as HTMLTextAreaElement | null
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set?.call(textarea, 'Second correction')
      textarea?.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await clickShadowButton(page, /Add correction/i)

    await expect.poll(async () => (await shadowText(page)).includes('2 pending')).toBe(true)
    await page.evaluate(() => {
      const host = document.querySelector('[data-reviewplane-overlay]')
      const undo = [...(host?.shadowRoot?.querySelectorAll('button') ?? [])].find((button) => button.textContent === 'Undo')
      undo?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    await expect.poll(async () => (await shadowText(page)).includes('Undone')).toBe(true)
    await clickShadowButton(page, 'Reset all')
    await expect.poll(async () => (await shadowText(page)).includes('0 pending') || (await shadowText(page)).includes('first correction')).toBe(true)
  })

  test('mock WebMCP wait_for_review resolves on Done', async ({ page }) => {
    await page.addInitScript(() => {
      const tools = new Map<string, { execute: (input: unknown, options?: { signal?: AbortSignal }) => Promise<unknown> }>()
      Object.defineProperty(Document.prototype, 'modelContext', {
        configurable: true,
        get() {
          return {
            registerTool(tool: { name: string; execute: (input: unknown, options?: { signal?: AbortSignal }) => Promise<unknown> }) {
              tools.set(tool.name, tool)
              return Promise.resolve()
            },
            async getTools() {
              return new Map(tools)
            },
            async executeTool(name: string, input: unknown = {}) {
              const tool = tools.get(name)
              if (!tool) throw new Error(`missing ${name}`)
              return tool.execute(input, {})
            },
          }
        },
      })
      ;(window as unknown as { __rpTools: typeof tools }).__rpTools = tools
    })

    await activateOverlay(page)
    await page.waitForFunction(() => (window as unknown as { __rpTools: Map<string, unknown> }).__rpTools?.has('wait_for_review'))

    const waitPromise = page.evaluate(async () => {
      const tools = (window as unknown as { __rpTools: Map<string, { execute: (input: unknown) => Promise<unknown> }> }).__rpTools
      return tools.get('wait_for_review')!.execute({})
    })

    await clickShadowButton(page, 'Text')
    await selectAcross(page, '.hero-lede', 100)
    await page.waitForFunction(() => document.querySelector('[data-reviewplane-overlay]')?.shadowRoot?.querySelector('.rp-popup'))
    await page.evaluate(() => {
      const host = document.querySelector('[data-reviewplane-overlay]')
      const textarea = host?.shadowRoot?.querySelector('textarea') as HTMLTextAreaElement | null
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set?.call(textarea, 'Precise handoff copy')
      textarea?.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await clickShadowButton(page, /Add correction/i)
    await clickShadowButton(page, 'Done')

    const result = await waitPromise as { status?: string; batchId?: string; correctionIds?: string[] }
    expect(result.status).toBe('review_ready')
    expect(result.batchId).toBeTruthy()
    expect(result.correctionIds?.length).toBeGreaterThan(0)

    const names = await page.evaluate(() => [...(window as unknown as { __rpTools: Map<string, unknown> }).__rpTools.keys()])
    expect(names.sort()).toEqual(['acknowledge_review', 'get_correction', 'get_review_batch', 'wait_for_review'])
  })

  test('narrow viewport keeps overlay usable', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await activateOverlay(page)
    await expect.poll(async () => (await shadowText(page)).includes('Tray')).toBe(true)
  })
})
