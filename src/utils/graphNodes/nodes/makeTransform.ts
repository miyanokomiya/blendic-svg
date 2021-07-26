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

import { getTransform, Transform } from '/@/models'
import {
  GraphNodeMakeTransform,
  GRAPH_VALUE_STRUCT,
  GRAPH_VALUE_TYPE,
} from '/@/models/graphNode'
import {
  createBaseNode,
  NodeStruct,
  UNIT_VALUE_TYPES,
} from '/@/utils/graphNodes/core'

export const struct: NodeStruct<GraphNodeMakeTransform> = {
  create(arg = {}) {
    return {
      ...createBaseNode({
        inputs: {
          translate: { value: { x: 0, y: 0 } },
          rotate: { value: 0 },
          scale: { value: { x: 1, y: 1 } },
          origin: { value: { x: 0, y: 0 } },
        },
        ...arg,
      }),
      type: 'make_transform',
    } as GraphNodeMakeTransform
  },
  data: {},
  inputs: {
    translate: { type: UNIT_VALUE_TYPES.VECTOR2, default: { x: 0, y: 0 } },
    rotate: { type: UNIT_VALUE_TYPES.SCALER, default: 0 },
    scale: {
      type: {
        type: GRAPH_VALUE_TYPE.VECTOR2,
        struct: GRAPH_VALUE_STRUCT.UNIT,
        scale: 0.1,
      },
      default: { x: 1, y: 1 },
    },
    origin: { type: UNIT_VALUE_TYPES.VECTOR2, default: { x: 0, y: 0 } },
  },
  outputs: {
    transform: UNIT_VALUE_TYPES.TRANSFORM,
  },
  computation(inputs): { transform: Transform } {
    return {
      transform: getTransform({
        translate: inputs.translate,
        rotate: inputs.rotate,
        scale: inputs.scale,
        origin: inputs.origin,
      }),
    }
  },
  width: 160,
  color: '#f0e68c',
  label: 'Make Transform',
}
