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

import { IVec2 } from 'okageo'
import { GraphNodePolarCoord, GRAPH_VALUE_TYPE } from '/@/models/graphNode'
import { createBaseNode, NodeStruct } from '/@/utils/graphNodes/core'

export const struct: NodeStruct<GraphNodePolarCoord> = {
  create(arg = {}) {
    return {
      ...createBaseNode({
        inputs: { rotate: { value: 0 }, radius: { value: 1 } },
        ...arg,
      }),
      type: 'polar_coord',
    } as GraphNodePolarCoord
  },
  data: {},
  inputs: {
    rotate: { type: GRAPH_VALUE_TYPE.SCALER, default: 0 },
    radius: { type: GRAPH_VALUE_TYPE.SCALER, default: 1 },
  },
  outputs: {
    vector2: GRAPH_VALUE_TYPE.VECTOR2,
  },
  computation(inputs): { vector2: IVec2 } {
    const r = (inputs.rotate * Math.PI) / 180
    return {
      vector2: {
        x: inputs.radius * Math.cos(r),
        y: inputs.radius * Math.sin(r),
      },
    }
  },
  width: 140,
  color: '#4169e1',
  textColor: '#fff',
  label: 'Polar Coord',
}
