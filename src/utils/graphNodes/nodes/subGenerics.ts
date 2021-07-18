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

import { IVec2, sub } from 'okageo'
import { getTransform, Transform } from '/@/models'
import {
  GraphNodeSubGenerics,
  GRAPH_VALUE_STRUCT,
  GRAPH_VALUE_TYPE,
  ValueType,
} from '/@/models/graphNode'
import { subPoseTransform } from '/@/utils/armatures'
import {
  createBaseNode,
  NodeStruct,
  pickNotGenericsType,
  UNIT_VALUE_TYPES,
} from '/@/utils/graphNodes/core'

export const struct: NodeStruct<GraphNodeSubGenerics> = {
  create(arg = {}) {
    return {
      ...createBaseNode({
        inputs: { a: { value: undefined }, b: { value: undefined } },
        ...arg,
      }),
      type: 'sub_generics',
    } as GraphNodeSubGenerics
  },
  data: {},
  inputs: {
    a: { type: UNIT_VALUE_TYPES.GENERICS, default: undefined },
    b: { type: UNIT_VALUE_TYPES.GENERICS, default: undefined },
  },
  outputs: {
    value: UNIT_VALUE_TYPES.GENERICS,
  },
  computation(inputs, self) {
    const type = this.getOutputType?.(self, 'value')
    return {
      value: getSubFn(type)(inputs.a, inputs.b),
    }
  },
  width: 100,
  color: '#4169e1',
  textColor: '#fff',
  label: 'a - b',
  getOutputType(self, key) {
    switch (key) {
      case 'value':
        return (
          pickNotGenericsType([
            self.inputs.a.genericsType,
            self.inputs.b.genericsType,
          ]) ?? UNIT_VALUE_TYPES.GENERICS
        )
      default:
        return UNIT_VALUE_TYPES.GENERICS
    }
  },
  getGenericsChainAt(self, key, output) {
    if ((output && key === 'value') || key === 'a' || key === 'b') {
      return [
        { id: self.id, key: 'a' },
        { id: self.id, key: 'b' },
        { id: self.id, key: 'value', output: true },
      ]
    }

    return []
  },
  getErrors(self) {
    const type = pickNotGenericsType([
      self.inputs.a.genericsType,
      self.inputs.b.genericsType,
    ])
    if (!type) return
    if (type.struct !== GRAPH_VALUE_STRUCT.UNIT)
      return ['invalid type to operate']

    switch (type.type) {
      case GRAPH_VALUE_TYPE.SCALER:
      case GRAPH_VALUE_TYPE.VECTOR2:
      case GRAPH_VALUE_TYPE.TRANSFORM:
        return undefined
      default:
        return ['invalid type to operate']
    }
  },
}

function getSubFn(type: ValueType | undefined): (a: any, b: any) => any {
  if (!type) return subUnknown
  if (type.struct === GRAPH_VALUE_STRUCT.ARRAY) return subUnknown

  switch (type.type) {
    case GRAPH_VALUE_TYPE.SCALER:
      return subScaler
    case GRAPH_VALUE_TYPE.VECTOR2:
      return subVector2
    case GRAPH_VALUE_TYPE.TRANSFORM:
      return subTransform
    default:
      return subUnknown
  }
}

function subUnknown(): undefined {
  return undefined
}

function subVector2(a: IVec2 = zeroV, b: IVec2 = zeroV): IVec2 {
  return sub(a, b)
}

function subScaler(a: number = 0, b: number = 0): number {
  return a - b
}

const zeroV = { x: 0, y: 0 }

const zeroT = getTransform({
  scale: zeroV,
})
function subTransform(a: Transform = zeroT, b: Transform = zeroT): Transform {
  return subPoseTransform(a, b)
}
