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

import { GraphNodeCreateObjectRect } from '/@/models/graphNode'
import {
  createBaseNode,
  NodeStruct,
  nodeToCreateObjectProps,
  UNIT_VALUE_TYPES,
} from '/@/utils/graphNodes/core'

export const struct: NodeStruct<GraphNodeCreateObjectRect> = {
  create(arg = {}) {
    return {
      ...createBaseNode({
        data: {},
        inputs: {
          ...nodeToCreateObjectProps.createdInputs,
          centered: { value: false },
          x: { value: 0 },
          y: { value: 0 },
          width: { value: 100 },
          height: { value: 100 },
        },
        ...arg,
      }),
      type: 'create_object_rect',
    } as GraphNodeCreateObjectRect
  },
  data: {},
  inputs: {
    ...nodeToCreateObjectProps.inputs,
    centered: {
      type: UNIT_VALUE_TYPES.BOOLEAN,
      default: false,
    },
    x: {
      type: UNIT_VALUE_TYPES.SCALER,
      default: 0,
    },
    y: {
      type: UNIT_VALUE_TYPES.SCALER,
      default: 0,
    },
    width: {
      type: UNIT_VALUE_TYPES.SCALER,
      default: 100,
    },
    height: {
      type: UNIT_VALUE_TYPES.SCALER,
      default: 100,
    },
  },
  outputs: nodeToCreateObjectProps.outputs,
  computation(inputs, self, context): { object: string } {
    return nodeToCreateObjectProps.getComputation((base) =>
      context.createObject('rect', {
        ...base,
        attributes: {
          x: inputs.centered ? inputs.x - inputs.width / 2 : inputs.x,
          y: inputs.centered ? inputs.y - inputs.height / 2 : inputs.y,
          width: inputs.width,
          height: inputs.height,
        },
      })
    )(inputs, self)
  },
  width: 140,
  color: '#dc143c',
  textColor: '#fff',
  label: 'Create Rect',
}
