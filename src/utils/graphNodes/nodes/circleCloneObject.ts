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

import { rotate } from 'okageo'
import { getTransform } from '/@/models'
import {
  GraphNodeCircleCloneObject,
  GRAPH_VALUE_TYPE,
} from '/@/models/graphNode'
import { multiPoseTransform } from '/@/utils/armatures'
import { createBaseNode, NodeStruct } from '/@/utils/graphNodes/core'

export const struct: NodeStruct<GraphNodeCircleCloneObject> = {
  create(arg = {}) {
    return {
      ...createBaseNode({
        inputs: {
          object: { value: '' },
          count: { value: 4 },
          radius: { value: 100 },
          fix_rotate: { value: false },
        },
        ...arg,
      }),
      type: 'circle_clone_object',
    } as GraphNodeCircleCloneObject
  },
  data: {},
  inputs: {
    object: { type: GRAPH_VALUE_TYPE.OBJECT, default: '' },
    count: { type: GRAPH_VALUE_TYPE.SCALER, default: 4 },
    radius: { type: GRAPH_VALUE_TYPE.SCALER, default: 100 },
    fix_rotate: { type: GRAPH_VALUE_TYPE.BOOLEAN, default: false },
  },
  outputs: {
    origin: GRAPH_VALUE_TYPE.OBJECT,
    group: GRAPH_VALUE_TYPE.OBJECT,
  },
  computation(inputs, _self, context): { origin: string; group: string } {
    if (!inputs.object) return { origin: '', group: '' }
    const count = Math.floor(inputs.count)
    if (count <= 0) return { origin: inputs.object, group: '' }

    const group = context.createCloneGroupObject(inputs.object)
    const originTransform = context.getTransform(inputs.object)

    ;[...Array(count)]
      .map((_, i) => (i * 360) / count)
      .map((angle) => {
        const clone = context.cloneObject(inputs.object, {
          parent: group,
        })
        const t = getTransform({
          translate: rotate(
            { x: inputs.radius, y: 0 },
            (angle * Math.PI) / 180
          ),
          rotate: inputs.fix_rotate ? 0 : angle,
        })
        context.setTransform(
          clone,
          // inherits original transform
          originTransform ? multiPoseTransform(originTransform, t) : t
        )
      })
    return { origin: inputs.object, group }
  },
  width: 180,
  color: '#dc143c',
  textColor: '#fff',
  label: 'Circle Clone Object',
}
