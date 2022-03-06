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

Copyright (C) 2022, Tomoya Komiyama.
*/

import { GraphNodeCustomInput, GRAPH_VALUE_TYPE } from '/@/models/graphNode'
import {
  createBaseNode,
  NodeStruct,
  pickNotGenericsType,
  UNIT_VALUE_TYPES,
} from '/@/utils/graphNodes/core'

export const struct: NodeStruct<GraphNodeCustomInput> = {
  create(arg = {}) {
    return {
      ...createBaseNode({
        data: {
          name: 'input',
          default: { value: undefined },
        },
        inputs: { input: { value: undefined } },
        ...arg,
      }),
      type: 'custom_input',
    } as GraphNodeCustomInput
  },
  data: {
    name: {
      type: UNIT_VALUE_TYPES.TEXT,
      default: 'input',
    },
    default: {
      type: UNIT_VALUE_TYPES.GENERICS,
      default: undefined,
    },
  },
  inputs: {
    input: {
      type: UNIT_VALUE_TYPES.INPUT,
      default: '',
    },
  },
  outputs: {
    value: UNIT_VALUE_TYPES.GENERICS,
    input: UNIT_VALUE_TYPES.INPUT,
  },
  computation(input, self) {
    return { value: self.data.default.value, input: input.input }
  },
  width: 110,
  color: '#ff7f50',
  textColor: '#fff',
  label: 'Input',
  getOutputType(self, key) {
    switch (key) {
      case 'value':
        return (
          pickNotGenericsType([self.data.default.genericsType]) ??
          UNIT_VALUE_TYPES.GENERICS
        )
      case 'input':
        return UNIT_VALUE_TYPES.INPUT
      default:
        return UNIT_VALUE_TYPES.GENERICS
    }
  },
  genericsChains: [
    [
      { key: 'default', data: true },
      { key: 'value', output: true },
    ],
  ],
  getErrors(self) {
    const type = self.data.default.genericsType
    if (!type) return

    switch (type.type) {
      case GRAPH_VALUE_TYPE.INPUT:
      case GRAPH_VALUE_TYPE.OUTPUT:
        return ['invalid type to operate']
      default:
        return undefined
    }
  },
}
