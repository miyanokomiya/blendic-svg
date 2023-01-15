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

Copyright (C) 2023, Tomoya Komiyama.
*/

import * as target from '/@/utils/graphNodes/nodes/getPathPointAt'

describe('src/utils/graphNodes/nodes/getPathPointAt.ts', () => {
  describe('computation', () => {
    it('should return a created object', () => {
      const getPathPointAt = jest.fn().mockReturnValue({ x: 1, y: 2 })
      expect(
        target.struct.computation(
          {
            d: ['M0,0 L3,0'],
            distance: 2,
          },
          {} as any,
          { getPathPointAt } as any
        )
      ).toEqual({
        vector2: { x: 1, y: 2 },
      })
      expect(getPathPointAt).toHaveBeenCalledWith('M0,0 L3,0', 2)
    })
  })
})
