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
import * as scaler from './nodes/scaler'
import * as make_vector2 from './nodes/makeVector2'
import * as break_vector2 from './nodes/breakVector2'
import * as make_transform from './nodes/makeTransform'
import * as set_transform from './nodes/setTransform'
import * as get_frame from './nodes/getFrame'
import { v4 } from 'uuid'

const NODE_MODULES: { [key in GraphNodeType]: NodeModule<any> } = {
  scaler,
  make_vector2,
  break_vector2,
  make_transform,
  set_transform,
  get_frame,
} as const

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
): Required<T[K]>['value'] {
  return Object.keys(inputs).reduce<Required<T[K]>['value']>((p: any, key) => {
    const value = getInput(outputMap, inputs, key)
    if (value === undefined) throw new Error('Not found required input')
    p[key] = value
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
