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

import { Transform } from '/@/models'
import { GraphNodeMakeColor, GRAPH_VALUE_TYPE } from '/@/models/graphNode'
import { hsvaToTransform } from '/@/utils/color'
import { createBaseNode, NodeStruct } from '/@/utils/graphNodes/core'

export const struct: NodeStruct<GraphNodeMakeColor> = {
  create(arg = {}) {
    return {
      ...createBaseNode({
        inputs: {
          h: { value: 0 },
          s: { value: 0 },
          v: { value: 0 },
          a: { value: 1 },
        },
        ...arg,
      }),
      type: 'make_color',
    } as GraphNodeMakeColor
  },
  data: {},
  inputs: {
    h: { type: GRAPH_VALUE_TYPE.SCALER, default: 0 },
    s: { type: GRAPH_VALUE_TYPE.SCALER, default: 0 },
    v: { type: GRAPH_VALUE_TYPE.SCALER, default: 0 },
    a: { type: GRAPH_VALUE_TYPE.SCALER, default: 1 },
  },
  outputs: {
    color: GRAPH_VALUE_TYPE.COLOR,
  },
  computation(inputs): { color: Transform } {
    return {
      color: hsvaToTransform({
        ...inputs,
      }),
    }
  },
  width: 140,
  color: '#f0e68c',
  label: 'Make Color',
}
