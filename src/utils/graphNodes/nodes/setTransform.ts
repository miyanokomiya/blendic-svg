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
import { GraphNodeSetTransform, GRAPH_VALUE_TYPE } from '/@/models/graphNode'
import { createBaseNode, NodeStruct } from '/@/utils/graphNodes/core'

export const struct: NodeStruct<GraphNodeSetTransform> = {
  create(arg = {}) {
    return {
      ...createBaseNode({
        inputs: { object: { value: '' }, transform: { value: getTransform() } },
        ...arg,
      }),
      type: 'set_transform',
    } as GraphNodeSetTransform
  },
  data: {},
  inputs: {
    object: { type: GRAPH_VALUE_TYPE.OBJECT, default: '' },
    transform: { type: GRAPH_VALUE_TYPE.TRANSFORM, default: getTransform() },
  },
  outputs: {
    object: GRAPH_VALUE_TYPE.OBJECT,
  },
  computation(inputs, _self, context): { object: string } {
    context.setTransform(inputs.object, inputs.transform)
    return {
      object: inputs.object,
    }
  },
  width: 140,
  color: '#dc143c',
  textColor: '#fff',
  label: 'Set Transform',
}
