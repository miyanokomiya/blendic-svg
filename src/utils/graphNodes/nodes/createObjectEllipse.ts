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

import { GraphNodeCreateObjectEllipse } from '/@/models/graphNode'
import {
  createBaseNode,
  NodeStruct,
  nodeToCreateObjectProps,
  UNIT_VALUE_TYPES,
} from '/@/utils/graphNodes/core'

export const struct: NodeStruct<GraphNodeCreateObjectEllipse> = {
  create(arg = {}) {
    return {
      ...createBaseNode({
        data: {},
        inputs: {
          ...nodeToCreateObjectProps.createdInputs,
          cx: { value: 0 },
          cy: { value: 0 },
          rx: { value: 10 },
          ry: { value: 10 },
        },
        ...arg,
      }),
      type: 'create_object_ellipse',
    } as GraphNodeCreateObjectEllipse
  },
  data: {},
  inputs: {
    ...nodeToCreateObjectProps.inputs,
    cx: {
      type: UNIT_VALUE_TYPES.SCALER,
      default: 0,
    },
    cy: {
      type: UNIT_VALUE_TYPES.SCALER,
      default: 0,
    },
    rx: {
      type: UNIT_VALUE_TYPES.SCALER,
      default: 10,
    },
    ry: {
      type: UNIT_VALUE_TYPES.SCALER,
      default: 10,
    },
  },
  outputs: nodeToCreateObjectProps.outputs,
  computation(inputs, self, context): { object: string } {
    return nodeToCreateObjectProps.getComputation((base) =>
      context.createObject('ellipse', {
        ...base,
        attributes: {
          cx: inputs.cx,
          cy: inputs.cy,
          rx: inputs.rx,
          ry: inputs.ry,
        },
      })
    )(inputs, self)
  },
  width: 140,
  color: '#dc143c',
  textColor: '#fff',
  label: 'Create Ellipse',
}
