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

import { getTransform } from '/@/models'
import { GraphNodeBreakColor, GRAPH_VALUE_TYPE } from '/@/models/graphNode'
import { posedHsva } from '/@/utils/attributesResolver'
import { createBaseNode, NodeStruct } from '/@/utils/graphNodes/core'

export const struct: NodeStruct<GraphNodeBreakColor> = {
  create(arg = {}) {
    return {
      ...createBaseNode({
        inputs: {
          color: { value: getTransform() },
        },
        ...arg,
      }),
      type: 'break_color',
    } as GraphNodeBreakColor
  },
  data: {},
  inputs: {
    color: { type: GRAPH_VALUE_TYPE.COLOR, default: getTransform() },
  },
  outputs: {
    h: GRAPH_VALUE_TYPE.SCALER,
    s: GRAPH_VALUE_TYPE.SCALER,
    v: GRAPH_VALUE_TYPE.SCALER,
    a: GRAPH_VALUE_TYPE.SCALER,
  },
  computation(inputs): { h: number; s: number; v: number; a: number } {
    return { ...posedHsva(inputs.color) }
  },
  width: 140,
  color: '#f0e68c',
  label: 'Break Color',
}
