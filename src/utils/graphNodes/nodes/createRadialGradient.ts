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
  GraphNodeCreateRadialGradient,
  GRAPH_VALUE_STRUCT,
  GRAPH_VALUE_TYPE,
} from '/@/models/graphNode'
import { getGraphValueEnumKey } from '/@/models/graphNodeEnums'
import {
  createBaseNode,
  getStopObjects,
  NodeStruct,
  UNIT_VALUE_TYPES,
} from '/@/utils/graphNodes/core'

export const struct: NodeStruct<GraphNodeCreateRadialGradient> = {
  create(arg = {}) {
    return {
      ...createBaseNode({
        inputs: {
          disabled: { value: false },
          parent: { value: '' },
          relative: { value: true },
          spread: { value: 0 },
          stop: { value: [] },
          center: { value: { x: 0, y: 0 } },
          radius: { value: 1 },
          focus: { value: { x: 0, y: 0 } },
        },
        ...arg,
      }),
      type: 'create_radial_gradient',
    } as GraphNodeCreateRadialGradient
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
    spread: {
      type: {
        type: GRAPH_VALUE_TYPE.SCALER,
        struct: GRAPH_VALUE_STRUCT.UNIT,
        enumKey: 'SPREAD_METHOD',
      },
      default: 0,
    },
    stop: {
      type: UNIT_VALUE_TYPES.STOP,
      default: [],
    },
    center: {
      type: {
        type: GRAPH_VALUE_TYPE.VECTOR2,
        struct: GRAPH_VALUE_STRUCT.UNIT,
        scale: 0.05,
      },
      default: { x: 0, y: 0 },
    },
    radius: {
      type: {
        type: GRAPH_VALUE_TYPE.SCALER,
        struct: GRAPH_VALUE_STRUCT.UNIT,
        scale: 0.05,
      },
      default: 1,
    },
    focus: {
      type: {
        type: GRAPH_VALUE_TYPE.VECTOR2,
        struct: GRAPH_VALUE_STRUCT.UNIT,
        scale: 0.05,
      },
      default: { x: 0, y: 0 },
    },
  },
  outputs: {
    gradient: UNIT_VALUE_TYPES.OBJECT,
  },
  computation(inputs, self, context): { gradient: string } {
    if (inputs.disabled) return { gradient: '' }

    const gradient = context.createObject('radialGradient', {
      id: self.id,
      parent: inputs.parent,
      attributes: {
        id: self.id,
        cx: inputs.center.x,
        cy: inputs.center.y,
        r: Math.max(inputs.radius, 0),
        fx: inputs.focus.x,
        fy: inputs.focus.y,
        gradientUnits: getGraphValueEnumKey(
          'SPACE_UNITS',
          inputs.relative ? 1 : 0
        ),
        spreadMethod: getGraphValueEnumKey('SPREAD_METHOD', inputs.spread),
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
  label: 'Radial Gradient',
}
