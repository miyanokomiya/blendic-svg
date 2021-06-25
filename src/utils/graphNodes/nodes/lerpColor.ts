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
import { GraphNodeLerpColor, GRAPH_VALUE_TYPE } from '/@/models/graphNode'
import { interpolateTransform } from '/@/utils/armatures'
import { clamp } from '/@/utils/geometry'
import { createBaseNode, NodeStruct } from '/@/utils/graphNodes/core'

export const struct: NodeStruct<GraphNodeLerpColor> = {
  create(arg = {}) {
    return {
      ...createBaseNode({
        inputs: {
          a: { value: getTransform() },
          b: { value: getTransform() },
          alpha: { value: 0 },
        },
        ...arg,
      }),
      type: 'lerp_color',
    } as GraphNodeLerpColor
  },
  data: {},
  inputs: {
    a: { type: GRAPH_VALUE_TYPE.COLOR, default: getTransform() },
    b: { type: GRAPH_VALUE_TYPE.COLOR, default: getTransform() },
    alpha: { type: GRAPH_VALUE_TYPE.SCALER, default: 0 },
  },
  outputs: {
    color: GRAPH_VALUE_TYPE.COLOR,
  },
  computation(inputs) {
    return {
      color: interpolateTransform(
        inputs.a,
        inputs.b,
        clamp(0, 1, inputs.alpha)
      ),
    }
  },
  width: 140,
  color: '#4169e1',
  textColor: '#fff',
  label: 'Lerp Color',
}
