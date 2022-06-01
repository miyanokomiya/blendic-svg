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
import type { GraphNodeSetFill } from '/@/models/graphNode'
import * as target from '/@/utils/graphNodes/nodes/setFill'

describe('src/utils/graphNodes/nodes/setFill.ts', () => {
  const node: GraphNodeSetFill = {
    id: 'node',
    type: 'set_fill',
    data: {},
    inputs: {
      object: { value: 'a' },
      color: { value: getTransform() },
    },
    position: { x: 0, y: 0 },
  }

  describe('computation', () => {
    it('should call setFill of the context and return the object', () => {
      const setFill = jest.fn()
      expect(
        target.struct.computation(
          {
            object: 'a',
            color: getTransform({ rotate: 1 }),
          },
          node,
          { setFill } as any
        )
      ).toEqual({ object: 'a' })
      expect(setFill).toHaveBeenCalledWith('a', getTransform({ rotate: 1 }))
    })
  })
})
