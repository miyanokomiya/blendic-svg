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

import { interpolateVector } from 'okageo'
import { GraphNodeLerpVector2, GRAPH_VALUE_TYPE } from '/@/models/graphNode'
import { clamp } from '/@/utils/geometry'
import { createBaseNode, NodeStruct } from '/@/utils/graphNodes/core'

export const struct: NodeStruct<GraphNodeLerpVector2> = {
  create(arg = {}) {
    return {
      ...createBaseNode({
        inputs: {
          a: { value: { x: 0, y: 0 } },
          b: { value: { x: 1, y: 1 } },
          alpha: { value: 0 },
        },
        ...arg,
      }),
      type: 'lerp_vector2',
    } as GraphNodeLerpVector2
  },
  data: {},
  inputs: {
    a: { type: GRAPH_VALUE_TYPE.VECTOR2, default: { x: 0, y: 0 } },
    b: { type: GRAPH_VALUE_TYPE.VECTOR2, default: { x: 1, y: 1 } },
    alpha: { type: GRAPH_VALUE_TYPE.SCALER, default: 0 },
  },
  outputs: {
    value: GRAPH_VALUE_TYPE.VECTOR2,
  },
  computation(inputs) {
    return {
      value: interpolateVector(inputs.a, inputs.b, clamp(0, 1, inputs.alpha)),
    }
  },
  width: 140,
  color: '#4169e1',
  textColor: '#fff',
  label: 'Lerp Vector2',
}
