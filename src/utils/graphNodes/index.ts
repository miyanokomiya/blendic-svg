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
  GraphNode,
  GraphNodeInputs,
  GraphNodeMap,
  GraphNodeOutputMap,
  GraphNodeOutputValues,
  GraphNodes,
  GraphNodeType,
} from '/@/models/graphNode'
import { NodeModule, NodeContext } from '/@/utils/graphNodes/core'
import { v4 } from 'uuid'
import * as scaler from './nodes/scaler'
import * as make_vector2 from './nodes/makeVector2'
import * as break_vector2 from './nodes/breakVector2'
import * as make_transform from './nodes/makeTransform'
import * as set_transform from './nodes/setTransform'
import * as get_frame from './nodes/getFrame'
import * as get_object from './nodes/getObject'
import * as add_scaler from './nodes/addScaler'
import * as sub_scaler from './nodes/subScaler'
import * as multi_scaler from './nodes/multiScaler'
import * as divide_scaler from './nodes/divideScaler'
import * as clone_object from './nodes/cloneObject'
import * as greater_than from './nodes/greaterThan'
import * as greater_than_or_equal from './nodes/greaterThanOrEqual'
import * as less_than from './nodes/lessThan'
import * as less_than_or_equal from './nodes/lessThanOrEqual'
import * as switch_scaler from './nodes/switchScaler'
import * as not from './nodes/not'

const NODE_MODULES: { [key in GraphNodeType]: NodeModule<any> } = {
  get_frame,
  scaler,
  make_vector2,
  break_vector2,
  make_transform,

  add_scaler,
  sub_scaler,
  multi_scaler,
  divide_scaler,

  get_object,
  set_transform,
  clone_object,

  not,
  greater_than,
  greater_than_or_equal,
  less_than,
  less_than_or_equal,
  switch_scaler,
} as const

export const NODE_MENU_OPTIONS_SRC: {
  label: string
  children: { label: string; type: GraphNodeType }[]
}[] = [
  {
    label: 'Primitive',
    children: [
      { label: 'Get Frame', type: 'get_frame' },
      { label: 'Number', type: 'scaler' },
      { label: 'Make Vector2', type: 'make_vector2' },
      { label: 'Break Vector2', type: 'break_vector2' },
      { label: 'Make Transform', type: 'make_transform' },
    ],
  },
  {
    label: 'Math',
    children: [
      { label: '(+) Scaler', type: 'add_scaler' },
      { label: '(-) Scaler', type: 'sub_scaler' },
      { label: '(x) Scaler', type: 'multi_scaler' },
      { label: '(/) Scaler', type: 'divide_scaler' },
    ],
  },
  {
    label: 'Boolean',
    children: [
      { label: 'Not', type: 'not' },
      { label: '(>) Scaler', type: 'greater_than' },
      { label: '(>=) Scaler', type: 'greater_than_or_equal' },
      { label: '(<) Scaler', type: 'less_than' },
      { label: '(<=) Scaler', type: 'less_than_or_equal' },
      { label: 'Switch Scaler', type: 'switch_scaler' },
    ],
  },
  {
    label: 'Object',
    children: [
      { label: 'Get Object', type: 'get_object' },
      { label: 'Set Transform', type: 'set_transform' },
      { label: 'Clone Object', type: 'clone_object' },
    ],
  },
]

export function getGraphNodeModule<T extends GraphNodeType>(
  type: T
): NodeModule<GraphNodes[T]> {
  return NODE_MODULES[type]
}

export function resolveAllNodes<T>(
  context: NodeContext<T>,
  nodeMap: GraphNodeMap
): GraphNodeOutputMap {
  return Object.keys(nodeMap).reduce<GraphNodeOutputMap>((p, id) => {
    if (p[id]) return p
    return { ...p, ...resolveNode<T>(context, nodeMap, p, id) }
  }, {})
}

export function resolveNode<T>(
  context: NodeContext<T>,
  nodeMap: GraphNodeMap,
  outputMap: GraphNodeOutputMap,
  targetId: string,
  currentPathMap: { [id: string]: true } = {}
): GraphNodeOutputMap {
  if (outputMap[targetId]) return outputMap
  if (currentPathMap[targetId]) {
    throw new Error('Failed to resolve: circular references are founded')
  }

  const target = nodeMap[targetId]
  if (!target) return outputMap

  const nextPathMap: { [id: string]: true } = {
    ...currentPathMap,
    [targetId]: true,
  }

  const fromOutputMap = getInputFromIds(target.inputs ?? {}).reduce((p, id) => {
    return resolveNode(context, nodeMap, p, id, nextPathMap)
  }, outputMap)

  return {
    ...fromOutputMap,
    [targetId]: compute<T>(context, fromOutputMap, target),
  }
}

export function compute<T>(
  context: NodeContext<T>,
  outputMap: GraphNodeOutputMap,
  target: GraphNode
): GraphNodeOutputValues {
  return NODE_MODULES[target.type].struct.computation(
    getInputs(outputMap, target.inputs),
    target,
    context
  )
}

export function getInputs<T extends GraphNodeInputs, K extends keyof T>(
  outputMap: GraphNodeOutputMap,
  inputs: T
): T[K]['value'] {
  return Object.keys(inputs).reduce<Required<T[K]>['value']>((p: any, key) => {
    p[key] = getInput(outputMap, inputs, key)
    return p
  }, {})
}

export function getInput<T extends GraphNodeInputs, K extends keyof T>(
  outputMap: GraphNodeOutputMap,
  inputs: T,
  key: K
): T[K]['value'] {
  const from = inputs[key].from
  if (from && outputMap[from.id]) return getOutput(outputMap, from.id, from.key)
  if (inputs[key].value !== undefined) return inputs[key].value
  return undefined
}

export function getOutput(
  outputMap: GraphNodeOutputMap,
  id: string,
  key: string
): unknown {
  const output = outputMap[id]
  return output[key]
}

export function getInputFromIds(inputs: GraphNodeInputs): string[] {
  return Object.values(inputs)
    .map((input) => {
      return input.from?.id
    })
    .filter((id): id is string => !!id)
}

export function validateAllNodes(nodeMap: GraphNodeMap): {
  [id: string]: { [key: string]: boolean }
} {
  return Object.keys(nodeMap).reduce<{
    [id: string]: { [key: string]: boolean }
  }>((p, id) => {
    p[id] = validateNode(nodeMap, id)
    return p
  }, {})
}

export function validateNode(
  nodeMap: GraphNodeMap,
  targetId: string
): {
  [key: string]: boolean
} {
  const target = nodeMap[targetId]
  if (!target) return {}

  return Object.keys(target.inputs).reduce<{
    [key: string]: boolean
  }>((p: any, key) => {
    p[key] = validateInput(nodeMap, target.inputs, key)
    return p
  }, {})
}

export function validateInput<T extends GraphNodeInputs>(
  nodeMap: GraphNodeMap,
  inputs: T,
  key: string
): boolean {
  const input = inputs[key]
  if (input.value !== undefined) return true
  if (input.from && nodeMap[input.from.id]) return true
  return false
}

export function createGraphNode<T extends GraphNodeType>(
  type: T,
  arg: Partial<GraphNodes[T]> = {},
  generateId = false
): GraphNodes[T] {
  const node = NODE_MODULES[type].struct.create(arg)
  if (generateId) {
    node.id = v4()
  }
  return node
}

export function validateConnection(
  from: {
    type: GraphNodeType
    key: string
  },
  to: {
    type: GraphNodeType
    key: string
  }
): boolean {
  const inputType = NODE_MODULES[to.type].struct.inputs[to.key].type
  const outputType = NODE_MODULES[from.type].struct.outputs[from.key]
  return inputType === outputType
}

export function resetInput<T extends GraphNodeType>(
  type: T,
  key: string
): { value: unknown } {
  const struct = getGraphNodeModule(type).struct
  return { value: (struct.inputs as any)[key].default }
}
