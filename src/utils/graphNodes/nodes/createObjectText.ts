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

import { GraphNodeCreateObjectText } from '/@/models/graphNode'
import {
  createBaseNode,
  NodeStruct,
  nodeToCreateObjectProps,
  UNIT_VALUE_TYPES,
} from '/@/utils/graphNodes/core'

export const struct: NodeStruct<GraphNodeCreateObjectText> = {
  create(arg = {}) {
    return {
      ...createBaseNode({
        data: {},
        inputs: {
          ...nodeToCreateObjectProps.createdInputs,
          centered: { value: false },
          x: { value: 0 },
          y: { value: 0 },
          dx: { value: 0 },
          dy: { value: 0 },
          text: { value: 'TEXT' },
          'font-size': { value: 10 },
        },
        ...arg,
      }),
      type: 'create_object_text',
    } as GraphNodeCreateObjectText
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
    dx: {
      type: UNIT_VALUE_TYPES.SCALER,
      default: 0,
    },
    dy: {
      type: UNIT_VALUE_TYPES.SCALER,
      default: 0,
    },
    text: {
      type: UNIT_VALUE_TYPES.TEXT,
      default: 'TEXT',
    },
    'font-size': {
      type: UNIT_VALUE_TYPES.SCALER,
      default: 100,
    },
  },
  outputs: nodeToCreateObjectProps.outputs,
  computation(inputs, self, context): { object: string } {
    return nodeToCreateObjectProps.getComputation((base) =>
      context.createObject('text', {
        ...base,
        attributes: {
          x: inputs.x,
          y: inputs.y,
          dx: inputs.dx,
          dy: inputs.dy,
          'font-size': inputs['font-size'],
          ...(inputs.centered
            ? {
                'text-anchor': 'middle',
                'dominant-baseline': 'middle',
              }
            : {}),
        },
        text: inputs.text,
      })
    )(inputs, self)
  },
  width: 140,
  color: '#dc143c',
  textColor: '#fff',
  label: 'Create Text',
}
