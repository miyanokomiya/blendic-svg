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

import { getDistance, IVec2 } from 'okageo'
import {
  GraphNodeEqualGenerics,
  GRAPH_VALUE_STRUCT,
  GRAPH_VALUE_TYPE,
  ValueType,
} from '/@/models/graphNode'
import {
  createBaseNode,
  NodeStruct,
  pickNotGenericsType,
  UNIT_VALUE_TYPES,
} from '/@/utils/graphNodes/core'

export const struct: NodeStruct<GraphNodeEqualGenerics> = {
  create(arg = {}) {
    return {
      ...createBaseNode({
        inputs: {
          a: { value: undefined },
          b: { value: undefined },
          threshold: { value: 0 },
        },
        ...arg,
      }),
      type: 'equal_generics',
    } as GraphNodeEqualGenerics
  },
  data: {},
  inputs: {
    a: {
      type: UNIT_VALUE_TYPES.GENERICS,
      default: undefined,
    },
    b: {
      type: UNIT_VALUE_TYPES.GENERICS,
      default: undefined,
    },
    threshold: {
      type: {
        type: GRAPH_VALUE_TYPE.SCALER,
        struct: GRAPH_VALUE_STRUCT.UNIT,
        scale: 0.1,
      },
      default: 0,
    },
  },
  outputs: {
    value: UNIT_VALUE_TYPES.BOOLEAN,
  },
  computation(inputs, self) {
    const type =
      pickNotGenericsType([
        self.inputs.a.genericsType,
        self.inputs.b.genericsType,
      ]) ?? UNIT_VALUE_TYPES.GENERICS
    return {
      value: getEqualFn(type)(inputs.a, inputs.b, inputs.threshold),
    }
  },
  width: 120,
  color: '#b0c4de',
  textColor: '#000',
  label: 'a = b',
  genericsChains: [
    [{ key: 'a' }, { key: 'b' }, { key: 'value', output: true }],
  ],
  getErrors(self) {
    const type = pickNotGenericsType([
      self.inputs.a.genericsType,
      self.inputs.b.genericsType,
    ])
    if (!type) return

    switch (type.type) {
      case GRAPH_VALUE_TYPE.SCALER:
      case GRAPH_VALUE_TYPE.VECTOR2:
      case GRAPH_VALUE_TYPE.TEXT:
      case GRAPH_VALUE_TYPE.OBJECT:
      case GRAPH_VALUE_TYPE.BOOLEAN:
        return undefined
      default:
        return ['invalid type to operate']
    }
  },
}

function getEqualFn(
  type: ValueType | undefined
): (a: any, b: any, threshold: number) => any {
  if (!type) return equalUnknown
  if (type.struct === GRAPH_VALUE_STRUCT.ARRAY) return equalUnknown

  switch (type.type) {
    case GRAPH_VALUE_TYPE.SCALER:
      return equalScaler
    case GRAPH_VALUE_TYPE.VECTOR2:
      return equalVector2
    case GRAPH_VALUE_TYPE.TEXT:
    case GRAPH_VALUE_TYPE.OBJECT:
      return equalString
    case GRAPH_VALUE_TYPE.BOOLEAN:
      return equalBoolean
    default:
      return equalUnknown
  }
}

function equalUnknown(): boolean {
  return false
}

function equalScaler(a: number = 0, b: number = 0, threshold: number): boolean {
  return Math.abs(a - b) <= threshold
}

const zeroV = { x: 0, y: 0 }
function equalVector2(
  a: IVec2 = zeroV,
  b: IVec2 = zeroV,
  threshold: number
): boolean {
  return getDistance(a, b) <= threshold
}

function equalString(a: string = '', b: string = ''): boolean {
  return a === b
}

function equalBoolean(a = false, b = false): boolean {
  return a === b
}
