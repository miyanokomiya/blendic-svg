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

import { test, expect } from '@playwright/test'
import { initPage, useScreenshot } from './utils'

test.describe('top', () => {
  test('initial', async ({ page }) => {
    const screenshot = useScreenshot(page, 'top')
    await initPage(page)
    const content = await page.textContent('h3')
    expect(content).toBe('Project')

    await screenshot('top')
  })
})
