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
import { GraphNodeSetFill } from '/@/models/graphNode'
import {
  createBaseNode,
  NodeStruct,
  UNIT_VALUE_TYPES,
} from '/@/utils/graphNodes/core'

export const struct: NodeStruct<GraphNodeSetFill> = {
  create(arg = {}) {
    return {
      ...createBaseNode({
        inputs: { object: { value: '' }, color: { value: getTransform() } },
        ...arg,
      }),
      type: 'set_fill',
    } as GraphNodeSetFill
  },
  data: {},
  inputs: {
    object: { type: UNIT_VALUE_TYPES.OBJECT, default: '' },
    color: { type: UNIT_VALUE_TYPES.COLOR, default: getTransform() },
  },
  outputs: {
    object: UNIT_VALUE_TYPES.OBJECT,
  },
  computation(inputs, _self, context): { object: string } {
    context.setFill(inputs.object, inputs.color)
    return {
      object: inputs.object,
    }
  },
  width: 120,
  color: '#dc143c',
  textColor: '#fff',
  label: 'Set Fill',
}
