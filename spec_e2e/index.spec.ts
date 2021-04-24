// import puppeteer from 'puppeteer'
import { chromium, Browser, Page } from 'playwright-chromium'

let browser: Browser
let page: Page

beforeAll(async () => {
  browser = await chromium.launch()
})
afterAll(() => {
  browser.close()
})
beforeEach(async () => {
  page = await browser.newPage()
  await page.goto('localhost:3333')
})
afterEach(() => {
  page.close()
})

async function screenshot(name: string) {
  await page.screenshot({ path: `./__screenshot__/${name}.png` })
}

describe('top', () => {
  it('initial', async () => {
    const content = await page.textContent('h3')
    expect(content).toBe('Project')

    await screenshot('top')
  })
})

describe('edit bones', () => {
  it('select -> extrude -> scale -> rotate -> delete', async () => {
    // Select the Armature
    await page.click(
      'text=bonebone Object Edit Pose Weight a: SelectA: Add >> :nth-match(path, 2)'
    )
    await screenshot('select_armature')

    // Move to edit mode
    await page.click('text=Edit')

    // Select bone's tail
    await page.click(':nth-match(circle, 2)')
    await screenshot('select_bone_tail')

    // Extlude
    await page.press('.app-canvas-root', 'e')
    await page.mouse.click(200, 100)
    await screenshot('extlude_bone')

    // Select a bone
    // await page.click('svg:has-text("bonebone")')
    // await page.click('g:has-text("bone.001")')
    await page.click('g[title="bone.001"] >> path')
    await screenshot('select_bone_body')

    // Scale
    await page.press('.app-canvas-root', 's')
    await page.mouse.click(200, 0)
    await screenshot('scale_bone')
    await page.press('.app-canvas-root', 'Control+z')

    // Rotate
    await page.press('.app-canvas-root', 'r')
    await page.mouse.click(0, 100)
    await screenshot('rotate_bone')
    await page.press('.app-canvas-root', 'Control+z')

    // Delete
    await page.press('.app-canvas-root', 'x')
    await screenshot('delete_bone')
  })
})
