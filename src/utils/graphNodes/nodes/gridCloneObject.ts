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

import { rotate, sub } from 'okageo'
import { getTransform } from '/@/models'
import { GraphNodeGridCloneObject, GRAPH_VALUE_TYPE } from '/@/models/graphNode'
import { multiPoseTransform } from '/@/utils/armatures'
import { createBaseNode, NodeStruct } from '/@/utils/graphNodes/core'

export const struct: NodeStruct<GraphNodeGridCloneObject> = {
  create(arg = {}) {
    return {
      ...createBaseNode({
        inputs: {
          object: { value: '' },
          centered: { value: false },
          rotate: { value: 0 },
          row: { value: 3 },
          column: { value: 3 },
          width: { value: 50 },
          height: { value: 50 },
        },
        ...arg,
      }),
      type: 'grid_clone_object',
    } as GraphNodeGridCloneObject
  },
  data: {},
  inputs: {
    object: { type: GRAPH_VALUE_TYPE.OBJECT, default: '' },
    centered: { type: GRAPH_VALUE_TYPE.BOOLEAN, default: false },
    rotate: { type: GRAPH_VALUE_TYPE.SCALER, default: 0 },
    row: { type: GRAPH_VALUE_TYPE.SCALER, default: 3 },
    column: { type: GRAPH_VALUE_TYPE.SCALER, default: 3 },
    width: { type: GRAPH_VALUE_TYPE.SCALER, default: 50 },
    height: { type: GRAPH_VALUE_TYPE.SCALER, default: 50 },
  },
  outputs: {
    origin: GRAPH_VALUE_TYPE.OBJECT,
    group: GRAPH_VALUE_TYPE.OBJECT,
  },
  computation(inputs, _self, context): { origin: string; group: string } {
    if (!inputs.object) return { origin: '', group: '' }

    const row = Math.floor(inputs.row)
    const column = Math.floor(inputs.column)
    if (row <= 0 || column <= 0) return { origin: 'a', group: '' }

    const group = context.createCloneGroupObject(inputs.object)
    const originTransform = context.getTransform(inputs.object)

    const diff = inputs.centered
      ? {
          x: ((column - 1) * inputs.width) / 2,
          y: ((row - 1) * inputs.height) / 2,
        }
      : undefined

    const rows = [...Array(row)].map((_, i) => i * inputs.height)
    const columns = [...Array(column)].map((_, i) => i * inputs.width)
    const rad = (inputs.rotate * Math.PI) / 180

    rows.forEach((y) => {
      columns.forEach((x) => {
        const clone = context.cloneObject(inputs.object, { parent: group })
        const t = getTransform({
          translate: rotate(diff ? sub({ x, y }, diff) : { x, y }, rad),
        })
        context.setTransform(
          clone,
          // inherits original transform
          originTransform ? multiPoseTransform(originTransform, t) : t
        )
      })
    })
    return { origin: inputs.object, group }
  },
  width: 180,
  color: '#dc143c',
  textColor: '#fff',
  label: 'Grid Clone Object',
}
