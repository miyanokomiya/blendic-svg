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
import { GraphNodeHideObject } from '/@/models/graphNode'
import {
  createBaseNode,
  NodeStruct,
  UNIT_VALUE_TYPES,
} from '/@/utils/graphNodes/core'

export const struct: NodeStruct<GraphNodeHideObject> = {
  create(arg = {}) {
    return {
      ...createBaseNode({
        inputs: { disabled: { value: false }, object: { value: '' } },
        ...arg,
      }),
      type: 'hide_object',
    } as GraphNodeHideObject
  },
  data: {},
  inputs: {
    disabled: {
      type: UNIT_VALUE_TYPES.BOOLEAN,
      default: false,
    },
    object: {
      type: UNIT_VALUE_TYPES.OBJECT,
      default: '',
    },
  },
  outputs: {
    object: UNIT_VALUE_TYPES.OBJECT,
  },
  computation(inputs, _self, context): { object: string } {
    if (!inputs.disabled) {
      const color = getTransform({ scale: { x: 0, y: 1 } })
      context.setStroke(inputs.object, color)
      context.setFill(inputs.object, color)
    }
    return {
      object: inputs.object,
    }
  },
  width: 120,
  color: '#dc143c',
  textColor: '#fff',
  label: 'Hide Object',
}
