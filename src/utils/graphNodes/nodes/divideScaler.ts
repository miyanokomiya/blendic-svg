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

import { GraphNodeDivideScaler, GRAPH_VALUE_TYPE } from '/@/models/graphNode'
import { createBaseNode, NodeStruct } from '/@/utils/graphNodes/core'

export const struct: NodeStruct<GraphNodeDivideScaler> = {
  create(arg = {}) {
    return {
      ...createBaseNode({
        inputs: { a: { value: 0 }, b: { value: 1 } },
        ...arg,
      }),
      type: 'divide_scaler',
    } as GraphNodeDivideScaler
  },
  data: {},
  inputs: {
    a: { type: GRAPH_VALUE_TYPE.SCALER, default: 0 },
    b: { type: GRAPH_VALUE_TYPE.SCALER, default: 1 },
  },
  outputs: {
    value: GRAPH_VALUE_TYPE.SCALER,
  },
  computation(inputs) {
    return { value: inputs.a / inputs.b }
  },
  width: 120,
  color: '#4169e1',
  textColor: '#fff',
}
