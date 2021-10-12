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

import { GraphNodeCreateObjectPath } from '/@/models/graphNode'
import {
  createBaseNode,
  NodeStruct,
  nodeToCreateObjectProps,
  UNIT_VALUE_TYPES,
} from '/@/utils/graphNodes/core'

export const struct: NodeStruct<GraphNodeCreateObjectPath> = {
  create(arg = {}) {
    return {
      ...createBaseNode({
        data: {},
        inputs: {
          ...nodeToCreateObjectProps.createdInputs,
          d: { value: [] },
        },
        ...arg,
      }),
      type: 'create_object_path',
    } as GraphNodeCreateObjectPath
  },
  data: {},
  inputs: {
    ...nodeToCreateObjectProps.inputs,
    d: {
      type: UNIT_VALUE_TYPES.D,
      default: [],
    },
  },
  outputs: nodeToCreateObjectProps.outputs,
  computation(inputs, self, context): { object: string } {
    const base = nodeToCreateObjectProps.computation(inputs, self)
    if (!base) return { object: '' }

    return {
      object: context.createObject('path', {
        ...base,
        attributes: {
          d: inputs.d,
        },
      }),
    }
  },
  width: 140,
  color: '#dc143c',
  textColor: '#fff',
  label: 'Create Path',
}