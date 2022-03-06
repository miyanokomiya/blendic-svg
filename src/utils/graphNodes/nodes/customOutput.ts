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

import { GraphNodeCustomOutput } from '/@/models/graphNode'
import {
  createBaseNode,
  NodeStruct,
  UNIT_VALUE_TYPES,
} from '/@/utils/graphNodes/core'

export const struct: NodeStruct<GraphNodeCustomOutput> = {
  create(arg = {}) {
    return {
      ...createBaseNode({
        data: {
          name: 'output',
        },
        inputs: { output: { value: '' }, value: { value: undefined } },
        ...arg,
      }),
      type: 'custom_output',
    } as GraphNodeCustomOutput
  },
  data: {
    name: {
      type: UNIT_VALUE_TYPES.TEXT,
      default: 'output',
    },
  },
  inputs: {
    output: {
      type: UNIT_VALUE_TYPES.INPUT,
      default: '',
    },
    value: {
      type: UNIT_VALUE_TYPES.GENERICS,
      default: undefined,
    },
  },
  outputs: {
    output: UNIT_VALUE_TYPES.OUTPUT,
  },
  computation(input) {
    return { output: input.output }
  },
  width: 110,
  color: '#f0f8ff',
  textColor: '#000',
  label: 'Output',
  genericsChains: [[{ key: 'value' }]],
}
