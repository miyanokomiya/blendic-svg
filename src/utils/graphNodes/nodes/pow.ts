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

import { GraphNodePow } from '/@/models/graphNode'
import {
  createBaseNode,
  NodeStruct,
  UNIT_VALUE_TYPES,
} from '/@/utils/graphNodes/core'

export const struct: NodeStruct<GraphNodePow> = {
  create(arg = {}) {
    return {
      ...createBaseNode({
        inputs: { x: { value: 0 }, t: { value: 2 } },
        ...arg,
      }),
      type: 'pow',
    } as GraphNodePow
  },
  data: {},
  inputs: {
    x: { type: UNIT_VALUE_TYPES.SCALER, default: 0 },
    t: { type: UNIT_VALUE_TYPES.SCALER, default: 2 },
  },
  outputs: {
    value: UNIT_VALUE_TYPES.SCALER,
  },
  computation(inputs) {
    return { value: Math.pow(inputs.x, inputs.t) }
  },
  width: 100,
  color: '#4169e1',
  textColor: '#fff',
  label: 'x ^ t',
}
