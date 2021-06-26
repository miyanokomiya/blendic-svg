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

import { getDistance } from 'okageo'
import { GraphNodeDistance, GRAPH_VALUE_TYPE } from '/@/models/graphNode'
import { createBaseNode, NodeStruct } from '/@/utils/graphNodes/core'

export const struct: NodeStruct<GraphNodeDistance> = {
  create(arg = {}) {
    return {
      ...createBaseNode({
        inputs: { a: { value: { x: 0, y: 0 } }, b: { value: { x: 0, y: 0 } } },
        ...arg,
      }),
      type: 'distance',
    } as GraphNodeDistance
  },
  data: {},
  inputs: {
    a: { type: GRAPH_VALUE_TYPE.VECTOR2, default: { x: 0, y: 0 } },
    b: { type: GRAPH_VALUE_TYPE.VECTOR2, default: { x: 0, y: 0 } },
  },
  outputs: {
    distance: GRAPH_VALUE_TYPE.SCALER,
  },
  computation(inputs) {
    return { distance: getDistance(inputs.a, inputs.b) }
  },
  width: 140,
  color: '#f0e68c',
  label: 'Distance',
}
