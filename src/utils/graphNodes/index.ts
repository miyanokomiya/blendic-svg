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
import * as get_frame from './nodes/getFrame'
import * as scaler from './nodes/scaler'
import * as make_vector2 from './nodes/makeVector2'
import * as break_vector2 from './nodes/breakVector2'
import * as make_transform from './nodes/makeTransform'
import * as color from './nodes/color'
import * as make_color from './nodes/makeColor'
import * as break_color from './nodes/breakColor'

import * as add_scaler from './nodes/addScaler'
import * as sub_scaler from './nodes/subScaler'
import * as multi_scaler from './nodes/multiScaler'
import * as divide_scaler from './nodes/divideScaler'
import * as sin from './nodes/sin'
import * as cos from './nodes/cos'
import * as pow from './nodes/pow'
import * as add_vector2 from './nodes/addVector2'
import * as sub_vector2 from './nodes/subVector2'
import * as scale_vector2 from './nodes/scaleVector2'
import * as distance from './nodes/distance'
import * as rotate_vector2 from './nodes/rotateVector2'
import * as lerp_scaler from './nodes/lerpScaler'
import * as lerp_vector2 from './nodes/lerpVector2'
import * as lerp_transform from './nodes/lerpTransform'
import * as lerp_color from './nodes/lerpColor'

import * as get_object from './nodes/getObject'
import * as set_transform from './nodes/setTransform'
import * as set_fill from './nodes/setFill'
import * as set_stroke from './nodes/setStroke'
import * as set_viewbox from './nodes/setViewbox'
import * as clone_object from './nodes/cloneObject'
import * as create_object_group from './nodes/createObjectGroup'
import * as create_object_rect from './nodes/createObjectRect'
import * as create_object_ellipse from './nodes/createObjectEllipse'
import * as create_object_path from './nodes/createObjectPath'
import * as make_path_m from './nodes/makePathM'
import * as make_path_l from './nodes/makePathL'
import * as make_path_q from './nodes/makePathQ'
import * as make_path_t from './nodes/makePathT'
import * as make_path_c from './nodes/makePathC'
import * as make_path_s from './nodes/makePathS'
import * as make_path_z from './nodes/makePathZ'

import * as greater_than from './nodes/greaterThan'
import * as greater_than_or_equal from './nodes/greaterThanOrEqual'
import * as less_than from './nodes/lessThan'
import * as less_than_or_equal from './nodes/lessThanOrEqual'
import * as not from './nodes/not'
import * as equal from './nodes/equal'
import * as switch_scaler from './nodes/switchScaler'
import * as switch_vector2 from './nodes/switchVector2'
import * as switch_transform from './nodes/switchTransform'
import * as switch_object from './nodes/switchObject'
import { IdMap } from '/@/models'
import { mapReduce } from '/@/utils/commons'

const NODE_MODULES: { [key in GraphNodeType]: NodeModule<any> } = {
  get_frame,
  scaler,
  make_vector2,
  break_vector2,
  make_transform,
  color,
  make_color,
  break_color,

  add_scaler,
  sub_scaler,
  multi_scaler,
  divide_scaler,
  sin,
  cos,
  pow,
  add_vector2,
  sub_vector2,
  scale_vector2,
  distance,
  rotate_vector2,
  lerp_scaler,
  lerp_vector2,
  lerp_transform,
  lerp_color,

  get_object,
  set_transform,
  set_fill,
  set_stroke,
  set_viewbox,
  clone_object,

  create_object_group,
  create_object_rect,
  create_object_ellipse,
  create_object_path,

  make_path_m,
  make_path_l,
  make_path_q,
  make_path_t,
  make_path_c,
  make_path_s,
  make_path_z,

  not,
  equal,
  greater_than,
  greater_than_or_equal,
  less_than,
  less_than_or_equal,
  switch_scaler,
  switch_vector2,
  switch_transform,
  switch_object,
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
      { label: 'Color', type: 'color' },
      { label: 'Make Color', type: 'make_color' },
      { label: 'Break Color', type: 'break_color' },
    ],
  },
  {
    label: 'Math',
    children: [
      { label: '(+) Number', type: 'add_scaler' },
      { label: '(-) Number', type: 'sub_scaler' },
      { label: '(x) Number', type: 'multi_scaler' },
      { label: '(/) Number', type: 'divide_scaler' },
      { label: 'Sin', type: 'sin' },
      { label: 'Cos', type: 'cos' },
      { label: 'Pow', type: 'pow' },
      { label: '(+) Vector2', type: 'add_vector2' },
      { label: '(-) Vector2', type: 'sub_vector2' },
      { label: 'Scale Vector2', type: 'scale_vector2' },
      { label: 'Distance', type: 'distance' },
      { label: 'Rotate Vector2', type: 'rotate_vector2' },
      { label: 'Lerp Number', type: 'lerp_scaler' },
      { label: 'Lerp Vector2', type: 'lerp_vector2' },
      { label: 'Lerp Transform', type: 'lerp_transform' },
      { label: 'Lerp Color', type: 'lerp_color' },
    ],
  },
  {
    label: 'Boolean',
    children: [
      { label: 'Not', type: 'not' },
      { label: '(=) Number', type: 'equal' },
      { label: '(>) Number', type: 'greater_than' },
      { label: '(>=) Number', type: 'greater_than_or_equal' },
      { label: '(<) Number', type: 'less_than' },
      { label: '(<=) Number', type: 'less_than_or_equal' },
      { label: 'Switch Number', type: 'switch_scaler' },
      { label: 'Switch Vector2', type: 'switch_vector2' },
      { label: 'Switch Transform', type: 'switch_transform' },
      { label: 'Switch Object', type: 'switch_object' },
    ],
  },
  {
    label: 'Object',
    children: [
      { label: 'Get Object', type: 'get_object' },
      { label: 'Set Transform', type: 'set_transform' },
      { label: 'Set Fill', type: 'set_fill' },
      { label: 'Set Stroke', type: 'set_stroke' },
      { label: 'Set Viewbox', type: 'set_viewbox' },
      { label: 'Clone Object', type: 'clone_object' },
    ],
  },
  {
    label: 'Create',
    children: [
      { label: 'Group', type: 'create_object_group' },
      { label: 'Rect', type: 'create_object_rect' },
      { label: 'Ellipse', type: 'create_object_ellipse' },
      { label: 'Path', type: 'create_object_path' },
    ],
  },
  {
    label: 'Make Path',
    children: [
      { label: 'M (Move)', type: 'make_path_m' },
      { label: 'L (Line)', type: 'make_path_l' },
      { label: 'Q (Bezier2)', type: 'make_path_q' },
      { label: 'T (Bezier2)', type: 'make_path_t' },
      { label: 'C (Bezier3)', type: 'make_path_c' },
      { label: 'S (Bezier3)', type: 'make_path_s' },
      { label: 'Z (Close)', type: 'make_path_z' },
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

export function duplicateNodes(
  targetNodeMap: IdMap<GraphNode>,
  getId: (src: { id: string }) => string = (src) => src.id
): IdMap<GraphNode> {
  return immigrateNodes(mapReduce(targetNodeMap, getId), targetNodeMap)
}

function immigrateNodes(
  duplicatedIdMap: IdMap<string>,
  nodeMap: IdMap<GraphNode>
): IdMap<GraphNode> {
  return Object.entries(nodeMap).reduce<IdMap<GraphNode>>((p, [id, node]) => {
    p[duplicatedIdMap[id]] = {
      ...node,
      id: duplicatedIdMap[id],
      inputs: immigrateInputs(duplicatedIdMap, node.inputs),
    }
    return p
  }, {})
}

function immigrateInputs(
  duplicatedIdMap: IdMap<string>,
  inputs: GraphNodeInputs
): GraphNodeInputs {
  return mapReduce(inputs, (input) => {
    if (!input.from) return input
    if (!duplicatedIdMap[input.from.id]) return input
    return {
      ...input,
      from: {
        id: duplicatedIdMap[input.from.id],
        key: input.from.key,
      },
    }
  })
}
