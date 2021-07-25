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

import { GraphNodeGetChild } from '/@/models/graphNode'
import {
  createBaseNode,
  NodeStruct,
  UNIT_VALUE_TYPES,
} from '/@/utils/graphNodes/core'

export const struct: NodeStruct<GraphNodeGetChild> = {
  create(arg = {}) {
    return {
      ...createBaseNode({
        inputs: {
          object: { value: '' },
          index: { value: 0 },
        },
        ...arg,
      }),
      type: 'get_child',
    } as GraphNodeGetChild
  },
  data: {},
  inputs: {
    object: {
      type: UNIT_VALUE_TYPES.OBJECT,
      default: '',
    },
    index: {
      type: UNIT_VALUE_TYPES.SCALER,
      default: 0,
    },
  },
  outputs: {
    child: UNIT_VALUE_TYPES.OBJECT,
  },
  computation(inputs, _self, context): { child: string } {
    const index = Math.floor(inputs.index)

    if (!inputs.object) return { child: '' }

    const child = context.getChildId(inputs.object, index) ?? ''
    return { child }
  },
  width: 120,
  color: '#dc143c',
  textColor: '#fff',
  label: 'Get Child',
}
