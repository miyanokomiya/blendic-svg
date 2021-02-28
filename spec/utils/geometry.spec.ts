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

import { normalizeRad } from '/@/utils/geometry'

describe('src/utils/geometry.ts', () => {
  describe('normalizeRad', () => {
    it.each([
      [0, 0],
      [Math.PI, Math.PI],
      [Math.PI / 2, Math.PI / 2],
      [Math.PI * 1.5, -Math.PI * 0.5],
      [-Math.PI * 1.5, Math.PI * 0.5],
    ])('normalizeRad(%s) => %s', (a, expected) => {
      expect(normalizeRad(a)).toBeCloseTo(expected)
    })
  })
})
