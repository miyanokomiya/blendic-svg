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

import { interpolateScaler, interpolateVector, IVec2 } from 'okageo'
import { getTransform, Transform } from '/@/models'
import {
  GraphNodeLerpGenerics,
  GRAPH_VALUE_STRUCT,
  GRAPH_VALUE_TYPE,
  ValueType,
} from '/@/models/graphNode'
import { interpolateTransform } from '/@/utils/armatures'
import { clamp } from '/@/utils/geometry'
import {
  createBaseNode,
  NodeStruct,
  pickNotGenericsType,
  UNIT_VALUE_TYPES,
} from '/@/utils/graphNodes/core'

export const struct: NodeStruct<GraphNodeLerpGenerics> = {
  create(arg = {}) {
    return {
      ...createBaseNode({
        inputs: {
          a: { value: undefined },
          b: { value: undefined },
          alpha: { value: 0 },
        },
        ...arg,
      }),
      type: 'lerp_generics',
    } as GraphNodeLerpGenerics
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
    alpha: {
      type: {
        type: GRAPH_VALUE_TYPE.SCALER,
        struct: GRAPH_VALUE_STRUCT.UNIT,
        scale: 0.1,
      },
      default: 0,
    },
  },
  outputs: {
    value: UNIT_VALUE_TYPES.GENERICS,
  },
  computation(inputs, self) {
    const type = this.getOutputType?.(self, 'value')
    return {
      value: getLerpFn(type)(inputs.a, inputs.b, clamp(0, 1, inputs.alpha)),
    }
  },
  width: 140,
  color: '#4169e1',
  textColor: '#fff',
  label: 'Lerp Number',
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
  genericsChains: [
    [{ key: 'a' }, { key: 'b' }, { key: 'value', output: true }],
  ],
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
      case GRAPH_VALUE_TYPE.COLOR:
        return undefined
      default:
        return ['invalid type to operate']
    }
  },
}

function getLerpFn(
  type: ValueType | undefined
): (a: any, b: any, alpha: number) => any {
  if (!type) return lerpUnknown
  if (type.struct === GRAPH_VALUE_STRUCT.ARRAY) return lerpUnknown

  switch (type.type) {
    case GRAPH_VALUE_TYPE.SCALER:
      return lerpScaler
    case GRAPH_VALUE_TYPE.VECTOR2:
      return lerpVector2
    case GRAPH_VALUE_TYPE.TRANSFORM:
    case GRAPH_VALUE_TYPE.COLOR:
      return lerpTransform
    default:
      return lerpUnknown
  }
}

function lerpUnknown(): undefined {
  return undefined
}

function lerpScaler(a: number = 0, b: number = 0, alpha: number): number {
  return interpolateScaler(a, b, alpha)
}

const zeroV = { x: 0, y: 0 }
function lerpVector2(a: IVec2 = zeroV, b: IVec2 = zeroV, alpha: number): IVec2 {
  return interpolateVector(a, b, alpha)
}

const zeroT = getTransform()
function lerpTransform(
  a: Transform = zeroT,
  b: Transform = zeroT,
  alpha: number
): Transform {
  return interpolateTransform(a, b, alpha)
}
