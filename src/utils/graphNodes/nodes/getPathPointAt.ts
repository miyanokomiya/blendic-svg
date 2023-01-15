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

import { IVec2 } from 'okageo'
import { GraphNodeGetPathPointAt } from '/@/models/graphNode'
import {
  createBaseNode,
  NodeStruct,
  nodeToCreateObjectProps,
  UNIT_VALUE_TYPES,
} from '/@/utils/graphNodes/core'

export const struct: NodeStruct<GraphNodeGetPathPointAt> = {
  create(arg = {}) {
    return {
      ...createBaseNode({
        data: {},
        inputs: {
          d: { value: [] },
          distance: { value: 0 },
        },
        ...arg,
      }),
      type: 'get_path_point_at',
    } as GraphNodeGetPathPointAt
  },
  data: {},
  inputs: {
    ...nodeToCreateObjectProps.inputs,
    d: {
      type: UNIT_VALUE_TYPES.D,
      default: [],
    },
    distance: {
      type: UNIT_VALUE_TYPES.SCALER,
      default: 0,
    },
  },
  outputs: {
    vector2: UNIT_VALUE_TYPES.VECTOR2,
  },
  computation(inputs, _self, context): { vector2: IVec2 } {
    return {
      vector2: context.getPathPointAt(inputs.d.join(' '), inputs.distance),
    }
  },
  width: 140,
  color: '#dc143c',
  textColor: '#fff',
  label: 'Get Path Point At',
}
