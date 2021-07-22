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
  GraphNodeCreateLinearGradient,
  GRAPH_VALUE_STRUCT,
  GRAPH_VALUE_TYPE,
} from '/@/models/graphNode'
import {
  createBaseNode,
  getStopObjects,
  NodeStruct,
  UNIT_VALUE_TYPES,
} from '/@/utils/graphNodes/core'

export const struct: NodeStruct<GraphNodeCreateLinearGradient> = {
  create(arg = {}) {
    return {
      ...createBaseNode({
        inputs: {
          disabled: { value: false },
          parent: { value: '' },
          relative: { value: true },
          stop: { value: [] },
          from: { value: { x: 0, y: 0 } },
          to: { value: { x: 1, y: 1 } },
        },
        ...arg,
      }),
      type: 'create_linear_gradient',
    } as GraphNodeCreateLinearGradient
  },
  data: {},
  inputs: {
    disabled: {
      type: UNIT_VALUE_TYPES.BOOLEAN,
      default: false,
    },
    parent: {
      type: UNIT_VALUE_TYPES.OBJECT,
      default: '',
    },
    relative: {
      type: UNIT_VALUE_TYPES.BOOLEAN,
      default: true,
    },
    stop: {
      type: UNIT_VALUE_TYPES.STOP,
      default: [],
    },
    from: {
      type: {
        type: GRAPH_VALUE_TYPE.VECTOR2,
        struct: GRAPH_VALUE_STRUCT.UNIT,
        scale: 0.05,
      },
      default: { x: 0, y: 0 },
    },
    to: {
      type: {
        type: GRAPH_VALUE_TYPE.VECTOR2,
        struct: GRAPH_VALUE_STRUCT.UNIT,
        scale: 0.05,
      },
      default: { x: 1, y: 1 },
    },
  },
  outputs: {
    gradient: UNIT_VALUE_TYPES.OBJECT,
  },
  computation(inputs, self, context): { gradient: string } {
    if (inputs.disabled) return { gradient: '' }

    const gradient = context.createObject('linearGradient', {
      id: self.id,
      parent: inputs.parent,
      attributes: {
        id: self.id,
        x1: inputs.from.x,
        y1: inputs.from.y,
        x2: inputs.to.x,
        y2: inputs.to.y,
        gradientUnits: inputs.relative ? 'objectBoundingBox' : 'userSpaceOnUse',
      },
    })

    getStopObjects(gradient, inputs.stop).forEach((obj) => {
      context.createObject('stop', obj)
    })

    return { gradient }
  },
  width: 180,
  color: '#dc143c',
  textColor: '#fff',
  label: 'Linear Gradient',
}
