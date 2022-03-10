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
  GradientStop,
  GraphNodeBase,
  GraphNodeCreateObjectInputsBase,
  GRAPH_VALUE_STRUCT,
  GRAPH_VALUE_TYPE,
  GRAPH_VALUE_TYPE_KEY,
  ValueType,
  GraphNodeData,
  GraphNodeType,
} from '/@/models/graphNode'
import { multiPoseTransform } from '/@/utils/armatures'
import { mapReduce } from '/@/utils/commons'

export interface NodeModule<T extends GraphNodeBase> {
  struct: NodeStruct<T>
}

export interface NodeStruct<T extends GraphNodeBase> {
  create: (arg?: Partial<T>) => T
  data: {
    [key in keyof T['data']]: {
      type: ValueType
      default: T['data'][key] extends GraphNodeData<any>
        ? Required<T['data'][key]>['value']
        : Required<T['data'][key]>
    }
  }
  inputs: {
    [key in keyof T['inputs']]: { type: ValueType; label?: string } & {
      default: Required<T['inputs'][key]>['value']
    }
  }
  outputs: { [key: string]: ValueType & { label?: string } }
  computation: (
    inputs: {
      [key in keyof T['inputs']]: Required<T['inputs'][key]>['value']
    },
    self: T,
    context: NodeContext<unknown>,
    // TODO: Remove `?`
    getGraphNodeModule?: (type: GraphNodeType) => NodeModule<any> | undefined
  ) => { [key in keyof NodeStruct<T>['outputs']]: unknown }
  width: number
  color?: string
  textColor?: string
  label: string
  getOutputType?: (self: T, key: string) => ValueType
  genericsChains?: { key: string; output?: true; data?: true }[][]
  getErrors?: (self: T) => string[] | undefined
}

export interface NodeContext<T> {
  setTransform: (
    objectId: string,
    transform: Transform | undefined,
    inherit?: boolean
  ) => void
  getTransform: (objectId: string) => Transform | undefined
  setFill: (objectId: string, transform: Transform | string) => void
  setStroke: (objectId: string, transform: Transform | string) => void
  setAttributes: (
    objectId: string,
    attributes: GraphObjectAttributes,
    replace?: boolean
  ) => void
  setParent: (objectId: string, parentId: string | string) => void
  getFrameInfo: () => { currentFrame: number; endFrame: number }
  getObjectMap: () => { [id: string]: T }
  getChildId: (id: string, index: number) => string | undefined
  getChildrenSize: (id: string) => number
  cloneObject: (objectId: string, arg?: Partial<T>, idPref?: string) => string
  createCloneGroupObject: (objectId: string, arg?: Partial<T>) => string
  createObject: (tag: string, arg?: Partial<T>) => string
  beginNamespace: <T>(prefix: string, operation: () => T) => T
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
  data?: true
  type?: ValueType
}

export function isSameValueType(a?: ValueType, b?: ValueType): boolean {
  return (
    (a === undefined && b === undefined) ||
    (a?.type === b?.type && a?.struct === b?.struct)
  )
}

export function getGenericsChainAtFn(
  id: string,
  chains: { key: string; output?: true }[][]
): (key: string, output?: boolean) => EdgeChainGroupItem[] | undefined {
  return (key: string, output?: boolean) =>
    chains
      .find((chain) => chain.some((c) => c.key === key && c.output === output))
      ?.map((c) => ({ ...c, id })) ?? undefined
}

export function cloneListFn(
  context: NodeContext<unknown>,
  targetId: string,
  parentGroupId: string,
  fix_rotate = false
): (transforms: Transform[]) => void {
  const originTransform = context.getTransform(targetId)

  return (transforms) =>
    transforms.forEach((transform, i) => {
      const clone = context.cloneObject(
        targetId,
        { parent: parentGroupId },
        `${parentGroupId}_${i}`
      )
      const t = {
        ...transform,
        rotate: fix_rotate ? 0 : transform.rotate,
      }
      context.setTransform(
        clone,
        // inherits original transform
        originTransform ? multiPoseTransform(originTransform, t) : t
      )
    })
}

export function getStopObjects(
  gradientId: string,
  stops: GradientStop[]
): {
  id: string
  parent: string
  attributes: {
    offset: number
    'stop-color': Transform
  }
}[] {
  let currentOffset = 0
  return stops.map((s, i) => {
    const offset = s.relative ? currentOffset + s.offset : s.offset
    currentOffset += s.offset
    return {
      id: `${gradientId}_stop_${i}`,
      parent: gradientId,
      attributes: { offset, 'stop-color': s.color },
    }
  })
}
