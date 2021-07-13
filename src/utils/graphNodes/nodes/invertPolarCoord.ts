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

import { getNorm, getRadian } from 'okageo'
import { GraphNodeInvertPolarCoord } from '/@/models/graphNode'
import {
  createBaseNode,
  NodeStruct,
  UNIT_VALUE_TYPES,
} from '/@/utils/graphNodes/core'

export const struct: NodeStruct<GraphNodeInvertPolarCoord> = {
  create(arg = {}) {
    return {
      ...createBaseNode({
        inputs: { vector2: { value: { x: 1, y: 0 } } },
        ...arg,
      }),
      type: 'invert_polar_coord',
    } as GraphNodeInvertPolarCoord
  },
  data: {},
  inputs: {
    vector2: {
      type: UNIT_VALUE_TYPES.VECTOR2,
      default: { x: 1, y: 0 },
    },
  },
  outputs: {
    rotate: UNIT_VALUE_TYPES.SCALER,
    radius: UNIT_VALUE_TYPES.SCALER,
  },
  computation(inputs): { rotate: number; radius: number } {
    const radius = getNorm(inputs.vector2)
    const rotate = (getRadian(inputs.vector2) * 180) / Math.PI
    return { rotate, radius }
  },
  width: 160,
  color: '#4169e1',
  textColor: '#fff',
  label: 'Invert Polar Coord',
}
