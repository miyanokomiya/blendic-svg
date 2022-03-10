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

import { GraphNodeSetParent } from '/@/models/graphNode'
import {
  createBaseNode,
  NodeStruct,
  UNIT_VALUE_TYPES,
} from '/@/utils/graphNodes/core'

export const struct: NodeStruct<GraphNodeSetParent> = {
  create(arg = {}) {
    return {
      ...createBaseNode({
        inputs: {
          parent: { value: '' },
          object: { value: '' },
        },
        ...arg,
      }),
      type: 'set_parent',
    } as GraphNodeSetParent
  },
  data: {},
  inputs: {
    parent: { type: UNIT_VALUE_TYPES.OBJECT, default: '' },
    object: { type: UNIT_VALUE_TYPES.OBJECT, default: '' },
  },
  outputs: { parent: UNIT_VALUE_TYPES.OBJECT },
  computation(inputs, _self, context): {} {
    context.setParent(inputs.object, inputs.parent)
    return { parent: inputs.parent }
  },
  width: 140,
  color: '#dc143c',
  textColor: '#fff',
  label: 'Set Parent',
}
