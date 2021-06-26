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

import { rotate } from 'okageo'
import { GraphNodeRotateVector2, GRAPH_VALUE_TYPE } from '/@/models/graphNode'
import { createBaseNode, NodeStruct } from '/@/utils/graphNodes/core'

export const struct: NodeStruct<GraphNodeRotateVector2> = {
  create(arg = {}) {
    return {
      ...createBaseNode({
        inputs: {
          vector2: { value: { x: 0, y: 0 } },
          rotate: { value: 0 },
          origin: { value: { x: 0, y: 0 } },
        },
        ...arg,
      }),
      type: 'rotate_vector2',
    } as GraphNodeRotateVector2
  },
  data: {},
  inputs: {
    vector2: { type: GRAPH_VALUE_TYPE.VECTOR2, default: { x: 0, y: 0 } },
    rotate: { type: GRAPH_VALUE_TYPE.SCALER, default: 0 },
    origin: { type: GRAPH_VALUE_TYPE.VECTOR2, default: { x: 0, y: 0 } },
  },
  outputs: {
    vector2: GRAPH_VALUE_TYPE.VECTOR2,
  },
  computation(inputs) {
    return {
      vector2: rotate(
        inputs.vector2,
        (inputs.rotate * Math.PI) / 180,
        inputs.origin
      ),
    }
  },
  width: 140,
  color: '#f0e68c',
  label: 'Rotate Vector2',
}
