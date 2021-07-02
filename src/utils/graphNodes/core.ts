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
  GRAPH_VALUE_TYPE,
} from '/@/models/graphNode'

export interface NodeModule<T extends GraphNodeBase> {
  struct: NodeStruct<T>
}

export interface NodeStruct<T extends GraphNodeBase> {
  create: (arg?: Partial<T>) => T
  data: {
    [key in keyof T['data']]: { type: keyof typeof GRAPH_VALUE_TYPE }
  }
  inputs: {
    [key in keyof T['inputs']]: { type: keyof typeof GRAPH_VALUE_TYPE } & {
      default: Required<T['inputs'][key]>['value']
    }
  }
  outputs: {
    [key: string]: keyof typeof GRAPH_VALUE_TYPE
  }
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
}

export interface NodeContext<T> {
  setTransform: (objectId: string, transform: Transform | undefined) => void
  getTransform: (objectId: string) => Transform | undefined
  setFill: (objectId: string, transform: Transform) => void
  setStroke: (objectId: string, transform: Transform) => void
  setAttributes: (
    objectId: string,
    attributes: GraphObjectAttributes,
    replace?: boolean
  ) => void
  getFrame: () => number
  getObjectMap: () => { [id: string]: T }
  cloneObject: (objectId: string, arg?: Partial<T>) => string
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
    disabled: { type: GRAPH_VALUE_TYPE.BOOLEAN, default: false },
    parent: { type: GRAPH_VALUE_TYPE.OBJECT, default: '' },
    transform: { type: GRAPH_VALUE_TYPE.TRANSFORM, default: getTransform() },
    fill: { type: GRAPH_VALUE_TYPE.COLOR, default: getTransform() },
    stroke: { type: GRAPH_VALUE_TYPE.COLOR, default: getTransform() },
    'stroke-width': { type: GRAPH_VALUE_TYPE.SCALER, default: 1 },
  } as {
    [key in keyof GraphNodeCreateObjectInputsBase]: {
      type: keyof typeof GRAPH_VALUE_TYPE
    } & { default: Required<GraphNodeCreateObjectInputsBase[key]>['value'] }
  },
  outputs: {
    object: GRAPH_VALUE_TYPE.OBJECT,
  },
  computation(
    inputs: {
      [key in keyof GraphNodeCreateObjectInputsBase]: Required<
        GraphNodeCreateObjectInputsBase[key]
      >['value']
    }
  ): Omit<typeof inputs, 'disabled'> | undefined {
    return inputs.disabled
      ? undefined
      : {
          parent: inputs.parent,
          transform: inputs.transform,
          fill: inputs.fill,
          stroke: inputs.stroke,
          'stroke-width': inputs['stroke-width'],
        }
  },
} as const
