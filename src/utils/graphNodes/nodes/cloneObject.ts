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

import { GraphNodeCloneObject, GRAPH_VALUE_TYPE } from '/@/models/graphNode'
import { createBaseNode, NodeStruct } from '/@/utils/graphNodes/core'

export const struct: NodeStruct<GraphNodeCloneObject> = {
  create(arg = {}) {
    return {
      ...createBaseNode({
        inputs: { object: { value: '' } },
        ...arg,
      }),
      type: 'clone_object',
    } as GraphNodeCloneObject
  },
  data: {},
  inputs: {
    object: { type: GRAPH_VALUE_TYPE.OBJECT, default: '' },
  },
  outputs: {
    origin: GRAPH_VALUE_TYPE.OBJECT,
    clone: GRAPH_VALUE_TYPE.OBJECT,
  },
  computation(inputs, _self, context): { origin: string; clone: string } {
    const clone = context.cloneObject(inputs.object)
    return { origin: inputs.object, clone }
  },
  width: 140,
  color: '#dc143c',
  textColor: '#fff',
  label: 'Clone Object',
}