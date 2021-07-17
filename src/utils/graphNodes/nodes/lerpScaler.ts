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

import { interpolateScaler } from 'okageo'
import {
  GraphNodeLerpScaler,
  GRAPH_VALUE_STRUCT,
  GRAPH_VALUE_TYPE,
} from '/@/models/graphNode'
import { clamp } from '/@/utils/geometry'
import {
  createBaseNode,
  NodeStruct,
  UNIT_VALUE_TYPES,
} from '/@/utils/graphNodes/core'

export const struct: NodeStruct<GraphNodeLerpScaler> = {
  create(arg = {}) {
    return {
      ...createBaseNode({
        inputs: { a: { value: 0 }, b: { value: 1 }, alpha: { value: 0 } },
        ...arg,
      }),
      type: 'lerp_scaler',
    } as GraphNodeLerpScaler
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
    alpha: {
      type: {
        type: GRAPH_VALUE_TYPE.SCALER,
        struct: GRAPH_VALUE_STRUCT.UNIT,
        scale: 0.1,
      },
      default: 0,
    },
  },
  outputs: {
    value: UNIT_VALUE_TYPES.SCALER,
  },
  computation(inputs) {
    return {
      value: interpolateScaler(inputs.a, inputs.b, clamp(0, 1, inputs.alpha)),
    }
  },
  width: 140,
  color: '#4169e1',
  textColor: '#fff',
  label: 'Lerp Number',
}
