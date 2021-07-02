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

import * as target from '/@/utils/graphNodes/nodes/polarCoord'

describe('src/utils/graphNodes/nodes/polarCoord.ts', () => {
  describe('computation', () => {
    it('should return polar coord of the input parameters', () => {
      const ret = target.struct.computation(
        {
          rotate: 90,
          radius: 2,
        },
        {} as any,
        {} as any
      ) as any

      expect(ret.vector2.x).toBeCloseTo(0)
      expect(ret.vector2.y).toBeCloseTo(2)
    })
  })
})
