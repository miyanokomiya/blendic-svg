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

import { getTransform } from '/@/models'
import {
  GraphNodeMakeStop,
  GRAPH_VALUE_STRUCT,
  GRAPH_VALUE_TYPE,
} from '/@/models/graphNode'
import {
  createBaseNode,
  NodeStruct,
  UNIT_VALUE_TYPES,
} from '/@/utils/graphNodes/core'

export const struct: NodeStruct<GraphNodeMakeStop> = {
  create(arg = {}) {
    return {
      ...createBaseNode({
        inputs: {
          stop: { value: [] },
          relative: { value: true },
          offset: { value: 0 },
          color: { value: getTransform() },
        },
        ...arg,
      }),
      type: 'make_stop',
    } as GraphNodeMakeStop
  },
  data: {},
  inputs: {
    stop: {
      type: UNIT_VALUE_TYPES.STOP,
      default: [],
    },
    relative: {
      type: UNIT_VALUE_TYPES.BOOLEAN,
      default: true,
    },
    offset: {
      type: {
        type: GRAPH_VALUE_TYPE.SCALER,
        struct: GRAPH_VALUE_STRUCT.UNIT,
        scale: 0.1,
      },
      default: 0,
    },
    color: {
      type: UNIT_VALUE_TYPES.COLOR,
      default: getTransform(),
    },
  },
  outputs: { stop: UNIT_VALUE_TYPES.STOP },
  computation(inputs, _self, _context): {} {
    return {
      stop: [
        ...inputs.stop,
        {
          offset: inputs.offset,
          color: inputs.color,
          relative: inputs.relative,
        },
      ],
    }
  },
  width: 140,
  color: '#8b008b',
  textColor: '#fff',
  label: 'Make Stop',
}
