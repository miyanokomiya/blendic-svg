import { Page } from '@playwright/test'

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

export async function initPage(page: Page) {
  await page.goto('localhost:3333')
}

export async function moveAndClick(page: Page, x: number, y: number) {
  await page.mouse.move(x, y, { steps: 3 })
  await page.mouse.click(x, y)
}
