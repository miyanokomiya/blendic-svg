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

Copyright (C) 2022, Tomoya Komiyama.
*/

import { getTransform } from '/@/models'
import type { GraphNodeGetBone } from '/@/models/graphNode'
import * as target from '/@/utils/graphNodes/nodes/getBone'

describe('src/utils/graphNodes/nodes/getBone.ts', () => {
  const node: GraphNodeGetBone = {
    id: 'node',
    type: 'get_bone',
    data: { bone: 'a' },
    inputs: {},
    position: { x: 0, y: 0 },
  }

  describe('computation', () => {
    it('should return bone properties', () => {
      const getBoneMap = jest.fn().mockReturnValue({
        a: { transform: getTransform({ rotate: 10 }) },
      })
      expect(
        target.struct.computation({}, node, { getBoneMap } as any)
      ).toEqual({
        transform: getTransform({ rotate: 10 }),
      })
    })
  })
})
