import { defineConfig } from '@playwright/experimental-ct-react'
import react from '@vitejs/plugin-react'

export default defineConfig({
  testDir: './src/experiments',
  testMatch: '**/*.spec.tsx',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['html', { outputFolder: 'playwright-report' }], ['list']],
  use: {
    ctPort: 3100,
    ctViteConfig: {
      plugins: [react()],
    },
    trace: 'on-first-retry',
  },
})
