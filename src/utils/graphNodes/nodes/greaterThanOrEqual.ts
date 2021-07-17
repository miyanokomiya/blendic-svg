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

import { GraphNodeGreaterThanOrEqual } from '/@/models/graphNode'
import {
  createBaseNode,
  NodeStruct,
  UNIT_VALUE_TYPES,
} from '/@/utils/graphNodes/core'

export const struct: NodeStruct<GraphNodeGreaterThanOrEqual> = {
  create(arg = {}) {
    return {
      ...createBaseNode({
        inputs: { a: { value: 0 }, b: { value: 0 } },
        ...arg,
      }),
      type: 'greater_than_or_equal',
    } as GraphNodeGreaterThanOrEqual
  },
  data: {},
  inputs: {
    a: {
      type: UNIT_VALUE_TYPES.SCALER,
      default: 0,
    },
    b: {
      type: UNIT_VALUE_TYPES.SCALER,
      default: 0,
    },
  },
  outputs: {
    value: UNIT_VALUE_TYPES.BOOLEAN,
  },
  computation(inputs) {
    return { value: inputs.a >= inputs.b }
  },
  width: 100,
  color: '#b0c4de',
  textColor: '#000',
  label: 'a >= b',
}
