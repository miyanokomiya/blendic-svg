import { IVec2 } from 'okageo'
import {
  GraphNode,
  GraphNodeBreakVector2,
  GraphNodeInputs,
  GraphNodeMakeVector2,
  GraphNodeMap,
  GraphNodeOutputMap,
  GraphNodeOutputValues,
  GraphNodeScaler,
} from '/@/models/nodeEditor'

const NODE_STRUCTS = {
  scaler: {
    inputs: {
      value: { default: 0 },
    },
    computation(self: GraphNodeScaler): { value: number } {
      return { value: self.data.value }
    },
  },
  make_vector2: {
    inputs: {
      x: { default: 0 },
      y: { default: 0 },
    },
    computation(_self: GraphNodeMakeVector2, inputs: IVec2): { value: IVec2 } {
      return { value: inputs }
    },
  },
  break_vector2: {
    inputs: {
      value: { required: true },
    },
    computation(
      _self: GraphNodeBreakVector2,
      inputs: { value: IVec2 }
    ): { x: number; y: number } {
      return { x: inputs.value.x, y: inputs.value.y }
    },
  },
} as const

export function resolve(
  nodeMap: GraphNodeMap,
  outputMap: GraphNodeOutputMap,
  targetId: string
): GraphNodeOutputMap {
  const target = nodeMap[targetId]
  return {
    ...outputMap,
    [targetId]: compute(outputMap, target),
  }
}

export function compute(
  outputMap: GraphNodeOutputMap,
  target: GraphNode
): GraphNodeOutputValues {
  switch (target.type) {
    case 'scaler':
      return NODE_STRUCTS[target.type].computation(target)
    case 'make_vector2':
      return NODE_STRUCTS[target.type].computation(target, {
        x: getInput(outputMap, target.inputs, 'x'),
        y: getInput(outputMap, target.inputs, 'y'),
      })
    case 'break_vector2': {
      const value = getInput(outputMap, target.inputs, 'value')
      return NODE_STRUCTS[target.type].computation(target, { value })
    }
  }
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
