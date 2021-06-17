import {
  GraphNode,
  GraphNodeInputs,
  GraphNodeMap,
  GraphNodeOutputMap,
  GraphNodeOutputValues,
  GraphNodeType,
} from '/@/models/graphNode'
import { NodeStruce } from '/@/utils/graphNodes/core'
import * as scaler from './nodes/scaler'
import * as make_vector2 from './nodes/makeVector2'
import * as break_vector2 from './nodes/breakVector2'

const NODE_MODULES: { [key in GraphNodeType]: { struct: NodeStruce<any> } } = {
  scaler,
  make_vector2,
  break_vector2,
} as const

export function resolveAllNode(nodeMap: GraphNodeMap): GraphNodeOutputMap {
  return Object.keys(nodeMap).reduce<GraphNodeOutputMap>((p, id) => {
    if (p[id]) return p
    return { ...p, ...resolveNode(nodeMap, p, id) }
  }, {})
}

export function resolveNode(
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
    return resolveNode(nodeMap, p, id, nextPathMap)
  }, outputMap)

  return {
    ...fromOutputMap,
    [targetId]: compute(fromOutputMap, target),
  }
}

export function compute(
  outputMap: GraphNodeOutputMap,
  target: GraphNode
): GraphNodeOutputValues {
  return NODE_MODULES[target.type].struct.computation(
    target,
    getInputs(outputMap, target.inputs)
  )
}

export function getInputs<T extends GraphNodeInputs, K extends keyof T>(
  outputMap: GraphNodeOutputMap,
  inputs: T
): Required<T[K]>['value'] {
  return Object.keys(inputs).reduce<Required<T[K]>['value']>((p: any, key) => {
    p[key] = getInput(outputMap, inputs, key)
    return p
  }, {})
}

export function getInput<T extends GraphNodeInputs, K extends keyof T>(
  outputMap: GraphNodeOutputMap,
  inputs: T,
  key: K
): Required<T[K]>['value'] {
  const from = inputs[key].from
  if (from && outputMap[from.id]) return getOutput(outputMap, from.id, from.key)
  if (inputs[key].value !== undefined) return inputs[key].value
  throw new Error('Not found required input')
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
