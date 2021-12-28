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

import { GraphNodeReroute } from '/@/models/graphNode'
import {
  createBaseNode,
  NodeStruct,
  pickNotGenericsType,
  UNIT_VALUE_TYPES,
} from '/@/utils/graphNodes/core'

export const struct: NodeStruct<GraphNodeReroute> = {
  create(arg = {}) {
    return {
      ...createBaseNode({
        inputs: { value: { value: undefined } },
        ...arg,
      }),
      type: 'reroute',
    } as GraphNodeReroute
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
  computation(inputs) {
    return { value: inputs.value }
  },
  width: 18,
  getOutputType(self) {
    return (
      pickNotGenericsType([self.inputs.value.genericsType]) ??
      UNIT_VALUE_TYPES.GENERICS
    )
  },
  genericsChains: [[{ key: 'value' }, { key: 'value', output: true }]],
}
