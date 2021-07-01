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

import * as target from '/@/utils/graphNodes/nodes/invertPolarCoord'

describe('src/utils/graphNodes/nodes/invertPolarCoord.ts', () => {
  describe('computation', () => {
    it('should return invert polar coord of the input parameters', () => {
      const ret = target.struct.computation(
        {
          vector2: { x: 0, y: 3 },
        },
        {} as any,
        {} as any
      ) as any

      expect(ret.rotate).toBeCloseTo(90)
      expect(ret.radius).toBeCloseTo(3)
    })
  })
})
