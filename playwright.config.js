const { defineConfig, devices } = require('@playwright/test');

// Requiring the config module also loads `.env` (see src/config/environment.js).
// Local overrides live there and are never committed; CI injects the same names
// as real environment variables. See .env.example for the full list.
const { urls, mockApiPort, usesMockApi, timeouts } = require('./src/config/environment');

const isCi = !!process.env.CI;

module.exports = defineConfig({
  testDir: './tests',
  outputDir: 'test-results/',

  fullyParallel: true,
  forbidOnly: isCi,
  retries: Number(process.env.RETRIES ?? (isCi ? 2 : 0)),
  workers: process.env.WORKERS ? Number(process.env.WORKERS) : undefined,

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['junit', { outputFile: 'results.xml' }],
  ],

  use: {
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  /*
   * One project per test layer, each with its own time budget: `--project=api`
   * runs the API contract tests without launching a browser, `--project=ui-chromium`
   * runs the browser tests. A new browser or device is another entry with the
   * same `testDir`.
   */
  projects: [
    {
      name: 'api',
      testDir: './tests/api',
      timeout: timeouts.apiTest,
      expect: { timeout: timeouts.apiExpect },
      use: { baseURL: urls.api },
    },
    {
      // Precondition of the UI suite: PayDo must serve this network at all. It
      // blocks datacenter IPs, and without this the block shows up as a dozen
      // unrelated locator timeouts. Runs automatically as a dependency.
      name: 'ui-preflight',
      testDir: './tests/preflight',
      timeout: timeouts.uiTest,
      expect: { timeout: timeouts.uiExpect },
      use: {
        ...devices['Desktop Chrome'],
        baseURL: urls.marketing,
      },
    },
    {
      name: 'ui-chromium',
      testDir: './tests/ui',
      dependencies: ['ui-preflight'],
      timeout: timeouts.uiTest,
      expect: { timeout: timeouts.uiExpect },
      use: {
        ...devices['Desktop Chrome'],
        baseURL: urls.marketing,
        viewport: { width: 1440, height: 900 },
      },
    },
  ],

  /*
   * The task specifies the two API methods but no host to call, so the repo
   * ships a reference implementation in `mock-api/` and starts it here. Set
   * API_BASE_URL to run the same specs against a deployed service instead.
   */
  webServer: usesMockApi
    ? {
      command: 'node mock-api/server.js',
      url: `${urls.api}/health`,
      env: { PORT: String(mockApiPort) },
      // Always start our own instance: reusing whatever already listens on the
      // port would silently run the specs against an unrelated local service.
      reuseExistingServer: false,
      timeout: 30_000,
      stdout: 'pipe',
      stderr: 'pipe',
    }
    : undefined,
});
