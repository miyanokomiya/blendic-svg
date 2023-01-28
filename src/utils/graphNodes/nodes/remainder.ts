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

Copyright (C) 2023, Tomoya Komiyama.
*/

import { GraphNodeRemainder } from '/@/models/graphNode'
import {
  createBaseNode,
  NodeStruct,
  UNIT_VALUE_TYPES,
} from '/@/utils/graphNodes/core'

export const struct: NodeStruct<GraphNodeRemainder> = {
  create(arg = {}) {
    return createBaseNode({
      inputs: { a: { value: 0 }, b: { value: 1 } },
      ...arg,
      type: 'remainder',
    }) as GraphNodeRemainder
  },
  data: {},
  inputs: {
    a: {
      type: UNIT_VALUE_TYPES.SCALER,
      default: 0,
    },
    b: {
      type: UNIT_VALUE_TYPES.SCALER,
      default: 1,
    },
  },
  outputs: {
    value: UNIT_VALUE_TYPES.SCALER,
  },
  computation(inputs) {
    // Avoid division by zero
    return { value: inputs.a % (inputs.b === 0 ? 1 : inputs.b) }
  },
  width: 100,
  color: '#4169e1',
  textColor: '#fff',
  label: 'a % b',
}
