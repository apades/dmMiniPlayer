import path from 'path'
import { setTimeout as sleep } from 'timers/promises'
import { fileURLToPath } from 'url'
import fs from 'fs-extra'
import { type BrowserContext, test as base, chromium } from '@playwright/test'
import type { Manifest } from 'webextension-polyfill'
import packageJson from '../package.json' with { type: 'json' }

export const { name } = packageJson

export const extensionPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../dist',
)

const chromeExePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
export const test = base.extend<{
  context: BrowserContext
  extensionId: string
}>({
  context: async ({ headless, browser }, use) => {
    // workaround for the Vite server has started but contentScript is not yet.
    await sleep(1000)
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        // ...(headless ? ['--headless=new'] : []),
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
      // executablePath: chromeExePath,
    })
    await use(context)
    // let [serviceWorker] = context.serviceWorkers()
    // if (!serviceWorker)
    //   serviceWorker = await context.waitForEvent('serviceworker')
    await context.close()
  },
  extensionId: async ({ context }, use) => {
    // for manifest v3:
    let [background] = context.serviceWorkers()
    if (!background) background = await context.waitForEvent('serviceworker')

    const extensionId = background.url().split('/')[2]
    await use(extensionId)
  },
})

export const expect = test.expect

export function isDevArtifact() {
  const manifest: Manifest.WebExtensionManifest = fs.readJsonSync(
    path.resolve(extensionPath, 'manifest.json'),
  )
  return Boolean(
    typeof manifest.content_security_policy === 'object' &&
      manifest.content_security_policy.extension_pages?.includes('localhost'),
  )
}
