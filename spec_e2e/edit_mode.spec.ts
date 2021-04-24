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
import { initBrowser, initPage, useScreenshot } from './utils'

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

describe('edit bones', () => {
  it('select -> extrude -> scale -> rotate -> delete', async () => {
    const screenshot = useScreenshot(page, 'edit_bone')

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
