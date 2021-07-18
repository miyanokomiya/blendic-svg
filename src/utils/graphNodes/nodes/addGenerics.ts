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

import { add, IVec2 } from 'okageo'
import { getTransform, Transform } from '/@/models'
import {
  GraphNodeAddGenerics,
  ValueType,
  GRAPH_VALUE_STRUCT,
  GRAPH_VALUE_TYPE,
} from '/@/models/graphNode'
import { addPoseTransform } from '/@/utils/armatures'
import {
  createBaseNode,
  NodeStruct,
  pickNotGenericsType,
  UNIT_VALUE_TYPES,
} from '/@/utils/graphNodes/core'
import * as color from '/@/utils/color'

export const struct: NodeStruct<GraphNodeAddGenerics> = {
  create(arg = {}) {
    return {
      ...createBaseNode({
        inputs: { a: { value: undefined }, b: { value: undefined } },
        ...arg,
      }),
      type: 'add_generics',
    } as GraphNodeAddGenerics
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
  },
  outputs: {
    value: UNIT_VALUE_TYPES.GENERICS,
  },
  computation(inputs, self) {
    const type = this.getOutputType?.(self, 'value')
    return {
      value: getAddFn(type)(inputs.a, inputs.b),
    }
  },
  width: 100,
  color: '#4169e1',
  textColor: '#fff',
  label: 'a + b',
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
}

function getAddFn(type: ValueType | undefined): (a: any, b: any) => any {
  if (!type) return addUnknown
  if (type.struct === GRAPH_VALUE_STRUCT.ARRAY) return addArray

  switch (type.type) {
    case GRAPH_VALUE_TYPE.SCALER:
      return addScaler
    case GRAPH_VALUE_TYPE.VECTOR2:
      return addVector2
    case GRAPH_VALUE_TYPE.TRANSFORM:
      return addTransform
    case GRAPH_VALUE_TYPE.COLOR:
      return addColor
    case GRAPH_VALUE_TYPE.TEXT:
      return addText
    case GRAPH_VALUE_TYPE.D:
      return addD
    default:
      return addUnknown
  }
}

function addUnknown(): undefined {
  return undefined
}

function addArray(a: any[] = [], b: any[] = []): any[] {
  return a.concat(b)
}

function addScaler(a: number = 0, b: number = 0): number {
  return a + b
}

const zeroV = { x: 0, y: 0 }
function addVector2(a: IVec2 = zeroV, b: IVec2 = zeroV): IVec2 {
  return add(a, b)
}

const zeroT = getTransform({
  scale: zeroV,
})
function addTransform(a: Transform = zeroT, b: Transform = zeroT): Transform {
  return addPoseTransform(a, b)
}

function addColor(a: Transform = zeroT, b: Transform = zeroT): Transform {
  return color.addColor(a, b)
}

function addText(a: string = '', b: string = ''): string {
  return a + b
}

function addD(a: string[] = [], b: string[] = []): string[] {
  return a.concat(b)
}
