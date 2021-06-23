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

import { GraphNodeNot, GRAPH_VALUE_TYPE } from '/@/models/graphNode'
import { createBaseNode, NodeStruct } from '/@/utils/graphNodes/core'

export const struct: NodeStruct<GraphNodeNot> = {
  create(arg = {}) {
    return {
      ...createBaseNode({
        inputs: { condition: { value: true } },
        ...arg,
      }),
      type: 'not',
    } as GraphNodeNot
  },
  data: {},
  inputs: {
    condition: { type: GRAPH_VALUE_TYPE.BOOLEAN, default: true },
  },
  outputs: {
    value: GRAPH_VALUE_TYPE.BOOLEAN,
  },
  computation(inputs) {
    return { value: !inputs.condition }
  },
  width: 100,
  color: '#b0c4de',
  textColor: '#000',
  label: 'Not',
}
