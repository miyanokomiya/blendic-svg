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

import { GraphNodeSetGradient } from '/@/models/graphNode'
import {
  createBaseNode,
  NodeStruct,
  UNIT_VALUE_TYPES,
} from '/@/utils/graphNodes/core'

export const struct: NodeStruct<GraphNodeSetGradient> = {
  create(arg = {}) {
    return {
      ...createBaseNode({
        inputs: {
          object: { value: '' },
          fill_gradient: { value: '' },
          stroke_gradient: { value: '' },
        },
        ...arg,
      }),
      type: 'set_gradient',
    } as GraphNodeSetGradient
  },
  data: {},
  inputs: {
    object: { type: UNIT_VALUE_TYPES.OBJECT, default: '' },
    fill_gradient: { type: UNIT_VALUE_TYPES.OBJECT, default: '' },
    stroke_gradient: { type: UNIT_VALUE_TYPES.OBJECT, default: '' },
  },
  outputs: {
    object: UNIT_VALUE_TYPES.OBJECT,
  },
  computation(inputs, _self, context): { object: string } {
    context.setFill(inputs.object, inputs.fill_gradient)
    context.setStroke(inputs.object, inputs.stroke_gradient)
    return {
      object: inputs.object,
    }
  },
  width: 140,
  color: '#dc143c',
  textColor: '#fff',
  label: 'Set Gradient',
}
