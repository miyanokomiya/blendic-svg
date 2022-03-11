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

Copyright (C) 2022, Tomoya Komiyama.
*/

import { getTransform } from '/@/models'
import { GraphNodeGroupCloneObject } from '/@/models/graphNode'
import {
  cloneListFn,
  createBaseNode,
  NodeStruct,
  UNIT_VALUE_TYPES,
} from '/@/utils/graphNodes/core'

export const struct: NodeStruct<GraphNodeGroupCloneObject> = {
  create(arg = {}) {
    return {
      ...createBaseNode({
        inputs: { object: { value: '' } },
        ...arg,
      }),
      type: 'group_clone_object',
    } as GraphNodeGroupCloneObject
  },
  data: {},
  inputs: {
    object: {
      type: UNIT_VALUE_TYPES.OBJECT,
      default: '',
    },
  },
  outputs: {
    origin: UNIT_VALUE_TYPES.OBJECT,
    group: UNIT_VALUE_TYPES.OBJECT,
    clone: UNIT_VALUE_TYPES.OBJECT,
  },
  computation(
    inputs,
    self,
    context
  ): { origin: string; group: string; clone: string } {
    const group = context.createCloneGroupObject(inputs.object, { id: self.id })
    const cloneFn = cloneListFn(context, inputs.object, group)
    const [clone] = cloneFn([0].map(() => getTransform()))
    return { origin: inputs.object, group, clone }
  },
  width: 180,
  color: '#dc143c',
  textColor: '#fff',
  label: 'Group Clone Object',
}
