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

import * as target from '/@/utils/graphNodes/nodes/lerpScaler'

describe('src/utils/graphNodes/nodes/lerpScaler.ts', () => {
  describe('computation', () => {
    it('should return result of lerp from a to b by alpha', () => {
      expect(
        target.struct.computation(
          { a: 1, b: 11, alpha: 0.3 },
          {} as any,
          {} as any
        )
      ).toEqual({ value: 4 })
    })
    it('should clamp alpha between from 0 to 1', () => {
      expect(
        target.struct.computation(
          { a: 1, b: 11, alpha: -1 },
          {} as any,
          {} as any
        )
      ).toEqual({ value: 1 })
      expect(
        target.struct.computation(
          { a: 1, b: 11, alpha: 2 },
          {} as any,
          {} as any
        )
      ).toEqual({ value: 11 })
    })
  })
})
