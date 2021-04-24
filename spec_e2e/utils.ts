import { chromium, Browser, Page } from 'playwright-chromium'

export function useScreenshot(page: Page, prefix: string) {
  let count = 0
  return async function screenshot(name: string) {
    count++
    await page.screenshot({
      path: `./__screenshot__/${prefix}/${count
        .toString()
        .padStart(3, '0')}.${name}.png`,
    })
  }
}

export async function initBrowser() {
  const browser = await chromium.launch(
    process.env.E2E_GUI ? { slowMo: 500, headless: false } : {}
  )
  return browser
}

export async function initPage(browser: Browser) {
  const page = await browser!.newPage()
  await page.setViewportSize({
    width: 800,
    height: 600,
  })
  await page.goto('localhost:3333')
  return page
}
