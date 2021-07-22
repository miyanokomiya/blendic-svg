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
  GraphNodeInput,
  GraphNodeInputs,
  GraphNodeMap,
  GraphNodeOutputMap,
  GraphNodeOutputValues,
  GraphNodes,
  GraphNodeType,
  GRAPH_VALUE_TYPE,
  GRAPH_VALUE_TYPE_KEY,
  ValueType,
} from '/@/models/graphNode'
import {
  NodeModule,
  NodeContext,
  EdgeChainGroupItem,
  isSameValueType,
  getGenericsChainAtFn,
} from '/@/utils/graphNodes/core'
import { v4 } from 'uuid'
import * as get_frame from './nodes/getFrame'
import * as scaler from './nodes/scaler'
import * as make_vector2 from './nodes/makeVector2'
import * as break_vector2 from './nodes/breakVector2'
import * as make_transform from './nodes/makeTransform'
import * as color from './nodes/color'
import * as make_color from './nodes/makeColor'
import * as break_color from './nodes/breakColor'

import * as add_generics from './nodes/addGenerics'
import * as sub_generics from './nodes/subGenerics'
import * as multi_scaler from './nodes/multiScaler'
import * as divide_scaler from './nodes/divideScaler'
import * as sin from './nodes/sin'
import * as cos from './nodes/cos'
import * as polar_coord from './nodes/polarCoord'
import * as invert_polar_coord from './nodes/invertPolarCoord'
import * as pow from './nodes/pow'
import * as scale_vector2 from './nodes/scaleVector2'
import * as distance from './nodes/distance'
import * as rotate_vector2 from './nodes/rotateVector2'
import * as lerp_generics from './nodes/lerpGenerics'
import * as clamp from './nodes/clamp'
import * as round_trip from './nodes/roundTrip'

import * as get_object from './nodes/getObject'

import * as set_transform from './nodes/setTransform'
import * as set_fill from './nodes/setFill'
import * as set_stroke from './nodes/setStroke'
import * as set_stroke_length from './nodes/setStrokeLength'
import * as set_gradient from './nodes/setGradient'
import * as set_viewbox from './nodes/setViewbox'
import * as hide_object from './nodes/hideObject'

import * as clone_object from './nodes/cloneObject'
import * as circle_clone_object from './nodes/circleCloneObject'
import * as grid_clone_object from './nodes/gridCloneObject'
import * as tornado_clone_object from './nodes/tornadoCloneObject'

import * as create_object_group from './nodes/createObjectGroup'
import * as create_object_rect from './nodes/createObjectRect'
import * as create_object_ellipse from './nodes/createObjectEllipse'
import * as create_object_text from './nodes/createObjectText'
import * as create_object_path from './nodes/createObjectPath'
import * as create_linear_gradient from './nodes/createLinearGradient'
import * as create_radial_gradient from './nodes/createRadialGradient'
import * as make_stop from './nodes/makeStop'

import * as make_path_m from './nodes/makePathM'
import * as make_path_l from './nodes/makePathL'
import * as make_path_h from './nodes/makePathH'
import * as make_path_v from './nodes/makePathV'
import * as make_path_q from './nodes/makePathQ'
import * as make_path_t from './nodes/makePathT'
import * as make_path_c from './nodes/makePathC'
import * as make_path_s from './nodes/makePathS'
import * as make_path_a from './nodes/makePathA'
import * as make_path_z from './nodes/makePathZ'

import * as greater_than from './nodes/greaterThan'
import * as greater_than_or_equal from './nodes/greaterThanOrEqual'
import * as less_than from './nodes/lessThan'
import * as less_than_or_equal from './nodes/lessThanOrEqual'
import * as between from './nodes/between'
import * as not from './nodes/not'
import * as and from './nodes/and'
import * as or from './nodes/or'
import * as equal_generics from './nodes/equalGenerics'
import * as switch_generics from './nodes/switch_generics'
import { IdMap } from '/@/models'
import { extractMap, mapReduce, toList } from '/@/utils/commons'

const NODE_MODULES: { [key in GraphNodeType]: NodeModule<any> } = {
  get_frame,
  scaler,
  make_vector2,
  break_vector2,
  make_transform,
  color,
  make_color,
  break_color,

  add_generics,
  sub_generics,
  multi_scaler,
  divide_scaler,
  sin,
  cos,
  polar_coord,
  invert_polar_coord,
  pow,
  scale_vector2,
  distance,
  rotate_vector2,
  lerp_generics,
  clamp,
  round_trip,

  get_object,
  set_transform,
  set_fill,
  set_stroke,
  set_stroke_length,
  set_gradient,
  set_viewbox,
  hide_object,

  clone_object,
  circle_clone_object,
  grid_clone_object,
  tornado_clone_object,

  create_object_group,
  create_object_rect,
  create_object_ellipse,
  create_object_text,
  create_object_path,
  create_linear_gradient,
  create_radial_gradient,
  make_stop,

  make_path_m,
  make_path_l,
  make_path_h,
  make_path_v,
  make_path_q,
  make_path_t,
  make_path_c,
  make_path_s,
  make_path_a,
  make_path_z,

  not,
  and,
  or,
  equal_generics,
  greater_than,
  greater_than_or_equal,
  less_than,
  less_than_or_equal,
  between,
  switch_generics,
} as const

interface NodeMenuOption {
  label: string
  type: GraphNodeType
}

interface NODE_MENU_OPTION {
  label: string
  children: NodeMenuOption[]
}

const MAKE_PATH_SRC: NODE_MENU_OPTION = {
  label: 'Make Path',
  children: [
    { label: 'M (Move)', type: 'make_path_m' },
    { label: 'L (Line)', type: 'make_path_l' },
    { label: 'H (Horizon)', type: 'make_path_h' },
    { label: 'V (Vertical)', type: 'make_path_v' },
    { label: 'Q (Bezier2)', type: 'make_path_q' },
    { label: 'T (Bezier2)', type: 'make_path_t' },
    { label: 'C (Bezier3)', type: 'make_path_c' },
    { label: 'S (Bezier3)', type: 'make_path_s' },
    { label: 'A (Arc)', type: 'make_path_a' },
    { label: 'Z (Close)', type: 'make_path_z' },
  ],
}

export const NODE_MENU_OPTIONS_SRC: NODE_MENU_OPTION[] = [
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
      { label: '(+)', type: 'add_generics' },
      { label: '(-)', type: 'sub_generics' },
      { label: '(x) Number', type: 'multi_scaler' },
      { label: '(/) Number', type: 'divide_scaler' },
      { label: 'Sin', type: 'sin' },
      { label: 'Cos', type: 'cos' },
      { label: 'Polar Coord', type: 'polar_coord' },
      { label: 'Invert Polar Coord', type: 'invert_polar_coord' },
      { label: 'Pow', type: 'pow' },
      { label: 'Scale Vector2', type: 'scale_vector2' },
      { label: 'Distance', type: 'distance' },
      { label: 'Rotate Vector2', type: 'rotate_vector2' },
      { label: 'Lerp', type: 'lerp_generics' },
      { label: 'Clamp', type: 'clamp' },
      { label: 'Round Trip', type: 'round_trip' },
    ],
  },
  {
    label: 'Boolean',
    children: [
      { label: 'Not', type: 'not' },
      { label: 'And', type: 'and' },
      { label: 'Or', type: 'or' },
      { label: '(=)', type: 'equal_generics' },
      { label: '(>) Number', type: 'greater_than' },
      { label: '(>=) Number', type: 'greater_than_or_equal' },
      { label: '(<) Number', type: 'less_than' },
      { label: '(<=) Number', type: 'less_than_or_equal' },
      { label: 'Between', type: 'between' },
      { label: 'Switch', type: 'switch_generics' },
    ],
  },
  {
    label: 'Object',
    children: [
      { label: 'Get Object', type: 'get_object' },

      { label: 'Set Transform', type: 'set_transform' },
      { label: 'Set Fill', type: 'set_fill' },
      { label: 'Set Stroke', type: 'set_stroke' },
      { label: 'Set Stroke Length', type: 'set_stroke_length' },
      { label: 'Set Gradient', type: 'set_gradient' },
      { label: 'Set Viewbox', type: 'set_viewbox' },
      { label: 'Hide Object', type: 'hide_object' },

      { label: 'Clone Object', type: 'clone_object' },
      { label: 'Circle Clone Object', type: 'circle_clone_object' },
      { label: 'Grid Clone Object', type: 'grid_clone_object' },
      { label: 'Tornado Clone Object', type: 'tornado_clone_object' },
    ],
  },
  {
    label: 'Create',
    children: [
      { label: 'Group', type: 'create_object_group' },
      { label: 'Rect', type: 'create_object_rect' },
      { label: 'Ellipse', type: 'create_object_ellipse' },
      { label: 'Text', type: 'create_object_text' },
      { label: 'Path', type: 'create_object_path' },
      { label: 'Linear Gradient', type: 'create_linear_gradient' },
      { label: 'Radial Gradient', type: 'create_radial_gradient' },
      { label: 'Stop', type: 'make_stop' },
    ],
  },
  MAKE_PATH_SRC,
]

type NodeSuggestionMenuOptionSrc = { key: string } & NodeMenuOption

const ADD_GENERICS_SUGGESTION: NodeSuggestionMenuOptionSrc = {
  label: '(+)',
  type: 'add_generics',
  key: 'a',
}
const SUB_GENERICS_SUGGESTION: NodeSuggestionMenuOptionSrc = {
  label: '(-)',
  type: 'sub_generics',
  key: 'a',
}
const LERP_GENERICS_SUGGESTION: NodeSuggestionMenuOptionSrc = {
  label: 'Lerp',
  type: 'lerp_generics',
  key: 'a',
}
const EQUAL_GENERICS_SUGGESTION: NodeSuggestionMenuOptionSrc = {
  label: '(=)',
  type: 'equal_generics',
  key: 'a',
}
const GENERICS_SUGGESTIONS: NodeSuggestionMenuOptionSrc[] = [
  { label: 'Switch', type: 'switch_generics', key: 'if_true' },
]

export const NODE_SUGGESTION_MENU_OPTIONS_SRC: {
  [key in GRAPH_VALUE_TYPE_KEY]: NodeSuggestionMenuOptionSrc[]
} = {
  BOOLEAN: [
    { label: 'Not', type: 'not', key: 'condition' },
    { label: 'And', type: 'and', key: 'a' },
    { label: 'Or', type: 'or', key: 'a' },
    EQUAL_GENERICS_SUGGESTION,
    { label: 'Switch Condition', type: 'switch_generics', key: 'condition' },
    ...GENERICS_SUGGESTIONS,
  ],
  SCALER: [
    ADD_GENERICS_SUGGESTION,
    SUB_GENERICS_SUGGESTION,
    { label: '(x)', type: 'multi_scaler', key: 'a' },
    { label: '(/)', type: 'divide_scaler', key: 'a' },
    { label: 'Sin', type: 'sin', key: 'rotate' },
    { label: 'Cos', type: 'cos', key: 'rotate' },
    { label: 'Pow', type: 'pow', key: 'x' },
    EQUAL_GENERICS_SUGGESTION,
    { label: '(>) Number', type: 'greater_than', key: 'a' },
    { label: '(>=) Number', type: 'greater_than_or_equal', key: 'a' },
    { label: '(<) Number', type: 'less_than', key: 'a' },
    { label: '(<=) Number', type: 'less_than_or_equal', key: 'a' },
    { label: 'Between', type: 'between', key: 'number' },
    { label: 'Make Vector2', type: 'make_vector2', key: 'x' },
    { label: 'Make Transform', type: 'make_transform', key: 'rotate' },
    { label: 'Make Color', type: 'make_color', key: 'h' },
    { label: 'Polar Coord', type: 'polar_coord', key: 'rotate' },
    { label: 'Clamp', type: 'clamp', key: 'number' },
    { label: 'Round Trip', type: 'round_trip', key: 'number' },
    LERP_GENERICS_SUGGESTION,
    ...GENERICS_SUGGESTIONS,
  ],
  VECTOR2: [
    ADD_GENERICS_SUGGESTION,
    SUB_GENERICS_SUGGESTION,
    { label: 'Scale Vector2', type: 'scale_vector2', key: 'vector2' },
    { label: 'Distance', type: 'distance', key: 'a' },
    { label: 'Rotate Vector2', type: 'rotate_vector2', key: 'vector2' },
    { label: 'Break Vector2', type: 'break_vector2', key: 'vector2' },
    { label: 'Invert Polar Coord', type: 'invert_polar_coord', key: 'vector2' },
    { label: 'Make Transform', type: 'make_transform', key: 'translate' },
    EQUAL_GENERICS_SUGGESTION,
    LERP_GENERICS_SUGGESTION,
    ...GENERICS_SUGGESTIONS,
  ],
  OBJECT: [
    { label: 'Set Transform', type: 'set_transform', key: 'object' },
    { label: 'Set Fill', type: 'set_fill', key: 'object' },
    { label: 'Set Stroke', type: 'set_stroke', key: 'object' },
    { label: 'Set Stroke Length', type: 'set_stroke_length', key: 'object' },
    { label: 'Set Gradient', type: 'set_gradient', key: 'object' },
    { label: 'Set Viewbox', type: 'set_viewbox', key: 'object' },
    { label: 'Hide Object', type: 'hide_object', key: 'object' },

    { label: 'Clone Object', type: 'clone_object', key: 'object' },
    {
      label: 'Circle Clone Object',
      type: 'circle_clone_object',
      key: 'object',
    },
    { label: 'Grid Clone Object', type: 'grid_clone_object', key: 'object' },
    {
      label: 'Tornado Clone Object',
      type: 'tornado_clone_object',
      key: 'object',
    },
    EQUAL_GENERICS_SUGGESTION,
    ...GENERICS_SUGGESTIONS,
  ],
  TRANSFORM: [
    ADD_GENERICS_SUGGESTION,
    SUB_GENERICS_SUGGESTION,
    LERP_GENERICS_SUGGESTION,
    ...GENERICS_SUGGESTIONS,
  ],
  COLOR: [
    { label: 'Break Color', type: 'break_color', key: 'color' },
    ADD_GENERICS_SUGGESTION,
    LERP_GENERICS_SUGGESTION,
    ...GENERICS_SUGGESTIONS,
  ],
  TEXT: [
    { label: 'Text', type: 'create_object_text', key: 'text' },
    ADD_GENERICS_SUGGESTION,
    EQUAL_GENERICS_SUGGESTION,
    ...GENERICS_SUGGESTIONS,
  ],
  D: [
    ...MAKE_PATH_SRC.children.map((c) => ({ ...c, key: 'd' })),
    { label: 'Create Path', type: 'create_object_path', key: 'd' },
    ADD_GENERICS_SUGGESTION,
    ...GENERICS_SUGGESTIONS,
  ],
  STOP: [
    { label: 'Gradient Stop', type: 'make_stop', key: 'stop' },
    { label: 'Linear Gradient', type: 'create_linear_gradient', key: 'stop' },
    { label: 'Radial Gradient', type: 'create_radial_gradient', key: 'stop' },
  ],
  GENERICS: [
    ADD_GENERICS_SUGGESTION,
    SUB_GENERICS_SUGGESTION,
    LERP_GENERICS_SUGGESTION,
    ...GENERICS_SUGGESTIONS,
  ],
}

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
    return {
      ...p,
      ...resolveNode<T>(context, nodeMap, p, id, {}),
    }
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
    return outputMap
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

export function getAllCircularRefIds(nodeMap: GraphNodeMap): IdMap<true> {
  const map: IdMap<true> = {}
  const setCircularRefIds = (ids: string[]) => {
    ids.forEach((id) => {
      map[id] = true
    })
  }
  Object.keys(nodeMap).reduce<IdMap<true>>((p, id) => {
    if (p[id]) return p
    return {
      ...p,
      ...getCircularRefIds(nodeMap, p, id, {}, setCircularRefIds),
    }
  }, {})

  return map
}

function getCircularRefIds(
  nodeMap: GraphNodeMap,
  doneMap: IdMap<true>,
  targetId: string,
  currentPathMap: { [id: string]: true } = {},
  setCircularRefIds?: (ids: string[]) => void
): IdMap<true> {
  if (doneMap[targetId]) return doneMap
  if (currentPathMap[targetId]) {
    setCircularRefIds?.(Object.keys(currentPathMap))
    return doneMap
  }

  const target = nodeMap[targetId]
  if (!target) return doneMap

  const nextPathMap: { [id: string]: true } = {
    ...currentPathMap,
    [targetId]: true,
  }

  const fromOutputMap = getInputFromIds(target.inputs ?? {}).reduce((p, id) => {
    return getCircularRefIds(nodeMap, p, id, nextPathMap, setCircularRefIds)
  }, doneMap)

  return { ...fromOutputMap, [targetId]: true }
}

export function compute<T>(
  context: NodeContext<T>,
  outputMap: GraphNodeOutputMap,
  target: GraphNode
): GraphNodeOutputValues {
  const struct = getGraphNodeModule(target.type).struct
  const inputs = getInputs(outputMap, target.inputs)
  return struct.computation(
    mapReduce(inputs, (val, key) => {
      if (val !== undefined) return val
      // use default value if the input may have an invalid connection
      return (struct.inputs as any)[key].default
    }),
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
  if (
    from &&
    outputMap[from.id] &&
    outputMap[from.id][from.key] !== undefined
  ) {
    return getOutput(outputMap, from.id, from.key)
  }

  return inputs[key].value
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
  arg: Partial<Omit<GraphNodes[T], 'inputs'>> & {
    inputs?: Partial<GraphNodes[T]['inputs']>
  } = {},
  generateId = false
): GraphNodes[T] {
  // enable to override partial inputs
  const { inputs, ...others } = arg
  const node = NODE_MODULES[type].struct.create(others)
  if (inputs) {
    node.inputs = { ...node.inputs, ...arg.inputs }
  }
  if (generateId) {
    node.id = v4()
  }
  return node
}

export function validateConnection(
  from: {
    node: GraphNode
    key: string
  },
  to: {
    node: GraphNode
    key: string
  }
): boolean {
  return canConnectValueType(
    getInputType(to.node, to.key),
    getOutputType(from.node, from.key)
  )
}

function canConnectValueType(a: ValueType, b: ValueType): boolean {
  if (a.type === 'GENERICS' || b.type === 'GENERICS') return true
  return isSameValueType(a, b)
}

export function resetInput(node: GraphNode, key: string): GraphNode {
  const current = node.inputs[key]
  const struct = getGraphNodeModule<any>(node.type).struct

  const nextInput: GraphNodeInput<any> = { value: struct.inputs[key].default }

  // keep generics if it is confirmed
  if (current.genericsType) {
    nextInput.genericsType = current.genericsType
  }

  const updated: GraphNode = {
    ...node,
    inputs: { ...node.inputs, [key]: nextInput },
  }

  return updated
}

export function duplicateNodes(
  targetNodeMap: GraphNodeMap,
  currentNodeMap: GraphNodeMap = {},
  getId: (src: { id: string }) => string = (src) => src.id
): IdMap<GraphNode> {
  const duplicatedMap = immigrateNodes(
    mapReduce(targetNodeMap, getId),
    targetNodeMap
  )
  const updatedMap = cleanAllEdgeGenerics({
    ...currentNodeMap,
    ...duplicatedMap,
  })
  return { ...duplicatedMap, ...updatedMap }
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

function getInputDefaultValue(type: GraphNodeType, key: string): unknown {
  return (getGraphNodeModule(type).struct.inputs as any)[key].default
}

export function deleteAndDisconnectNodes(
  nodes: GraphNode[],
  targetIds: IdMap<boolean>
): { nodes: GraphNode[]; updatedIds: IdMap<boolean> } {
  const updatedIds: IdMap<boolean> = {}

  const nextNodes = nodes
    .filter((n) => !targetIds[n.id])
    .map((n) => {
      return {
        ...n,
        inputs: mapReduce(n.inputs, (input, key) => {
          // check a node is connected with deleted nodes
          if (!input.from) return input
          if (!targetIds[input.from.id]) return input

          // delete this connection
          updatedIds[n.id] = true
          return { value: getInputDefaultValue(n.type, key) }
        }),
      }
    })

  return { nodes: nextNodes, updatedIds }
}

export function getNodeEdgeTypes(target: GraphNode): {
  inputs: { [key: string]: ValueType }
  outputs: { [key: string]: ValueType }
} {
  return { inputs: getInputTypes(target), outputs: getOutputTypes(target) }
}

// this function do connect only and does not resolve generics
// => use getAllEdgeConnectionInfo to resolve its
export function updateInputConnection(
  fromInfo: {
    node: GraphNode
    key: string
  },
  toInfo: {
    node: GraphNode
    key: string
  }
): GraphNode | undefined {
  // ignore if the two node are the same
  if (fromInfo.node.id === toInfo.node.id) return

  // ignore if the node is not updated
  const currentInput = toInfo.node.inputs[toInfo.key]
  if (
    currentInput.from?.id === fromInfo.node.id &&
    currentInput.from?.key === fromInfo.key
  )
    return

  const input: GraphNodeInput<any> = {
    from: { id: fromInfo.node.id, key: fromInfo.key },
  }

  const updated: GraphNode = {
    ...toInfo.node,
    inputs: {
      ...toInfo.node.inputs,
      [toInfo.key]: input,
    },
  }

  return updated
}

interface EdgeConnectionInfo {
  inputs: {
    [key: string]: { id: string; key: string }
  }
  outputs: {
    [key: string]: { id: string; key: string }[]
  }
}
type AllEdgeConnectionInfo = IdMap<EdgeConnectionInfo>

export function getAllEdgeConnectionInfo(
  nodeMap: GraphNodeMap
): AllEdgeConnectionInfo {
  const ret: AllEdgeConnectionInfo = {}

  Object.entries(nodeMap).forEach(([id, node]) => {
    ret[id] ??= { inputs: {}, outputs: {} }
    Object.entries(node.inputs).forEach(([key, input]) => {
      if (!input.from) return

      // save input info
      ret[id].inputs[key] = input.from

      // save output info
      ret[input.from.id] ??= { inputs: {}, outputs: {} }
      ret[input.from.id].outputs[input.from.key] ??= []
      ret[input.from.id].outputs[input.from.key].push({ id, key })
    })
  })

  return ret
}

function isGenericsResolved(genericsType?: ValueType): boolean {
  return !!genericsType && genericsType.type !== GRAPH_VALUE_TYPE.GENERICS
}

function getInputType(target: GraphNode, key: string): ValueType {
  return (
    target.inputs[key].genericsType ??
    getGraphNodeModule<any>(target.type).struct.inputs[key].type
  )
}
function getInputTypes(target: GraphNode): { [key: string]: ValueType } {
  const struct = getGraphNodeModule<any>(target.type).struct
  return mapReduce(target.inputs, (_, key) => {
    return target.inputs[key].genericsType ?? struct.inputs[key].type
  })
}

function getInputOriginalType(type: GraphNodeType, key: string): ValueType {
  const struct = getGraphNodeModule<any>(type).struct
  return struct.inputs[key].type
}

export function getOutputType(target: GraphNode, key: string): ValueType {
  const struct = getGraphNodeModule(target.type).struct
  return struct.getOutputType?.(target, key) ?? struct.outputs[key]
}
function getOutputTypes(target: GraphNode): { [key: string]: ValueType } {
  const struct = getGraphNodeModule(target.type).struct
  return mapReduce(struct.outputs, (_, key) => {
    return struct.getOutputType?.(target, key) ?? struct.outputs[key]
  })
}

export function getEdgeChainGroupAt(
  nodeMap: GraphNodeMap,
  allEdgeConnectionInfo: AllEdgeConnectionInfo,
  item: EdgeChainGroupItem
): EdgeChainGroupItem[] {
  const doneItemMap: IdMap<{
    inputs: { [key: string]: true }
    outputs: { [key: string]: true }
  }> = {}

  const saveDoneItem = (item: EdgeChainGroupItem) => {
    doneItemMap[item.id] ??= { inputs: {}, outputs: {} }
    if (item.output) {
      doneItemMap[item.id].outputs[item.key] = true
    } else {
      doneItemMap[item.id].inputs[item.key] = true
    }
  }

  const isDoneItem = (item: EdgeChainGroupItem) => {
    if (item.output) {
      return !!doneItemMap[item.id]?.outputs[item.key]
    } else {
      return !!doneItemMap[item.id]?.inputs[item.key]
    }
  }

  return _getEdgeChainGroupAt(nodeMap, allEdgeConnectionInfo, item, {
    saveDoneItem,
    isDoneItem,
  })
}

function _getEdgeChainGroupAt(
  nodeMap: GraphNodeMap,
  allEdgeConnectionInfo: AllEdgeConnectionInfo,
  item: EdgeChainGroupItem,
  context: {
    saveDoneItem: (item: EdgeChainGroupItem) => void
    isDoneItem: (item: EdgeChainGroupItem) => boolean
  }
): EdgeChainGroupItem[] {
  const target = nodeMap[item.id]
  if (!target) return []

  if (context.isDoneItem(item)) return []

  const struct = getGraphNodeModule(target.type).struct
  const group = getGenericsChainAtFn(target.id, struct.genericsChains ?? [])(
    item.key,
    item.output
  ) ?? [
    // this edge has fixed type
    {
      ...item,
      type: item.output
        ? getOutputType(target, item.key)
        : getInputType(target, item.key),
    },
  ]
  group.forEach(context.saveDoneItem)

  const inputsInfo = allEdgeConnectionInfo[target.id].inputs
  const outputsInfo = allEdgeConnectionInfo[target.id].outputs

  return [
    ...group,
    ...group.flatMap((i) => {
      const nextItems: EdgeChainGroupItem[] = []

      if (i.output) {
        const info = outputsInfo[i.key]
        if (info) {
          info.forEach((info) => {
            nextItems.push({ id: info.id, key: info.key })
          })
        }
      } else {
        const info = inputsInfo[i.key]
        if (info) {
          nextItems.push({ id: info.id, key: info.key, output: true })
        }
      }

      return nextItems
        .filter((nextItem) => !context.isDoneItem(nextItem))
        .flatMap((nextItem) => {
          return _getEdgeChainGroupAt(
            nodeMap,
            allEdgeConnectionInfo,
            nextItem,
            context
          )
        })
    }),
  ]
}

function findNotResolvedGenericsType(
  group: EdgeChainGroupItem[]
): ValueType | undefined {
  return group.find((item) => isGenericsResolved(item.type))?.type
}

export function cleanEdgeGenericsGroupAt(
  nodeMap: GraphNodeMap,
  item: EdgeChainGroupItem
): GraphNodeMap {
  const allEdgeConnectionInfo = getAllEdgeConnectionInfo(nodeMap)
  const group = getEdgeChainGroupAt(nodeMap, allEdgeConnectionInfo, item)
  const type = findNotResolvedGenericsType(group)
  return cleanEdgeGenericsGroupByType(nodeMap, group, type)
}

function cleanEdgeGenericsGroupByType(
  nodeMap: GraphNodeMap,
  group: EdgeChainGroupItem[],
  type: ValueType | undefined
): GraphNodeMap {
  const ret: GraphNodeMap = {}

  group
    .filter((item) => !item.output)
    .forEach((item) => {
      const node = ret[item.id] ?? nodeMap[item.id]
      if (!node) return

      if (
        getInputOriginalType(node.type, item.key).type !==
        GRAPH_VALUE_TYPE.GENERICS
      )
        return

      const input = node.inputs[item.key]
      if (isSameValueType(input.genericsType, type)) return

      ret[item.id] = {
        ...node,
        inputs: {
          ...node.inputs,
          [item.key]: { ...input, genericsType: type },
        },
      }
    })

  return ret
}

export function cleanAllEdgeGenerics(nodeMap: GraphNodeMap): GraphNodeMap {
  const allEdgeConnectionInfo = getAllEdgeConnectionInfo(nodeMap)

  const doneMap: IdMap<{
    inputs: {
      [key: string]: true
    }
    outputs: {
      [key: string]: true
    }
  }> = {}

  const updatedIdMap: IdMap<true> = {}

  const nextMap = toList(nodeMap).reduce((p, target) => {
    const struct = getGraphNodeModule(target.type).struct
    if (!struct.genericsChains) return p

    const chains = struct.genericsChains
    return chains
      .filter((c) => c.length > 0)
      .reduce((q, c) => {
        const item = { ...c[0], id: target.id }

        // ignore if this chain has been done
        if (item.output && !!doneMap[target.id]?.outputs[item.key]) return q
        if (doneMap[target.id]?.inputs[item.key]) return q

        const group = getEdgeChainGroupAt(q, allEdgeConnectionInfo, item)

        group.forEach((c) => {
          doneMap[c.id] ??= { inputs: {}, outputs: {} }
          if (c.output) {
            doneMap[c.id].outputs[c.key] = true
          } else {
            doneMap[c.id].inputs[c.key] = true
          }
        })

        const type = findNotResolvedGenericsType(group)
        const updated = cleanEdgeGenericsGroupByType(q, group, type)
        toList(updated).forEach((n) => (updatedIdMap[n.id] = true))
        return { ...q, ...updated }
      }, p)
  }, nodeMap)

  return extractMap(nextMap, updatedIdMap)
}

export function getNodeErrors(nodeMap: GraphNodeMap): IdMap<string[]> {
  const circularRefIds = getAllCircularRefIds(nodeMap)

  return toList(nodeMap).reduce<IdMap<string[]>>((p, node) => {
    const errors = [
      ...(getGraphNodeModule<any>(node.type).struct.getErrors?.(node) ?? []),
      ...(circularRefIds[node.id] ? ['circular connection is found'] : []),
    ]

    if (errors.length > 0) {
      p[node.id] = errors
    }

    return p
  }, {})
}

export function getUpdatedNodeMapToDisconnectNodeInput(
  nodeMap: GraphNodeMap,
  nodeId: string,
  inputKey: string
): GraphNodeMap {
  const node = nodeMap[nodeId]

  const updated = resetInput(node, inputKey)
  const currentInput = node.inputs[inputKey]

  // clean generics
  const updatedMapByDisconnectInput = cleanEdgeGenericsGroupAt(
    { ...nodeMap, [updated.id]: updated },
    { id: updated.id, key: inputKey }
  )
  const updatedMapByDisconnectOutput = currentInput?.from
    ? cleanEdgeGenericsGroupAt(
        {
          ...nodeMap,
          [updated.id]: updated,
          ...updatedMapByDisconnectInput,
        },
        { id: currentInput.from.id, key: currentInput.from.key, output: true }
      )
    : {}

  return {
    [node.id]: updated,
    ...updatedMapByDisconnectInput,
    ...updatedMapByDisconnectOutput,
  }
}
