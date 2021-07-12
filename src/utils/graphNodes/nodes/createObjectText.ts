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
  GraphNodeCreateObjectText,
  GRAPH_VALUE_TYPE,
} from '/@/models/graphNode'
import {
  createBaseNode,
  NodeStruct,
  nodeToCreateObjectProps,
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
    centered: { type: GRAPH_VALUE_TYPE.BOOLEAN, default: false },
    x: { type: GRAPH_VALUE_TYPE.SCALER, default: 0 },
    y: { type: GRAPH_VALUE_TYPE.SCALER, default: 0 },
    dx: { type: GRAPH_VALUE_TYPE.SCALER, default: 0 },
    dy: { type: GRAPH_VALUE_TYPE.SCALER, default: 0 },
    text: { type: GRAPH_VALUE_TYPE.TEXT, default: 'TEXT' },
    'font-size': { type: GRAPH_VALUE_TYPE.SCALER, default: 100 },
  },
  outputs: nodeToCreateObjectProps.outputs,
  computation(inputs, self, context): { object: string } {
    const base = nodeToCreateObjectProps.computation(inputs, self)
    if (!base) return { object: '' }

    return {
      object: context.createObject('text', {
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
      }),
    }
  },
  width: 140,
  color: '#dc143c',
  textColor: '#fff',
  label: 'Create Text',
}
