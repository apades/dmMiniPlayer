import { expect, test, type Page } from '@playwright/test'
import type { ElementPickerOptions } from '../src'

const PLAYGROUND_URL = process.env.PLAYGROUND_URL || 'http://localhost:5174'

async function createPicker(page: Page, options: ElementPickerOptions) {
  return page.evaluate((opts) => {
    return window.__elementPickerPlayground.createPicker(
      opts as ElementPickerOptions,
    ).type
  }, options)
}

async function getState(page: Page) {
  return page.evaluate(() => {
    const picker = window.__elementPickerPlayground.getPicker()
    return {
      type: picker?.type ?? null,
      count: picker?.elements.length ?? 0,
      ids:
        picker?.elements.map((el) => el.dataset.testid ?? el.className) ?? [],
      selector: picker?.cssSelector ?? '',
      overlay: !!document.querySelector('[data-element-picker="overlay"]'),
      selectedBoxes: document.querySelectorAll(
        '[data-element-picker="selected"]',
      ).length,
    }
  })
}

test.describe('ElementPicker', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PLAYGROUND_URL)
    await page.waitForFunction(() => !!window.__elementPickerPlayground)
  })

  test('infers single type from a string selector and highlights one node', async ({
    page,
  }) => {
    await createPicker(page, { selector: '.hero' })
    const state = await getState(page)
    expect(state.type).toBe('single')
    expect(state.count).toBe(1)
    expect(state.selectedBoxes).toBe(1)
    expect(state.selector).toBe('.hero')
  })

  test('infers list type from an array selector and highlights all matches', async ({
    page,
  }) => {
    await createPicker(page, { selector: ['.card'] })
    const state = await getState(page)
    expect(state.type).toBe('list')
    expect(state.count).toBe(4)
    expect(state.selectedBoxes).toBe(4)
  })

  test('single mode picks only the clicked element', async ({ page }) => {
    await createPicker(page, { type: 'single' })
    await page.getByTestId('card').nth(1).click()
    const state = await getState(page)
    expect(state.type).toBe('single')
    expect(state.count).toBe(1)
    expect(state.ids).toEqual(['card'])
  })

  test('list mode extracts features and selects sibling cards', async ({
    page,
  }) => {
    await createPicker(page, { type: 'list' })
    await page.getByTestId('card').first().click()
    const state = await getState(page)
    expect(state.type).toBe('list')
    expect(state.count).toBe(4)
    expect(state.selectedBoxes).toBe(4)
  })

  test('right-click drops extra features of an over-selected node', async ({
    page,
  }) => {
    await createPicker(page, { type: 'list' })
    await page.getByTestId('comment').first().click()
    const before = await getState(page)
    expect(before.count).toBeGreaterThan(3)

    await page.getByTestId('comment-promo').click({ button: 'right' })
    const after = await getState(page)
    expect(after.count).toBeLessThan(before.count)
    expect(after.ids).not.toContain('comment-promo')
  })

  test('observerAllDomChange refreshes the list when matching nodes appear', async ({
    page,
  }) => {
    await createPicker(page, {
      selector: ['.card'],
      observerAllDomChange: true,
    })
    await page.evaluate(() => {
      const card = document.createElement('article')
      card.className = 'card'
      card.dataset.testid = 'card'
      card.textContent = 'Epsilon'
      document.querySelector('[data-testid="cards"]')?.appendChild(card)
    })
    await expect.poll(async () => (await getState(page)).count).toBe(5)
  })

  test('panel shows mode and selector, confirm keeps the result', async ({
    page,
  }) => {
    await createPicker(page, { selector: ['.card'] })
    const panel = page.locator('[data-element-picker="panel"]')
    await expect(panel.locator('[data-role="mode"]')).toHaveText('list')
    await expect(panel.locator('[data-role="count"]')).toHaveText('4')
    await expect(panel.locator('[data-role="query"]')).toHaveText('.card')

    await page.evaluate(() => {
      const target = window as Window & {
        __confirmResult?: { count: number; selector: string }
      }
      target.__confirmResult = undefined
      window.__elementPickerPlayground.getPicker()!.on('confirm', (payload) => {
        target.__confirmResult = {
          count: payload.elements.length,
          selector: payload.cssSelector,
        }
      })
    })
    await panel.getByRole('button', { name: 'Confirm' }).click()
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (window as Window & { __confirmResult?: { count: number } })
              .__confirmResult,
        ),
      )
      .toEqual({ count: 4, selector: '.card' })
    await expect(panel).toHaveCount(0)
  })

  test('panel close destroys the picker', async ({ page }) => {
    await createPicker(page, { type: 'single' })
    const panel = page.locator('[data-element-picker="panel"]')
    await expect(panel).toBeVisible()
    await panel.getByRole('button', { name: 'Close' }).click()
    const state = await getState(page)
    expect(state.count).toBe(0)
    expect(state.overlay).toBe(false)
    await expect(panel).toHaveCount(0)
  })

  test('destroy removes overlay and selection', async ({ page }) => {
    await createPicker(page, { selector: ['.card'] })
    await page.evaluate(() => window.__elementPickerPlayground.destroyPicker())
    const state = await getState(page)
    expect(state.count).toBe(0)
    expect(state.overlay).toBe(false)
    expect(state.selectedBoxes).toBe(0)
  })
})
