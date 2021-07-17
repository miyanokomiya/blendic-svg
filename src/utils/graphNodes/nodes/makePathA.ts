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

import { GraphNodeMakePathA } from '/@/models/graphNode'
import {
  createBaseNode,
  NodeStruct,
  UNIT_VALUE_TYPES,
} from '/@/utils/graphNodes/core'

export const struct: NodeStruct<GraphNodeMakePathA> = {
  create(arg = {}) {
    return {
      ...createBaseNode({
        data: {},
        inputs: {
          d: { value: [] },
          relative: { value: false },
          rx: { value: 10 },
          ry: { value: 10 },
          rotate: { value: 0 },
          'large-arc': { value: false },
          sweep: { value: false },
          p: { value: { x: 0, y: 0 } },
        },
        ...arg,
      }),
      type: 'make_path_a',
    } as GraphNodeMakePathA
  },
  data: {},
  inputs: {
    d: {
      type: UNIT_VALUE_TYPES.D,
      default: [],
    },
    relative: {
      type: UNIT_VALUE_TYPES.BOOLEAN,
      default: false,
    },
    rx: {
      type: UNIT_VALUE_TYPES.SCALER,
      default: 1,
    },
    ry: {
      type: UNIT_VALUE_TYPES.SCALER,
      default: 1,
    },
    rotate: {
      type: UNIT_VALUE_TYPES.SCALER,
      default: 0,
    },
    'large-arc': {
      type: UNIT_VALUE_TYPES.BOOLEAN,
      default: false,
    },
    sweep: {
      type: UNIT_VALUE_TYPES.BOOLEAN,
      default: false,
    },
    p: {
      type: UNIT_VALUE_TYPES.VECTOR2,
      default: { x: 0, y: 0 },
    },
  },
  outputs: {
    d: UNIT_VALUE_TYPES.D,
  },
  computation(inputs): { d: string[] } {
    return {
      d: [
        ...inputs.d,
        `${inputs.relative ? 'a' : 'A'}${inputs.rx} ${inputs.ry} ${
          inputs.rotate
        } ${inputs['large-arc'] ? 1 : 0} ${inputs.sweep ? 1 : 0} ${
          inputs.p.x
        },${inputs.p.y}`,
      ],
    }
  },
  width: 140,
  color: '#fff5ee',
  textColor: '#000',
  label: 'Make Path A',
}
