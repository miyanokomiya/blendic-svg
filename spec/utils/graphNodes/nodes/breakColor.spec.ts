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
import * as target from '/@/utils/graphNodes/nodes/breakColor'

describe('src/utils/graphNodes/nodes/breakColor.ts', () => {
  describe('computation', () => {
    it('should break a color as hsva', () => {
      expect(
        target.struct.computation(
          {
            color: getTransform({
              translate: { x: 20, y: 30 },
              rotate: 1,
              scale: { x: 0.1, y: 1 },
            }),
          },
          {} as any,
          {} as any
        )
      ).toEqual({ h: 1, s: 0.2, v: 0.3, a: 0.1 })
    })
  })
})
