import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import type { FetchTestEvent } from '../../src/playground/injection/fetch/index'
import { gotoInjectionModule } from './helpers'

const TEST_API_PATH = '/api/test/data'
const MOCK_BODY = '{"ok":true}'

async function getFetchTestEvents(page: Page): Promise<FetchTestEvent[]> {
  return page.evaluate(() => window.testFetchEvents?.slice() ?? [])
}

async function waitForFetchModuleReady(page: Page) {
  await gotoInjectionModule(page, 'fetch')
  await page.evaluate(() => {
    window.testFetchEvents = []
  })
}

function mockTestApi(page: Page) {
  return page.route(`**${TEST_API_PATH}`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: MOCK_BODY,
    }),
  )
}

test.describe('Fetch injection', () => {
  test('should intercept fetch when URL matches listener', async ({ page }) => {
    await mockTestApi(page)
    await waitForFetchModuleReady(page)

    await page.evaluate((url) => window.runFetchRequest!(url), TEST_API_PATH)

    await expect
      .poll(async () => getFetchTestEvents(page), { timeout: 5000 })
      .toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            source: 'fetch',
            url: TEST_API_PATH,
            res: MOCK_BODY,
          }),
        ]),
      )
  })

  test('should intercept XMLHttpRequest when URL matches listener', async ({
    page,
  }) => {
    await mockTestApi(page)
    await waitForFetchModuleReady(page)

    await page.evaluate((url) => window.runXHRRequest!(url), TEST_API_PATH)

    await expect
      .poll(async () => getFetchTestEvents(page), { timeout: 5000 })
      .toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            source: 'xhr',
            url: TEST_API_PATH,
            res: MOCK_BODY,
          }),
        ]),
      )
  })

  test('should not trigger listener for non-matching URLs', async ({
    page,
  }) => {
    await page.route('**/api/other/data', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '{"ignored":true}',
      }),
    )
    await waitForFetchModuleReady(page)

    await page.evaluate(() => window.runFetchRequest!('/api/other/data'))

    await page.waitForTimeout(300)
    const events = await getFetchTestEvents(page)
    expect(events).toHaveLength(0)
  })
})
