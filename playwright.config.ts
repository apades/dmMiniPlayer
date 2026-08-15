/**
 * @see {@link https://playwright.dev/docs/chrome-extensions Chrome extensions | Playwright}
 */
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: '.',
  testMatch: [
    'e2e/**/*.spec.ts',
    'e2e/**/*.test.ts',
    'packages/element-picker/e2e/**/*.spec.ts',
  ],
  retries: 2,
  // webServer: {
  //   command: 'npm run dev',
  //   // start e2e test after the Vite server is fully prepared
  //   url: 'http://localhost:3303/popup/main.ts',
  //   reuseExistingServer: true,
  // },
})
