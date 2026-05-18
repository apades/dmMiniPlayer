import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import type { RunCodeTestEvent } from '../../src/playground/injection/run-code/index'
import { gotoInjectionModule } from './helpers'

async function getRunCodeTestEvents(page: Page): Promise<RunCodeTestEvent[]> {
  return page.evaluate(() => window.testRunCodeEvents?.slice() ?? [])
}

async function waitForRunCodeModuleReady(page: Page) {
  await gotoInjectionModule(page, 'run-code')
}

test.describe('Run-code injection', () => {
  test('should run code in page context and return result', async ({
    page,
  }) => {
    await waitForRunCodeModuleReady(page)

    const result = await page.evaluate(() => window.runCodeRunTest!())

    expect(result).toEqual({ first: 10, second: 10 })
  })

  test('should forward page events to client callbacks via runWithCallback', async ({
    page,
  }) => {
    await waitForRunCodeModuleReady(page)

    await page.evaluate(() => window.runCodeCallbackTest!())

    await expect
      .poll(async () => getRunCodeTestEvents(page), { timeout: 5000 })
      .toEqual(
        expect.arrayContaining([
          { type: 'callback', payload: 'ping' },
          { type: 'cleared' },
        ]),
      )

    const events = await getRunCodeTestEvents(page)
    expect(
      events.filter(
        (e) => e.type === 'callback' && e.payload === 'after-clear',
      ),
    ).toHaveLength(0)
  })
})
