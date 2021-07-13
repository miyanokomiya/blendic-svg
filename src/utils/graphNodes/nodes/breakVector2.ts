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

import { GraphNodeBreakVector2 } from '/@/models/graphNode'
import {
  createBaseNode,
  NodeStruct,
  UNIT_VALUE_TYPES,
} from '/@/utils/graphNodes/core'

export const struct: NodeStruct<GraphNodeBreakVector2> = {
  create(arg = {}) {
    return {
      ...createBaseNode({
        inputs: { vector2: { value: { x: 0, y: 0 } } },
        ...arg,
      }),
      type: 'break_vector2',
    } as GraphNodeBreakVector2
  },
  data: {},
  inputs: {
    vector2: {
      type: UNIT_VALUE_TYPES.VECTOR2,
      default: { x: 0, y: 0 },
    },
  },
  outputs: {
    x: UNIT_VALUE_TYPES.SCALER,
    y: UNIT_VALUE_TYPES.SCALER,
  },
  computation(inputs) {
    return { x: inputs.vector2.x, y: inputs.vector2.y }
  },
  width: 140,
  color: '#f0e68c',
  label: 'Break Vector2',
}
