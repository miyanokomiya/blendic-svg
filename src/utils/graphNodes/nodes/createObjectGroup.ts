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
import {
  GraphNodeCreateObjectGroup,
  GRAPH_VALUE_TYPE,
} from '/@/models/graphNode'
import {
  createBaseNode,
  NodeStruct,
  nodeToCreateObjectProps,
} from '/@/utils/graphNodes/core'

export const struct: NodeStruct<GraphNodeCreateObjectGroup> = {
  create(arg = {}) {
    return {
      ...createBaseNode({
        data: {},
        inputs: {
          disabled: { value: false },
          parent: { value: '' },
          transform: { value: getTransform() },
        },
        ...arg,
      }),
      type: 'create_object_group',
    } as GraphNodeCreateObjectGroup
  },
  data: {},
  inputs: {
    disabled: { type: GRAPH_VALUE_TYPE.BOOLEAN, default: false },
    parent: { type: GRAPH_VALUE_TYPE.OBJECT, default: '' },
    transform: { type: GRAPH_VALUE_TYPE.TRANSFORM, default: getTransform() },
  },
  outputs: nodeToCreateObjectProps.outputs,
  computation(inputs, _self, context): { object: string } {
    if (inputs.disabled) return { object: '' }

    return {
      object: context.createObject('g', {
        parent: inputs.parent,
        transform: inputs.transform,
        attributes: {},
      }),
    }
  },
  width: 140,
  color: '#dc143c',
  textColor: '#fff',
  label: 'Create Group',
}
