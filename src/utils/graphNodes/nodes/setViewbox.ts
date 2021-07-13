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

import { GraphNodeSetViewbox } from '/@/models/graphNode'
import {
  createBaseNode,
  NodeStruct,
  UNIT_VALUE_TYPES,
} from '/@/utils/graphNodes/core'

export const struct: NodeStruct<GraphNodeSetViewbox> = {
  create(arg = {}) {
    return {
      ...createBaseNode({
        inputs: {
          object: { value: '' },
          centered: { value: false },
          x: { value: 0 },
          y: { value: 0 },
          width: { value: 400 },
          height: { value: 400 },
        },
        ...arg,
      }),
      type: 'set_viewbox',
    } as GraphNodeSetViewbox
  },
  data: {},
  inputs: {
    object: { type: UNIT_VALUE_TYPES.OBJECT, default: '' },
    centered: { type: UNIT_VALUE_TYPES.BOOLEAN, default: false },
    x: { type: UNIT_VALUE_TYPES.SCALER, default: 0 },
    y: { type: UNIT_VALUE_TYPES.SCALER, default: 0 },
    width: { type: UNIT_VALUE_TYPES.SCALER, default: 400 },
    height: { type: UNIT_VALUE_TYPES.SCALER, default: 400 },
  },
  outputs: { object: UNIT_VALUE_TYPES.OBJECT },
  computation(inputs, _self, context): {} {
    context.setAttributes(inputs.object, {
      viewBox: {
        x: inputs.centered ? inputs.x - inputs.width / 2 : inputs.x,
        y: inputs.centered ? inputs.y - inputs.height / 2 : inputs.y,
        width: inputs.width,
        height: inputs.height,
      },
    })
    return { object: inputs.object }
  },
  width: 140,
  color: '#dc143c',
  textColor: '#fff',
  label: 'Set Viewbox',
}
