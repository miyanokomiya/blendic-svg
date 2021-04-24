// import puppeteer from 'puppeteer'
import { chromium, Browser, Page } from 'playwright-chromium'

let browser: Browser
let page: Page

beforeAll(async () => {
  browser = await chromium.launch(
    process.env.E2E_GUI ? { slowMo: 500, headless: false } : {}
  )
})
afterAll(() => {
  browser.close()
})
beforeEach(async () => {
  page = await browser.newPage()
  await page.setViewportSize({
    width: 800,
    height: 600,
  })
  await page.goto('localhost:3333')
})
afterEach(() => {
  page.close()
})

function useScreenshot(prefix: string) {
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

describe('top', () => {
  it('initial', async () => {
    const screenshot = useScreenshot('top')
    const content = await page.textContent('h3')
    expect(content).toBe('Project')

    await screenshot('top')
  })
})

describe('edit bones', () => {
  it('select -> extrude -> scale -> rotate -> delete', async () => {
    const screenshot = useScreenshot('edit_bone')

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
    await page.mouse.move(100, 100)
    await page.press('.app-canvas-root', 'e')
    await page.mouse.click(200, 150)
    await screenshot('extlude_bone')

    // Select a bone
    await page.click('g[title="bone.001"] >> path')
    await screenshot('select_bone_body')

    // Scale
    await page.mouse.move(100, 100)
    await page.press('.app-canvas-root', 's')
    await page.mouse.click(150, 150)
    await screenshot('scale_bone')
    await page.press('.app-canvas-root', 'Control+z')

    // Rotate
    await page.mouse.move(100, 100)
    await page.press('.app-canvas-root', 'r')
    await page.mouse.click(200, 300)
    await screenshot('rotate_bone')
    await page.press('.app-canvas-root', 'Control+z')

    // Delete
    await page.press('.app-canvas-root', 'x')
    await screenshot('delete_bone')
  })
})

describe('posing', () => {
  it('select -> insert keyframes -> pose -> insert keyframes -> interpolate', async () => {
    const screenshot = useScreenshot('posing')

    // Move to pose mode
    await page.hover('.app-canvas-root')
    await page.press('.app-canvas-root', 'a')
    await page.click('text=Pose')

    // Select
    await page.hover('.app-canvas-root')
    await page.press('.app-canvas-root', 'a')

    // Insert keyframe
    await page.press('.app-canvas-root', 'i')
    await screenshot('insert_menu')
    await page.click('text=All Transforms')
    await page.click('g.toggle-expanded')
    await screenshot('insert_keyframe_0')

    // change current frame
    await page.click('button[title="play"]')
    await page.waitForTimeout(200)
    await page.click('button[title="pause"]')
    await screenshot('change_frame_0')

    // Pose
    await page.mouse.move(100, 100)
    await page.press('.app-canvas-root', 'g')
    await page.mouse.click(400, 200)
    await page.press('.app-canvas-root', 'r')
    await page.mouse.click(200, 100)
    await screenshot('posing')

    // Insert keyframe
    await page.press('.app-canvas-root', 'i')
    await page.click('text=Location & Rotation')
    await screenshot('insert_keyframe_1')

    // change current frame
    await page.click('button[title="reverse"]')
    await page.waitForTimeout(50)
    await page.click('button[title="pause"]')
    await screenshot('change_frame_1')
  })
})
