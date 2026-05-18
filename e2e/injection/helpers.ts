import type { Page } from '@playwright/test'

export const INJECTION_PLAYGROUND_URL =
  process.env.PLAYGROUND_URL || 'http://localhost:5173'

export function injectionPagePath(moduleName: string) {
  return `${INJECTION_PLAYGROUND_URL}/injection/${moduleName}/index.html`
}

export async function gotoInjectionModule(page: Page, moduleName: string) {
  await page.goto(injectionPagePath(moduleName))
  await page.waitForFunction(() => window.testReady === true, {
    timeout: 10000,
  })
}
