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

import { GraphNodeCircleCloneObject } from '/@/models/graphNode'
import { getCircleTransformFn } from '/@/utils/geometry'
import {
  cloneListFn,
  createBaseNode,
  NodeStruct,
  UNIT_VALUE_TYPES,
} from '/@/utils/graphNodes/core'

export const struct: NodeStruct<GraphNodeCircleCloneObject> = {
  create(arg = {}) {
    return {
      ...createBaseNode({
        inputs: {
          object: { value: '' },
          rotate: { value: 0 },
          count: { value: 4 },
          radius: { value: 100 },
          fix_rotate: { value: false },
        },
        ...arg,
      }),
      type: 'circle_clone_object',
    } as GraphNodeCircleCloneObject
  },
  data: {},
  inputs: {
    object: {
      type: UNIT_VALUE_TYPES.OBJECT,
      default: '',
    },
    rotate: {
      type: UNIT_VALUE_TYPES.SCALER,
      default: 0,
    },
    count: {
      type: UNIT_VALUE_TYPES.SCALER,
      default: 4,
    },
    radius: {
      type: UNIT_VALUE_TYPES.SCALER,
      default: 100,
    },
    fix_rotate: {
      type: UNIT_VALUE_TYPES.BOOLEAN,
      default: false,
    },
  },
  outputs: {
    origin: UNIT_VALUE_TYPES.OBJECT,
    group: UNIT_VALUE_TYPES.OBJECT,
  },
  computation(inputs, self, context): { origin: string; group: string } {
    if (!inputs.object) return { origin: '', group: '' }
    const count = Math.floor(inputs.count)
    if (count <= 0) return { origin: inputs.object, group: '' }

    const group = context.createCloneGroupObject(inputs.object, { id: self.id })
    const generateFn = getCircleTransformFn(count, inputs.radius, inputs.rotate)
    const cloneFn = cloneListFn(
      context,
      inputs.object,
      group,
      inputs.fix_rotate
    )
    cloneFn([...Array(count)].map((_, i) => generateFn(i)))

    return { origin: inputs.object, group }
  },
  width: 180,
  color: '#dc143c',
  textColor: '#fff',
  label: 'Circle Clone Object',
}
