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

import * as target from '/@/utils/graphNodes/nodes/transformPath'
import { getTransform } from '/@/models'

describe('src/utils/graphNodes/nodes/transformPath.ts', () => {
  describe('computation', () => {
    it('should return transformed path', () => {
      expect(
        target.struct.computation(
          {
            d: ['M10,10', 'L20,10'],
            transform: getTransform({
              translate: { x: 2, y: 3 },
              rotate: 90,
              origin: { x: 10, y: 10 },
            }),
          },
          {} as any,
          {} as any
        )
      ).toEqual({
        d: ['M 12 13', 'L 12 23'],
      })

      expect(
        target.struct.computation(
          {
            d: ['M10,10', 'L20,10'],
            transform: getTransform({
              scale: { x: -1, y: -2 },
              origin: { x: 10, y: 0 },
            }),
          },
          {} as any,
          {} as any
        )
      ).toEqual({
        d: ['M 10 -20', 'L 0 -20'],
      })
    })
  })
})
