import { test, expect } from '@playwright/test'
import { gotoInjectionModule } from './helpers'

async function readVisibilityState(page: import('@playwright/test').Page) {
  return page.evaluate(() => window.readVisibilityState!())
}

test.describe('Visibility injection', () => {
  test('should force document.visibilityState to visible', async ({ page }) => {
    await gotoInjectionModule(page, 'visibility')

    await page.evaluate(() => window.visibilityAlwaysVisibleTest!())

    await expect
      .poll(() => readVisibilityState(page), { timeout: 5000 })
      .toBe('visible')
  })

  test('should force document.visibilityState to hidden', async ({ page }) => {
    await gotoInjectionModule(page, 'visibility')

    await page.evaluate(() => window.visibilityAlwaysHiddenTest!())

    await expect
      .poll(() => readVisibilityState(page), { timeout: 5000 })
      .toBe('hidden')
  })

  test('should restore native visibilityState after restore()', async ({
    page,
  }) => {
    await gotoInjectionModule(page, 'visibility')

    const nativeState = await readVisibilityState(page)

    await page.evaluate(() => window.visibilityAlwaysHiddenTest!())
    await expect
      .poll(() => readVisibilityState(page), { timeout: 5000 })
      .toBe('hidden')

    await page.evaluate(() => window.visibilityRestoreTest!())
    await expect
      .poll(() => readVisibilityState(page), { timeout: 5000 })
      .toBe(nativeState)
  })
})
