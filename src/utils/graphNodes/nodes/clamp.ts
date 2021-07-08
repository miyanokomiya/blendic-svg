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

import { GraphNodeClamp, GRAPH_VALUE_TYPE } from '/@/models/graphNode'
import { circleClamp, clamp } from '/@/utils/geometry'
import { createBaseNode, NodeStruct } from '/@/utils/graphNodes/core'

export const struct: NodeStruct<GraphNodeClamp> = {
  create(arg = {}) {
    return {
      ...createBaseNode({
        inputs: {
          number: { value: 0 },
          from: { value: 0 },
          to: { value: 1 },
          loop: { value: false },
        },
        ...arg,
      }),
      type: 'clamp',
    } as GraphNodeClamp
  },
  data: {},
  inputs: {
    number: { type: GRAPH_VALUE_TYPE.SCALER, default: 0 },
    from: { type: GRAPH_VALUE_TYPE.SCALER, default: 0 },
    to: { type: GRAPH_VALUE_TYPE.SCALER, default: 1 },
    loop: { type: GRAPH_VALUE_TYPE.BOOLEAN, default: false },
  },
  outputs: {
    value: GRAPH_VALUE_TYPE.SCALER,
  },
  computation(inputs) {
    return {
      value: inputs.loop
        ? circleClamp(inputs.from, inputs.to, inputs.number)
        : clamp(inputs.from, inputs.to, inputs.number),
    }
  },
  width: 140,
  color: '#4169e1',
  textColor: '#fff',
  label: 'Clamp',
}
