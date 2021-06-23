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

import { GraphNodeGetObject, GRAPH_VALUE_TYPE } from '/@/models/graphNode'
import { createBaseNode, NodeStruct } from '/@/utils/graphNodes/core'

export const struct: NodeStruct<GraphNodeGetObject> = {
  create(arg = {}) {
    return {
      ...createBaseNode({
        data: { object: '' },
        inputs: {},
        ...arg,
      }),
      type: 'get_object',
    } as GraphNodeGetObject
  },
  data: { object: { type: GRAPH_VALUE_TYPE.OBJECT } },
  inputs: {},
  outputs: {
    object: GRAPH_VALUE_TYPE.OBJECT,
  },
  computation(_inputs, self, _context): { object: string } {
    return {
      object: self.data.object,
    }
  },
  width: 120,
  color: '#dc143c',
  textColor: '#fff',
}
