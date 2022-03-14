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
      const getBoneSummary = jest.fn().mockReturnValue({
        transform: getTransform({ rotate: 10 }),
        height: 8,
      })
      expect(
        target.struct.computation({}, node, { getBoneSummary } as any)
      ).toEqual({ transform: getTransform({ rotate: 10 }), height: 8 })
    })
    it('should return mock value when the bone does not exist', () => {
      const getBoneSummary = jest.fn().mockReturnValue(undefined)
      expect(
        target.struct.computation({}, node, { getBoneSummary } as any)
      ).toEqual({ transform: getTransform(), height: 0 })
    })
  })
})
