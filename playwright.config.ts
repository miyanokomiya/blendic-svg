import { PlaywrightTestConfig } from '@playwright/test'

const isGUI = process.env.E2E_GUI === '1'

const config: PlaywrightTestConfig = {
  use: {
    headless: !isGUI,
    viewport: { width: 800, height: 600 },
    ignoreHTTPSErrors: true,
    channel: 'chrome',
    launchOptions: {
      slowMo: isGUI ? 500 : 50,
    },
  },
  testDir: './spec_e2e',
  globalSetup: './spec_e2e/global_setup.ts',
  globalTeardown: './spec_e2e/global_teardown.ts',
}

export default config
