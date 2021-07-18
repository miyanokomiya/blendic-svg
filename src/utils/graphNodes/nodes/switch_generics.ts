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

import { GraphNodeSwitchGenerics } from '/@/models/graphNode'
import {
  createBaseNode,
  NodeStruct,
  pickNotGenericsType,
  UNIT_VALUE_TYPES,
} from '/@/utils/graphNodes/core'

export const struct: NodeStruct<GraphNodeSwitchGenerics> = {
  create(arg = {}) {
    return {
      ...createBaseNode({
        inputs: {
          condition: { value: true },
          if_true: { value: undefined },
          if_false: { value: undefined },
        },
        ...arg,
      }),
      type: 'switch_generics',
    } as GraphNodeSwitchGenerics
  },
  data: {},
  inputs: {
    condition: { type: UNIT_VALUE_TYPES.BOOLEAN, default: true },
    if_true: { type: UNIT_VALUE_TYPES.GENERICS, default: undefined },
    if_false: { type: UNIT_VALUE_TYPES.GENERICS, default: undefined },
  },
  outputs: {
    value: UNIT_VALUE_TYPES.GENERICS,
  },
  computation(inputs) {
    return { value: inputs.condition ? inputs.if_true : inputs.if_false }
  },
  width: 130,
  color: '#afeeee',
  textColor: '#000',
  label: 'Switch',
  getOutputType(self, key) {
    switch (key) {
      case 'value':
        return (
          pickNotGenericsType([
            self.inputs.if_true.genericsType,
            self.inputs.if_false.genericsType,
          ]) ?? UNIT_VALUE_TYPES.GENERICS
        )
      default:
        return UNIT_VALUE_TYPES.GENERICS
    }
  },
  getGenericsChainAt(self, key, output) {
    if (
      (output && key === 'value') ||
      key === 'if_true' ||
      key === 'if_false'
    ) {
      return [
        { id: self.id, key: 'if_true' },
        { id: self.id, key: 'if_false' },
        { id: self.id, key: 'value', output: true },
      ]
    }

    return []
  },
}
