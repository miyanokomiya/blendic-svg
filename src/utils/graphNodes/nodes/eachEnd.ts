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

import { GraphNodeEachEnd } from '/@/models/graphNode'
import {
  createBaseNode,
  NodeStruct,
  UNIT_VALUE_TYPES,
} from '/@/utils/graphNodes/core'

export const struct: NodeStruct<GraphNodeEachEnd> = {
  create(arg = {}) {
    return {
      ...createBaseNode({
        inputs: {
          value: { value: undefined },
        },
        ...arg,
      }),
      type: 'each_end',
    } as GraphNodeEachEnd
  },
  data: {},
  inputs: {
    value: {
      type: UNIT_VALUE_TYPES.GENERICS,
      default: undefined,
    },
  },
  outputs: {
    value: UNIT_VALUE_TYPES.GENERICS,
  },
  computation(inputs): { value: unknown } {
    return { value: inputs.value }
  },
  width: 140,
  color: '#dc143c',
  textColor: '#fff',
  label: 'Each End',
  getOutputType(self, key) {
    switch (key) {
      case 'value':
        return self.inputs.value.genericsType ?? UNIT_VALUE_TYPES.GENERICS
      default:
        return UNIT_VALUE_TYPES.GENERICS
    }
  },
  genericsChains: [[{ key: 'value' }, { key: 'value', output: true }]],
}
