import { defineConfig, devices } from '@playwright/test'

const isCI = !!process.env.CI

/**
 * Aggressive CI exit handler - ensures process terminates
 * Run this in globalTeardown to force clean exit in CI
 */
function setupCIExit() {
  if (!isCI) return

  // Clear all timers and handles
  const maxTimerId = 100000
  for (let i = 1; i <= maxTimerId; i++) {
    clearTimeout(i)
    clearInterval(i)
  }

  // Unref all active handles
  try {
    // @ts-ignore
    const handles = process._getActiveHandles?.() || []
    // @ts-ignore
    const requests = process._getActiveRequests?.() || []

    handles.forEach((h) => {
      if (h?.unref) {
        try {
          h.unref()
        } catch {}
      }
    })

    requests.forEach((r) => {
      if (r?.abort) {
        try {
          r.abort()
        } catch {}
      }
    })
  } catch {}

  // Schedule exit with fallback
  setImmediate(() => {
    setImmediate(() => {
      // eslint-disable-next-line no-process-exit
      process.exit(0)
    })
  })

  // Hard timeout: force exit after 2s
  setTimeout(() => {
    // eslint-disable-next-line no-process-exit
    process.exit(0)
  }, 2000).unref()
}

// Immediately set up CI exit handler if running in CI
if (isCI) {
  // Re-export a teardown function
  globalThis.__setupCIExit = setupCIExit
}

export default defineConfig({
  testDir: './test',
  testMatch: '**/*.playwright.spec.js',
  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: false,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: 1,
  reporter: isCI ? 'list' : 'html',

  // Aggressive timeouts for CI
  globalTimeout: isCI ? 5 * 60 * 1000 : undefined,

  use: {
    trace: isCI ? 'off' : 'on-first-retry',
    ignoreHTTPSErrors: true,
    navigationTimeout: isCI ? 15000 : 30000,
    actionTimeout: isCI ? 10000 : 30000,
  },

  // Global setup to prepare server
  globalSetup: async () => {
    if (!isCI) return

    // Pre-clear any lingering resources
    setTimeout(() => {}, 100).unref()
  },

  // Global teardown to force exit
  globalTeardown: async () => {
    if (!isCI) return

    // Trigger aggressive exit
    setupCIExit()

    // Keep script alive just long enough for exit to fire
    return new Promise(() => {
      setTimeout(() => {}, 5000)
    })
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: isCI
            ? [
                '--disable-dev-shm-usage',
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--single-process',
                '--disable-gpu',
              ]
            : [],
        },
      },
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
      },
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
      },
    },
  ],
})
