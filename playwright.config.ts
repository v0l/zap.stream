import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./e2e",
  workers: 1,
  retries: 0,
  timeout: 45_000,
  expect: { timeout: 15_000 },
  use: { baseURL: "http://127.0.0.1:5179", trace: "retain-on-failure" },
  projects: [
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "android-chromium", use: { ...devices["Pixel 7"] } },
  ],
  webServer: [
    {
      command: "bun run start --host 127.0.0.1 --port 5179 --strictPort",
      url: "http://127.0.0.1:5179",
      reuseExistingServer: false,
      timeout: 120_000,
    },
    { command: "bun e2e/signer-server.ts", url: "http://127.0.0.1:5180/health", reuseExistingServer: false },
  ],
})
