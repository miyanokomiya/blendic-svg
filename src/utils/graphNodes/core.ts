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

import { getTransform, GraphObjectAttributes, Transform } from '/@/models'
import {
  GraphNodeBase,
  GraphNodeCreateObjectInputsBase,
  GRAPH_VALUE_STRUCT,
  GRAPH_VALUE_TYPE,
  GRAPH_VALUE_TYPE_KEY,
  ValueType,
} from '/@/models/graphNode'
import { mapReduce } from '/@/utils/commons'

export interface NodeModule<T extends GraphNodeBase> {
  struct: NodeStruct<T>
}

export interface NodeStruct<T extends GraphNodeBase> {
  create: (arg?: Partial<T>) => T
  data: {
    [key in keyof T['data']]: { type: ValueType }
  }
  inputs: {
    [key in keyof T['inputs']]: { type: ValueType } & {
      default: Required<T['inputs'][key]>['value']
    }
  }
  outputs: { [key: string]: ValueType }
  computation: (
    inputs: {
      [key in keyof T['inputs']]: Required<T['inputs'][key]>['value']
    },
    self: T,
    context: NodeContext<unknown>
  ) => { [key in keyof NodeStruct<T>['outputs']]: unknown }
  width: number
  color?: string
  textColor?: string
  label?: string
  getOutputType?: (self: T, key: string) => ValueType
  cleanGenerics?: (self: T, outputTypes?: { [key: string]: ValueType }) => T
  getGenericsChainAt?: (
    self: T,
    key: string,
    output?: boolean
  ) => EdgeChainGroupItem[]
}

export interface NodeContext<T> {
  setTransform: (
    objectId: string,
    transform: Transform | undefined,
    inherit?: boolean
  ) => void
  getTransform: (objectId: string) => Transform | undefined
  setFill: (objectId: string, transform: Transform) => void
  setStroke: (objectId: string, transform: Transform) => void
  setAttributes: (
    objectId: string,
    attributes: GraphObjectAttributes,
    replace?: boolean
  ) => void
  getFrameInfo: () => { currentFrame: number; endFrame: number }
  getObjectMap: () => { [id: string]: T }
  cloneObject: (objectId: string, arg?: Partial<T>, idPref?: string) => string
  createCloneGroupObject: (objectId: string, arg?: Partial<T>) => string
  createObject: (tag: string, arg?: Partial<T>) => string
}

export function createBaseNode(
  arg: Partial<GraphNodeBase> = {}
): GraphNodeBase {
  return {
    id: '',
    type: 'scaler',
    data: {},
    inputs: {},
    position: { x: 0, y: 0 },
    ...arg,
  }
}

export const UNIT_VALUE_TYPES: { [type in GRAPH_VALUE_TYPE_KEY]: ValueType } =
  mapReduce(GRAPH_VALUE_TYPE, (type) => ({
    type,
    struct: GRAPH_VALUE_STRUCT.UNIT,
  }))

export const nodeToCreateObjectProps = {
  createdInputs: {
    disabled: { value: false },
    parent: { value: '' },
    transform: { value: getTransform() },
    fill: { value: getTransform() },
    stroke: { value: getTransform() },
    'stroke-width': { value: 1 },
  },
  inputs: {
    disabled: {
      type: UNIT_VALUE_TYPES.BOOLEAN,
      default: false,
    },
    parent: {
      type: UNIT_VALUE_TYPES.OBJECT,
      default: '',
    },
    transform: {
      type: UNIT_VALUE_TYPES.TRANSFORM,
      default: getTransform(),
    },
    fill: {
      type: UNIT_VALUE_TYPES.COLOR,
      default: getTransform(),
    },
    stroke: {
      type: UNIT_VALUE_TYPES.COLOR,
      default: getTransform(),
    },
    'stroke-width': {
      type: UNIT_VALUE_TYPES.SCALER,
      default: 1,
    },
  } as {
    [key in keyof GraphNodeCreateObjectInputsBase]: {
      type: ValueType
    } & { default: Required<GraphNodeCreateObjectInputsBase[key]>['value'] }
  },
  outputs: {
    object: UNIT_VALUE_TYPES.OBJECT,
  },
  computation(
    inputs: {
      [key in keyof GraphNodeCreateObjectInputsBase]: Required<
        GraphNodeCreateObjectInputsBase[key]
      >['value']
    },
    self: { id: string }
  ): (Omit<typeof inputs, 'disabled'> & { id: string }) | undefined {
    return inputs.disabled
      ? undefined
      : {
          id: self.id,
          parent: inputs.parent,
          transform: inputs.transform,
          fill: inputs.fill,
          stroke: inputs.stroke,
          'stroke-width': inputs['stroke-width'],
        }
  },
} as const

export function pickNotGenericsType(
  types: (ValueType | undefined)[]
): ValueType | undefined {
  return types.find((t) => !!t && t.type !== GRAPH_VALUE_TYPE.GENERICS)
}

export interface EdgeChainGroupItem {
  id: string
  key: string
  output?: true
  type?: ValueType
}
