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

import { getTransform } from '/@/models'
import { isSameTransform, normalizeRad } from '/@/utils/geometry'

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

  describe('isSameTransform', () => {
    it('return true if two transforms are same', () => {
      const t = getTransform({
        translate: { x: 1, y: 2 },
        scale: { x: 10, y: 20 },
        origin: { x: 100, y: 200 },
        rotate: 45,
      })
      expect(isSameTransform(getTransform(t), getTransform(t))).toBe(true)
    })
    it('return false if different translate', () => {
      expect(
        isSameTransform(
          getTransform({ translate: { x: 1, y: 2 } }),
          getTransform({ translate: { x: 2, y: 2 } })
        )
      ).toBe(false)
    })
    it('return false if different scale', () => {
      expect(
        isSameTransform(
          getTransform({ scale: { x: 1, y: 2 } }),
          getTransform({ scale: { x: 2, y: 2 } })
        )
      ).toBe(false)
    })
    it('return false if different origin', () => {
      expect(
        isSameTransform(
          getTransform({ origin: { x: 1, y: 2 } }),
          getTransform({ origin: { x: 2, y: 2 } })
        )
      ).toBe(false)
    })
    it('return false if different rotate', () => {
      expect(
        isSameTransform(
          getTransform({ rotate: 10 }),
          getTransform({ rotate: 20 })
        )
      ).toBe(false)
    })
  })
})
