/**
 * @see {@link https://playwright.dev/docs/chrome-extensions Chrome extensions | Playwright}
 */
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  use: {
    headless: false,
    video: 'on',
    // Note: executablePath is set in fixtures.ts to use Chrome for video codec support
    // while still allowing extension loading via --load-extension args
  },
  // webServer: {
  //   command: 'npm run dev',
  //   // start e2e test after the Vite server is fully prepared
  //   url: 'http://localhost:3303/popup/main.ts',
  //   reuseExistingServer: true,
  // },
})
