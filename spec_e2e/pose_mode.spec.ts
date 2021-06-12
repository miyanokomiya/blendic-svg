/*
This file is part of Blendic SVG.

Blendic SVG is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Blendic SVG is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with Blendic SVG.  If not, see <https://www.gnu.org/licenses/>.

Copyright (C) 2021, Tomoya Komiyama.
*/

import { Browser, Page } from 'playwright-chromium'
import { initBrowser, initPage, moveAndClick, useScreenshot } from './utils'

let browser: Browser
let page: Page

beforeAll(async () => {
  browser = await initBrowser()
})
beforeEach(async () => {
  page = await initPage(browser)
})
afterEach(() => {
  page!.close()
})
afterAll(() => {
  browser!.close()
})

describe('posing', () => {
  it('select -> insert keyframes -> pose -> insert keyframes -> interpolate', async () => {
    const screenshot = useScreenshot(page, 'posing')

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
    await moveAndClick(page, 400, 200)
    await page.press('.app-canvas-root', 'r')
    await moveAndClick(page, 200, 100)
    await screenshot('posing')

    // Insert keyframe
    await page.mouse.move(100, 100)
    await page.press('.app-canvas-root', 'i')
    await page.click('text=Location & Rotation')
    await screenshot('insert_keyframe_1')

    // change current frame
    await page.click('button[title="reverse"]')
    await page.waitForTimeout(50)
    await page.click('button[title="pause"]')
    await screenshot('change_frame_1')

    // Pose
    await page.mouse.move(100, 100)
    await page.press('.app-canvas-root', 'r')
    await moveAndClick(page, 200, 100)
    await screenshot('posing_2')

    // Insert keyframe in the item panel
    await page.click('button[data-test-id="key-dot-rotate"]')
    await screenshot('insert_keyframe_in_panel')

    // Delete keyframe in the item panel
    await page.click('button[data-test-id="key-dot-rotate"]')
    await screenshot('delete_keyframe_in_panel')
  })
})
