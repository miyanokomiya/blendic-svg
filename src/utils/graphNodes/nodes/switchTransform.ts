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
import { GraphNodeSwitchTransform } from '/@/models/graphNode'
import {
  createBaseNode,
  NodeStruct,
  UNIT_VALUE_TYPES,
} from '/@/utils/graphNodes/core'

export const struct: NodeStruct<GraphNodeSwitchTransform> = {
  create(arg = {}) {
    return {
      ...createBaseNode({
        inputs: {
          condition: { value: true },
          if_true: { value: getTransform() },
          if_false: { value: getTransform() },
        },
        ...arg,
      }),
      type: 'switch_transform',
    } as GraphNodeSwitchTransform
  },
  data: {},
  inputs: {
    condition: { type: UNIT_VALUE_TYPES.BOOLEAN, default: true },
    if_true: { type: UNIT_VALUE_TYPES.TRANSFORM, default: getTransform() },
    if_false: { type: UNIT_VALUE_TYPES.TRANSFORM, default: getTransform() },
  },
  outputs: {
    value: UNIT_VALUE_TYPES.TRANSFORM,
  },
  computation(inputs) {
    return { value: inputs.condition ? inputs.if_true : inputs.if_false }
  },
  width: 130,
  color: '#afeeee',
  textColor: '#000',
  label: 'Switch Transform',
}
