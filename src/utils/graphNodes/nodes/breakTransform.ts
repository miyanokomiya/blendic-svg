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
import { getTransform } from '/@/models'
import { GraphNodeBreakTransform } from '/@/models/graphNode'
import {
  createBaseNode,
  NodeStruct,
  UNIT_VALUE_TYPES,
} from '/@/utils/graphNodes/core'

export const struct: NodeStruct<GraphNodeBreakTransform> = {
  create(arg = {}) {
    return {
      ...createBaseNode({
        inputs: {
          transform: { value: getTransform() },
        },
        ...arg,
      }),
      type: 'break_transform',
    } as GraphNodeBreakTransform
  },
  data: {},
  inputs: {
    transform: { type: UNIT_VALUE_TYPES.TRANSFORM, default: getTransform() },
  },
  outputs: {
    translate: UNIT_VALUE_TYPES.VECTOR2,
    rotate: UNIT_VALUE_TYPES.SCALER,
    scale: UNIT_VALUE_TYPES.VECTOR2,
    origin: UNIT_VALUE_TYPES.VECTOR2,
  },
  computation(inputs): {
    translate: IVec2
    rotate: number
    scale: IVec2
    origin: IVec2
  } {
    return {
      translate: inputs.transform.translate,
      rotate: inputs.transform.rotate,
      scale: inputs.transform.scale,
      origin: inputs.transform.origin,
    }
  },
  width: 160,
  color: '#f0e68c',
  label: 'Break Transform',
}
