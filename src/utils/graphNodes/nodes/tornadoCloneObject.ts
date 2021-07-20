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

import {
  GraphNodeTornadoCloneObject,
  GRAPH_VALUE_STRUCT,
  GRAPH_VALUE_TYPE,
} from '/@/models/graphNode'
import { getTornadoTransformFn } from '/@/utils/geometry'
import {
  cloneListFn,
  createBaseNode,
  NodeStruct,
  UNIT_VALUE_TYPES,
} from '/@/utils/graphNodes/core'

export const struct: NodeStruct<GraphNodeTornadoCloneObject> = {
  create(arg = {}) {
    return {
      ...createBaseNode({
        inputs: {
          object: { value: '' },
          rotate: { value: 0 },
          max_rotate: { value: 360 * 3 },
          interval: { value: 30 },
          offset: { value: 0 },
          radius: { value: 50 },
          radius_grow: { value: 1 },
          scale_grow: { value: 1 },
          fix_rotate: { value: false },
        },
        ...arg,
      }),
      type: 'tornado_clone_object',
    } as GraphNodeTornadoCloneObject
  },
  data: {},
  inputs: {
    object: {
      type: UNIT_VALUE_TYPES.OBJECT,
      default: '',
    },
    rotate: {
      type: UNIT_VALUE_TYPES.SCALER,
      default: 0,
    },
    max_rotate: {
      type: UNIT_VALUE_TYPES.SCALER,
      default: 360 * 3,
    },
    interval: {
      type: UNIT_VALUE_TYPES.SCALER,
      default: 60,
    },
    offset: {
      type: UNIT_VALUE_TYPES.SCALER,
      default: 0,
    },
    radius: {
      type: UNIT_VALUE_TYPES.SCALER,
      default: 50,
    },
    radius_grow: {
      type: {
        type: GRAPH_VALUE_TYPE.SCALER,
        struct: GRAPH_VALUE_STRUCT.UNIT,
        scale: 0.1,
      },
      default: 1,
    },
    scale_grow: {
      type: {
        type: GRAPH_VALUE_TYPE.SCALER,
        struct: GRAPH_VALUE_STRUCT.UNIT,
        scale: 0.1,
      },
      default: 1,
    },
    fix_rotate: {
      type: UNIT_VALUE_TYPES.BOOLEAN,
      default: false,
    },
  },
  outputs: {
    origin: UNIT_VALUE_TYPES.OBJECT,
    group: UNIT_VALUE_TYPES.OBJECT,
  },
  computation(inputs, self, context): { origin: string; group: string } {
    if (!inputs.object) return { origin: '', group: '' }

    const count = Math.floor(inputs.max_rotate / inputs.interval)
    if (
      count <= 0 ||
      inputs.interval <= 0 ||
      inputs.radius <= 0 ||
      inputs.radius_grow <= 0 ||
      inputs.scale_grow <= 0
    )
      return { origin: inputs.object, group: '' }

    const group = context.createCloneGroupObject(inputs.object, { id: self.id })
    const tornadoFn = getTornadoTransformFn(
      inputs.radius,
      inputs.rotate,
      inputs.radius_grow,
      inputs.scale_grow
    )
    const cloneFn = cloneListFn(
      context,
      inputs.object,
      group,
      inputs.fix_rotate
    )
    cloneFn(
      [...Array(count)]
        .map((_, i) => inputs.interval * i + inputs.offset)
        .filter((angle) => 0 <= angle && angle <= inputs.max_rotate)
        .map(tornadoFn)
    )

    return { origin: inputs.object, group }
  },
  width: 200,
  color: '#dc143c',
  textColor: '#fff',
  label: 'Tornado Clone Object',
}
