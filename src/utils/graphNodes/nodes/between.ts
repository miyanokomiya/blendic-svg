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

import { GraphNodeBetween } from '/@/models/graphNode'
import {
  createBaseNode,
  NodeStruct,
  UNIT_VALUE_TYPES,
} from '/@/utils/graphNodes/core'

export const struct: NodeStruct<GraphNodeBetween> = {
  create(arg = {}) {
    return {
      ...createBaseNode({
        inputs: {
          number: { value: 0 },
          from: { value: 0 },
          to: { value: 1 },
        },
        ...arg,
      }),
      type: 'between',
    } as GraphNodeBetween
  },
  data: {},
  inputs: {
    number: {
      type: UNIT_VALUE_TYPES.SCALER,
      default: 0,
    },
    from: {
      type: UNIT_VALUE_TYPES.SCALER,
      default: 0,
    },
    to: {
      type: UNIT_VALUE_TYPES.SCALER,
      default: 1,
    },
  },
  outputs: {
    value: UNIT_VALUE_TYPES.BOOLEAN,
  },
  computation(inputs) {
    return { value: inputs.from <= inputs.number && inputs.number <= inputs.to }
  },
  width: 120,
  color: '#b0c4de',
  textColor: '#000',
  label: 'Between',
}
