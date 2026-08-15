import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  retries: process.env.CI ? 2 : 0,
  projects: [
    {
      name: 'chrome',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
  ],
  use: {
    baseURL: 'http://localhost:5174',
  },
  webServer: {
    command: 'pnpm playground',
    url: 'http://localhost:5174',
    reuseExistingServer: !process.env.CI,
  },
})
