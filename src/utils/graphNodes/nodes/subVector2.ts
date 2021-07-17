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

import { sub } from 'okageo'
import { GraphNodeSubVector2 } from '/@/models/graphNode'
import {
  createBaseNode,
  NodeStruct,
  UNIT_VALUE_TYPES,
} from '/@/utils/graphNodes/core'

export const struct: NodeStruct<GraphNodeSubVector2> = {
  create(arg = {}) {
    return {
      ...createBaseNode({
        inputs: { a: { value: { x: 0, y: 0 } }, b: { value: { x: 0, y: 0 } } },
        ...arg,
      }),
      type: 'sub_vector2',
    } as GraphNodeSubVector2
  },
  data: {},
  inputs: {
    a: { type: UNIT_VALUE_TYPES.VECTOR2, default: { x: 0, y: 0 } },
    b: { type: UNIT_VALUE_TYPES.VECTOR2, default: { x: 0, y: 0 } },
  },
  outputs: {
    vector2: UNIT_VALUE_TYPES.VECTOR2,
  },
  computation(inputs) {
    return { vector2: sub(inputs.a, inputs.b) }
  },
  width: 140,
  color: '#4169e1',
  textColor: '#fff',
  label: 'a - b (vecotr2)',
}
