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

import { GraphNodeSetStrokeLength } from '/@/models/graphNode'
import {
  createBaseNode,
  NodeStruct,
  UNIT_VALUE_TYPES,
} from '/@/utils/graphNodes/core'

export const struct: NodeStruct<GraphNodeSetStrokeLength> = {
  create(arg = {}) {
    return {
      ...createBaseNode({
        inputs: {
          object: { value: '' },
          length: { value: 0 },
          max_length: { value: 100 },
        },
        ...arg,
      }),
      type: 'set_stroke_length',
    } as GraphNodeSetStrokeLength
  },
  data: {},
  inputs: {
    object: { type: UNIT_VALUE_TYPES.OBJECT, default: '' },
    length: { type: UNIT_VALUE_TYPES.SCALER, default: 0 },
    max_length: { type: UNIT_VALUE_TYPES.SCALER, default: 0 },
  },
  outputs: {
    object: UNIT_VALUE_TYPES.OBJECT,
  },
  computation(inputs, _self, context): { object: string } {
    if (!inputs.object) return { object: '' }

    context.setAttributes(inputs.object, {
      'stroke-dasharray': inputs.max_length.toString(),
      'stroke-dashoffset': inputs.max_length - inputs.length,
    })
    return {
      object: inputs.object,
    }
  },
  width: 160,
  color: '#dc143c',
  textColor: '#fff',
  label: 'Set Stroke Length',
}
