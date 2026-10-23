import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testIgnore: 'offline-pwa.spec.ts',
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // El backend, PostgreSQL y Redis se levantan antes con docker compose up -d.
  webServer: { command: 'npm run dev -- --port 5173 --strictPort', url: 'http://localhost:5173', reuseExistingServer: !process.env.CI },
});
