import type { BrowserContext, Page } from '@playwright/test'

export type NativeVisibilitySource = 'browser' | 'simulated'

/**
 * Playwright keeps every page "visible" (see playwright#3570). We first try a real
 * background tab via bringToFront; if visibilityState does not change, fall back to
 * the playground test hook that feeds inject's native path.
 */
export async function ensureNativeVisibilityState(
  page: Page,
  context: BrowserContext,
  target: DocumentVisibilityState,
): Promise<NativeVisibilitySource> {
  await page.evaluate(() => window.visibilityClearNativeState?.())

  if (target === 'hidden') {
    const blocker = await context.newPage()
    try {
      await blocker.goto('about:blank')
      await blocker.bringToFront()
      await page.waitForTimeout(300)
    } finally {
      await blocker.close().catch(() => undefined)
    }
  } else {
    await page.bringToFront()
    await page.waitForTimeout(300)
  }

  const actual = await page.evaluate(() => document.visibilityState)
  if (actual === target) return 'browser'

  await page.evaluate((state) => {
    window.visibilitySetNativeState!(state)
  }, target)

  return 'simulated'
}

export async function readPageVisibilityState(page: Page) {
  return page.evaluate(() => document.visibilityState)
}
