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

import type { GraphNodeGetObject } from '/@/models/graphNode'
import * as target from '/@/utils/graphNodes/nodes/getObject'

describe('src/utils/graphNodes/nodes/getObject.ts', () => {
  const node: GraphNodeGetObject = {
    id: 'node',
    type: 'get_object',
    data: { object: 'a' },
    inputs: {},
    position: { x: 0, y: 0 },
  }

  describe('computation', () => {
    it('should return object id of data', () => {
      expect(target.struct.computation({}, node, {} as any)).toEqual({
        object: 'a',
      })
    })
  })
})
