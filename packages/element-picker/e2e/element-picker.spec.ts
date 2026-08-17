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

async function assertSelectorMatchesSelection(page: Page) {
  const result = await page.evaluate(() => {
    const picker = window.__elementPickerPlayground.getPicker()
    if (!picker) return { ok: false, reason: 'no picker' }
    const selector = picker.cssSelector
    const selected = picker.elements
    if (!selector) {
      return {
        ok: picker.type === 'list' && selected.length > 0,
        reason: 'no common features',
        count: selected.length,
      }
    }
    if (picker.type === 'single') {
      return {
        ok: document.querySelector(selector) === selected[0],
        selector,
        count: selected.length,
      }
    }
    const queried = [...document.querySelectorAll(selector)]
    return {
      ok:
        queried.length === selected.length &&
        selected.every((el) => queried.includes(el)),
      selector,
      selected: selected.length,
      queried: queried.length,
    }
  })
  expect(result.ok, JSON.stringify(result)).toBe(true)
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
      pickedBoxes: document.querySelectorAll('[data-element-picker="picked"]')
        .length,
      matchedBoxes: document.querySelectorAll('[data-element-picker="matched"]')
        .length,
      selectedBoxes: document.querySelectorAll(
        '[data-element-picker="picked"], [data-element-picker="matched"]',
      ).length,
      hoverBoxes: document.querySelectorAll('[data-element-picker="hover"]')
        .length,
      pathBars: document.querySelectorAll('[data-element-picker="path"]')
        .length,
      pathChips: [
        ...document.querySelectorAll('[data-element-picker="path-node"]'),
      ].map((el) => el.textContent),
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
    await assertSelectorMatchesSelection(page)
  })

  test('infers list type from an array selector and highlights all matches', async ({
    page,
  }) => {
    await createPicker(page, { selector: ['.card'] })
    const state = await getState(page)
    expect(state.type).toBe('list')
    expect(state.count).toBe(4)
    expect(state.selectedBoxes).toBe(4)
    await assertSelectorMatchesSelection(page)
  })

  test('single mode picks only the clicked element', async ({ page }) => {
    await createPicker(page, { type: 'single' })
    await page.getByTestId('card').nth(1).click()
    const state = await getState(page)
    expect(state.type).toBe('single')
    expect(state.count).toBe(1)
    expect(state.ids).toEqual(['card'])
    await assertSelectorMatchesSelection(page)
  })

  test('single mode unique selector does not match other same-tag nodes', async ({
    page,
  }) => {
    await createPicker(page, { type: 'single' })
    const term = page.locator('[data-testid="defs"] dt').first()
    await term.click()
    const state = await getState(page)
    expect(state.type).toBe('single')
    expect(state.count).toBe(1)
    await assertSelectorMatchesSelection(page)
    const sameNode = await page.evaluate(() => {
      const picker = window.__elementPickerPlayground.getPicker()!
      const selected = picker.elements[0]
      const queried = document.querySelector(picker.cssSelector)
      const other = document.querySelector('[data-testid="other-defs"] dt')
      const rest = [...document.querySelectorAll('[data-testid="defs"] dt')]
      return {
        queriedIsSelected: queried === selected,
        selectedIsOther: selected === other,
        selectedIndex: rest.indexOf(selected),
      }
    })
    expect(sameNode.queriedIsSelected).toBe(true)
    expect(sameNode.selectedIsOther).toBe(false)
    expect(sameNode.selectedIndex).toBe(0)
  })

  test('list mode hover previews related nodes in blue', async ({ page }) => {
    await createPicker(page, { type: 'list' })
    await page.getByTestId('card').first().hover()
    const cards = await getState(page)
    expect(cards.count).toBe(0)
    expect(cards.hoverBoxes).toBe(4)
    await expect(
      page.locator('[data-element-picker="panel"] [data-role="count"]'),
    ).toHaveText('4')
    await page.locator('[data-testid="defs"] dt').first().hover()
    const rows = await getState(page)
    expect(rows.hoverBoxes).toBe(2)
    await expect(
      page.locator('[data-element-picker="panel"] [data-role="count"]'),
    ).toHaveText('2')
  })

  test('hover shows ancestor path chips and they stay after pick', async ({
    page,
  }) => {
    await createPicker(page, { type: 'list' })
    await page.getByTestId('card').first().hover()
    const hovered = await getState(page)
    expect(
      hovered.pathChips.some((text) => text?.includes('article.card')),
    ).toBe(true)
    expect(hovered.pathChips.some((text) => text?.includes('div.cards'))).toBe(
      true,
    )
    await page.getByTestId('card').first().click()
    const picked = await getState(page)
    expect(
      picked.pathChips.some((text) => text?.includes('article.card')),
    ).toBe(true)
    await page.locator('[data-element-picker="path-node"]').first().hover()
    const afterChip = await getState(page)
    expect(afterChip.hoverBoxes).toBeGreaterThan(0)
    expect(
      afterChip.pathChips.some((text) => text?.includes('article.card')),
    ).toBe(true)
  })

  test('list mode extracts features and selects sibling cards', async ({
    page,
  }) => {
    await createPicker(page, { type: 'list' })
    await page.getByTestId('card').first().click()
    const state = await getState(page)
    expect(state.type).toBe('list')
    expect(state.count).toBe(4)
    expect(state.pickedBoxes).toBe(1)
    expect(state.matchedBoxes).toBe(3)
    expect(state.selector).not.toContain('nth-child')
    expect(state.selector).toContain('.card')
    await assertSelectorMatchesSelection(page)
  })

  test('list mode ignores left-click on already matched nodes', async ({
    page,
  }) => {
    await createPicker(page, { type: 'list' })
    await page.getByTestId('card').first().click()
    await page.getByTestId('card').nth(1).click()
    const state = await getState(page)
    expect(state.count).toBe(4)
    expect(state.pickedBoxes).toBe(1)
    expect(state.matchedBoxes).toBe(3)
  })

  test('list mode groups same-tag siblings under a parent', async ({
    page,
  }) => {
    await createPicker(page, { type: 'list' })
    await page.locator('[data-testid="defs"] dt').first().click()
    const state = await getState(page)
    expect(state.type).toBe('list')
    expect(state.count).toBe(2)
    expect(state.pickedBoxes).toBe(1)
    expect(state.matchedBoxes).toBe(1)
    expect(state.selector).toContain('defs')
    expect(state.selector).toContain('> div')
    expect(state.selector).not.toContain('nth-child')
    await assertSelectorMatchesSelection(page)
    const ids = await page.evaluate(() => {
      const picker = window.__elementPickerPlayground.getPicker()!
      return picker.elements.map((el) => ({
        tag: el.tagName,
        inDefs: Boolean(el.closest('[data-testid="defs"]')),
        inOther: Boolean(el.closest('[data-testid="other-defs"]')),
      }))
    })
    expect(ids.every((item) => item.tag === 'DIV' && item.inDefs)).toBe(true)
    expect(ids.some((item) => item.inOther)).toBe(false)
  })

  test('list mode shows "-" when multi-select has no shared class', async ({
    page,
  }) => {
    await createPicker(page, { type: 'list' })
    await page.locator('[data-testid="other-defs"] dt').click()
    await page.locator('.eyebrow').click()
    const state = await getState(page)
    expect(state.count).toBe(2)
    expect(state.selector).toBe('')
    expect(state.pickedBoxes).toBe(2)
    expect(state.matchedBoxes).toBe(0)
    await expect(
      page.locator('[data-element-picker="panel"] [data-role="query"]'),
    ).toHaveText('-')
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
    expect(after.selector).toContain(':not(')
    await assertSelectorMatchesSelection(page)
  })

  test('left-click restores a previously excluded extra match', async ({
    page,
  }) => {
    await createPicker(page, { type: 'list' })
    await page.getByTestId('comment').first().click()
    await page.getByTestId('comment-promo').click({ button: 'right' })
    await page.getByTestId('comment-promo').click()
    const after = await getState(page)
    expect(after.count).toBe(4)
    expect(after.ids).toContain('comment-promo')
    expect(after.selector).toContain('comment-item')
    expect(after.selector).not.toContain(':not(')
    expect(after.pickedBoxes).toBe(1)
    expect(after.matchedBoxes).toBe(3)
    await assertSelectorMatchesSelection(page)
  })

  test('right-click blocks indistinguishable matches and shows a hint', async ({
    page,
  }) => {
    await createPicker(page, { type: 'list' })
    await page.getByTestId('comment').first().click()
    const before = await getState(page)
    await page.getByTestId('comment').nth(2).click({ button: 'right' })
    const after = await getState(page)
    expect(after.count).toBe(before.count)
    expect(after.selector).toBe(before.selector)
    const thirdSelected = await page.evaluate(() => {
      const picker = window.__elementPickerPlayground.getPicker()!
      const third = document.querySelectorAll('[data-testid="comment"]')[2]
      return picker.elements.includes(third as HTMLElement)
    })
    expect(thirdSelected).toBe(true)
    await expect(
      page.locator('[data-element-picker="panel"] [data-role="hint"]'),
    ).toHaveText('Cannot exclude this node; it has no extra features to drop')
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
