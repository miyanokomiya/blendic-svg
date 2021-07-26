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

import { getTransform } from '/@/models'
import { GraphNodeAddTransform } from '/@/models/graphNode'
import { addPoseTransform } from '/@/utils/armatures'
import {
  createBaseNode,
  NodeStruct,
  UNIT_VALUE_TYPES,
} from '/@/utils/graphNodes/core'

export const struct: NodeStruct<GraphNodeAddTransform> = {
  create(arg = {}) {
    return {
      ...createBaseNode({
        inputs: {
          object: { value: '' },
          transform: { value: getTransform({ scale: { x: 0, y: 0 } }) },
        },
        ...arg,
      }),
      type: 'add_transform',
    } as GraphNodeAddTransform
  },
  data: {},
  inputs: {
    object: { type: UNIT_VALUE_TYPES.OBJECT, default: '' },
    transform: { type: UNIT_VALUE_TYPES.TRANSFORM, default: getTransform() },
  },
  outputs: {
    object: UNIT_VALUE_TYPES.OBJECT,
  },
  computation(inputs, _self, context): { object: string } {
    const current = context.getTransform(inputs.object)
    context.setTransform(
      inputs.object,
      current ? addPoseTransform(current, inputs.transform) : inputs.transform
    )
    return {
      object: inputs.object,
    }
  },
  width: 140,
  color: '#dc143c',
  textColor: '#fff',
  label: 'Add Transform',
}
