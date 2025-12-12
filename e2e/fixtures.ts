import path from 'path'
import { setTimeout as sleep } from 'timers/promises'
import { fileURLToPath } from 'url'
import fs from 'fs-extra'
import { type BrowserContext, test as base, chromium } from '@playwright/test'
import type { Manifest } from 'webextension-polyfill'
import packageJson from '../package.json' with { type: 'json' }

export const { name } = packageJson

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const extensionPath = path.resolve(__dirname, '../dist')

const chromeExePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
export const test = base.extend<{
  context: BrowserContext
  extensionId: string
}>({
  context: async ({ headless, browser }, use, testInfo) => {
    // workaround for the Vite server has started but contentScript is not yet.
    await sleep(1000)

    // Create a sanitized folder name from test title
    const sanitizeTitle = (title: string) => {
      return title
        .replace(/[<>:"/\\|?*]/g, '_')
        .replace(/\s+/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')
    }

    const testDirName = sanitizeTitle(testInfo.title)
    const videoDir = path.resolve(__dirname, '../videos', testDirName)

    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        // ...(headless ? ['--headless=new'] : []),
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        // Enable video playback in CI environments
        '--autoplay-policy=no-user-gesture-required',
        '--use-fake-ui-for-media-stream',
        '--use-fake-device-for-media-stream',
        // Force software rendering for CI environments without GPU
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--disable-features=VaapiVideoDecoder',
      ],
      recordVideo: {
        dir: videoDir,
      },
      channel: 'chromium',
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
