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
import { getTransform } from '/@/models'
import { GraphNodeApplyTransform } from '/@/models/graphNode'
import { applyTransform } from '/@/utils/geometry'
import {
  createBaseNode,
  NodeStruct,
  UNIT_VALUE_TYPES,
} from '/@/utils/graphNodes/core'

export const struct: NodeStruct<GraphNodeApplyTransform> = {
  create(arg = {}) {
    return {
      ...createBaseNode({
        inputs: {
          transform: { value: getTransform() },
          vector2: { value: { x: 0, y: 0 } },
        },
        ...arg,
      }),
      type: 'apply_transform',
    } as GraphNodeApplyTransform
  },
  data: {},
  inputs: {
    transform: { type: UNIT_VALUE_TYPES.TRANSFORM, default: getTransform() },
    vector2: { type: UNIT_VALUE_TYPES.VECTOR2, default: { x: 0, y: 0 } },
  },
  outputs: {
    vector2: UNIT_VALUE_TYPES.VECTOR2,
  },
  computation(inputs): {
    vector2: IVec2
  } {
    return {
      vector2: applyTransform(inputs.vector2, inputs.transform),
    }
  },
  width: 160,
  color: '#f0e68c',
  label: 'Apply Transform',
}
