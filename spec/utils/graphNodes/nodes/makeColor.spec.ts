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
import * as target from '/@/utils/graphNodes/nodes/makeColor'

describe('src/utils/graphNodes/nodes/makeColor.ts', () => {
  describe('computation', () => {
    it('should return a color as transform', () => {
      expect(
        target.struct.computation(
          { h: 1, s: 2, v: 3, a: 0.1 },
          {} as any,
          {} as any
        )
      ).toEqual({
        color: getTransform({
          translate: { x: 200, y: 300 },
          rotate: 1,
          scale: { x: 0.1, y: 1 },
        }),
      })
    })
  })
})
