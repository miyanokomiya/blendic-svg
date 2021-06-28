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

import { GraphNodeMakePathH, GRAPH_VALUE_TYPE } from '/@/models/graphNode'
import { createBaseNode, NodeStruct } from '/@/utils/graphNodes/core'

export const struct: NodeStruct<GraphNodeMakePathH> = {
  create(arg = {}) {
    return {
      ...createBaseNode({
        data: {},
        inputs: {
          d: { value: [] },
          relative: { value: false },
          x: { value: 0 },
        },
        ...arg,
      }),
      type: 'make_path_h',
    } as GraphNodeMakePathH
  },
  data: {},
  inputs: {
    d: { type: GRAPH_VALUE_TYPE.D, default: [] },
    relative: { type: GRAPH_VALUE_TYPE.BOOLEAN, default: false },
    x: { type: GRAPH_VALUE_TYPE.SCALER, default: 0 },
  },
  outputs: { d: GRAPH_VALUE_TYPE.D },
  computation(inputs): { d: string[] } {
    return {
      d: [...inputs.d, `${inputs.relative ? 'h' : 'H'}${inputs.x}`],
    }
  },
  width: 140,
  color: '#fff5ee',
  textColor: '#000',
  label: 'Make Path H',
}
