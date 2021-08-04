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

import { GraphNodeEachChildren } from '/@/models/graphNode'
import {
  createBaseNode,
  NodeStruct,
  UNIT_VALUE_TYPES,
} from '/@/utils/graphNodes/core'

export const struct: NodeStruct<GraphNodeEachChildren> = {
  create(arg = {}) {
    return {
      ...createBaseNode({
        inputs: {
          group: { value: '' },
        },
        ...arg,
      }),
      type: 'each_children',
    } as GraphNodeEachChildren
  },
  data: {},
  inputs: {
    group: {
      type: UNIT_VALUE_TYPES.OBJECT,
      default: '',
    },
  },
  outputs: {
    child: UNIT_VALUE_TYPES.OBJECT,
    index: UNIT_VALUE_TYPES.SCALER,
    size: UNIT_VALUE_TYPES.SCALER,
  },
  computation(
    inputs,
    _self,
    context
  ): { child: string; index: number; size: number } {
    if (!inputs.group) return { child: '', index: -1, size: 0 }

    const index = 0
    const size = context.getChildrenSize(inputs.group)
    const child = context.getChildId(inputs.group, index) ?? ''
    return { child, index, size }
  },
  width: 140,
  color: '#dc143c',
  textColor: '#fff',
  label: 'Each Children',
}
