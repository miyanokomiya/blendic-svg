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

Copyright (C) 2023, Tomoya Komiyama.
*/

import { GraphNodeJoinPath } from '/@/models/graphNode'
import {
  createBaseNode,
  NodeStruct,
  UNIT_VALUE_TYPES,
} from '/@/utils/graphNodes/core'

export const struct: NodeStruct<GraphNodeJoinPath> = {
  create(arg = {}) {
    return {
      ...createBaseNode({
        data: {},
        inputs: {
          a: { value: [] },
          b: { value: [] },
        },
        ...arg,
      }),
      type: 'join_path',
    } as GraphNodeJoinPath
  },
  data: {},
  inputs: {
    a: { type: UNIT_VALUE_TYPES.D, default: [] },
    b: { type: UNIT_VALUE_TYPES.D, default: [] },
  },
  outputs: { d: UNIT_VALUE_TYPES.D },
  computation(inputs): { d: string[] } {
    return {
      d: inputs.a.concat(inputs.b),
    }
  },
  width: 120,
  color: '#fff5ee',
  textColor: '#000',
  label: 'Join Path',
}
