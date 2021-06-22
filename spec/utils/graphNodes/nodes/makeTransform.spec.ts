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
import * as target from '/@/utils/graphNodes/nodes/makeTransform'

describe('src/utils/graphNodes/nodes/makeTransform.ts', () => {
  describe('computation', () => {
    it('should return a transform', () => {
      expect(
        target.struct.computation(
          {
            translate: { x: 1, y: 2 },
            rotate: 3,
            scale: { x: 4, y: 5 },
            origin: { x: 10, y: 20 },
          },
          {} as any,
          {} as any
        )
      ).toEqual({
        transform: getTransform({
          translate: { x: 1, y: 2 },
          rotate: 3,
          scale: { x: 4, y: 5 },
          origin: { x: 10, y: 20 },
        }),
      })
    })
  })
})
