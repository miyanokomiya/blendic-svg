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
  GradientStop,
  GraphEdgeConnection,
  GraphNode,
  GraphNodeBase,
  GraphNodeData,
  GraphNodeInput,
  GraphNodeInputs,
  GraphNodeMap,
  GraphNodeOutputMap,
  GraphNodeOutputValues,
  GraphNodes,
  GraphNodeType,
  GRAPH_VALUE_STRUCT,
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
  UNIT_VALUE_TYPES,
  NodeStruct,
} from '/@/utils/graphNodes/core'
import { generateUuid } from '/@/utils/random'
import * as get_frame from './nodes/getFrame'
import * as scaler from './nodes/scaler'
import * as make_vector2 from './nodes/makeVector2'
import * as break_vector2 from './nodes/breakVector2'
import * as make_transform from './nodes/makeTransform'
import * as break_transform from './nodes/breakTransform'
import * as apply_transform from './nodes/applyTransform'
import * as color from './nodes/color'
import * as make_color from './nodes/makeColor'
import * as break_color from './nodes/breakColor'

import * as add_generics from './nodes/addGenerics'
import * as sub_generics from './nodes/subGenerics'
import * as multi_scaler from './nodes/multiScaler'
import * as divide_scaler from './nodes/divideScaler'
import * as remainder from './nodes/remainder'
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

import * as get_bone from './nodes/getBone'
import * as get_object from './nodes/getObject'
import * as get_child from './nodes/getChild'
import * as get_transform from './nodes/getTransform'

import * as set_transform from './nodes/setTransform'
import * as add_transform from './nodes/addTransform'
import * as set_fill from './nodes/setFill'
import * as set_stroke from './nodes/setStroke'
import * as set_stroke_length from './nodes/setStrokeLength'
import * as set_gradient from './nodes/setGradient'
import * as set_viewbox from './nodes/setViewbox'
import * as hide_object from './nodes/hideObject'

import * as clone_object from './nodes/cloneObject'
import * as group_clone_object from './nodes/groupCloneObject'
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

import * as get_path_length from './nodes/getPathLength'
import * as get_path_point_at from './nodes/getPathPointAt'

import * as transform_path from './nodes/transformPath'
import * as reverse_path from './nodes/reversePath'
import * as join_path from './nodes/joinPath'

import * as create_object_clip_path from './nodes/createObjectClipPath'
import * as set_clip_path from './nodes/setClipPath'

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

import * as reroute from './nodes/reroute'

import * as custom_begin_input from './nodes/customBeginInput'
import * as custom_input from './nodes/customInput'
import * as custom_begin_output from './nodes/customBeginOutput'
import * as custom_output from './nodes/customOutput'

import { getTransform, IdMap, toMap, Transform } from '/@/models'
import {
  extractMap,
  isNotNullish,
  mapFilter,
  mapReduce,
  toList,
} from '/@/utils/commons'
import { IVec2 } from 'okageo'

const NODE_MODULES: { [key in GraphNodeType]: NodeModule<any> } = {
  get_frame,
  scaler,
  make_vector2,
  break_vector2,
  make_transform,
  break_transform,
  apply_transform,
  color,
  make_color,
  break_color,

  add_generics,
  sub_generics,
  multi_scaler,
  divide_scaler,
  remainder,
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

  get_bone,
  get_object,
  get_child,
  get_transform,

  set_transform,
  add_transform,
  set_fill,
  set_stroke,
  set_stroke_length,
  set_gradient,
  set_clip_path,
  set_viewbox,
  hide_object,

  clone_object,
  group_clone_object,
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
  create_object_clip_path,

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
  get_path_length,
  get_path_point_at,
  transform_path,
  reverse_path,
  join_path,

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

  reroute,

  custom_begin_input,
  custom_input,
  custom_begin_output,
  custom_output,
} as const

export interface NodeMenuOption {
  label: string
  type: GraphNodeType
}

export interface NODE_MENU_OPTION {
  label: string
  children: NodeMenuOption[]
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
      { label: 'Break Transform', type: 'break_transform' },
      { label: 'Apply Transform', type: 'apply_transform' },
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
      { label: '(%) Number', type: 'remainder' },
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
      { label: 'Get Bone', type: 'get_bone' },
      { label: 'Get Object', type: 'get_object' },
      { label: 'Get Child', type: 'get_child' },

      { label: 'Clone Object', type: 'clone_object' },
      { label: 'Group Clone Object', type: 'group_clone_object' },
      { label: 'Circle Clone Object', type: 'circle_clone_object' },
      { label: 'Grid Clone Object', type: 'grid_clone_object' },
      { label: 'Tornado Clone Object', type: 'tornado_clone_object' },
    ],
  },
  {
    label: 'Attribute',
    children: [
      { label: 'Hide Object', type: 'hide_object' },
      { label: 'Get Transform', type: 'get_transform' },
      { label: 'Set Transform', type: 'set_transform' },
      { label: 'Add Transform', type: 'add_transform' },
      { label: 'Set Fill', type: 'set_fill' },
      { label: 'Set Stroke', type: 'set_stroke' },
      { label: 'Set Stroke Length', type: 'set_stroke_length' },
      { label: 'Set Gradient', type: 'set_gradient' },
      { label: 'Set Clip Path', type: 'set_clip_path' },
      { label: 'Set Viewbox', type: 'set_viewbox' },
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
      { label: 'Clip Path', type: 'create_object_clip_path' },
    ],
  },
  {
    label: 'Path',
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
      { label: 'Transform Path', type: 'transform_path' },
      { label: 'Reverse Path', type: 'reverse_path' },
      { label: 'Join Path', type: 'join_path' },
      { label: 'Get Path Length', type: 'get_path_length' },
      { label: 'Get Path Point At', type: 'get_path_point_at' },
    ],
  },
  {
    label: 'Etc',
    children: [{ label: 'Reroute', type: 'reroute' }],
  },
]

export function getInsertingNodeSuggestionMenuOptions(
  getGraphNodeModule: GetGraphNodeModule,
  nodeOptions: NODE_MENU_OPTION[],
  inputValueType: ValueType,
  outputValueType: ValueType
): NodeSuggestionMenuOption[] {
  const inputOptions = getNodeSuggestionMenuOptions(
    getGraphNodeModule,
    nodeOptions,
    inputValueType,
    true
  )
  return getNodeSuggestionMenuOptions(
    getGraphNodeModule,
    inputOptions,
    outputValueType
  )
}

export function getNodeSuggestionMenuOptions(
  getGraphNodeModule: GetGraphNodeModule,
  nodeOptions: NodeSuggestionMenuOption[],
  valueType: ValueType,
  forOutput = false
): NodeSuggestionMenuOption[] {
  const isGenericsType = isSameValueType(valueType, UNIT_VALUE_TYPES.GENERICS)

  return nodeOptions
    .map((src) => {
      const items = src.children
        .map<NodeSuggestionMenuOptionSrc | undefined>((item) => {
          const struct = getGraphNodeModule(item.type)?.struct
          if (!struct) return

          // Prioritize the same type rather than generics types
          // When the target type is generics, allow to pick any type with the worst priority
          if (forOutput) {
            const edgeKey =
              findInputKeyByValueType(struct, valueType) ??
              findInputKeyByValueType(struct, UNIT_VALUE_TYPES.GENERICS) ??
              (isGenericsType ? Object.keys(struct.inputs)[0] : undefined)
            return edgeKey ? { ...item, inputKey: edgeKey } : undefined
          } else {
            const edgeKey =
              findOutputKeyByValueType(struct, valueType) ??
              findOutputKeyByValueType(struct, UNIT_VALUE_TYPES.GENERICS) ??
              (isGenericsType ? Object.keys(struct.outputs)[0] : undefined)
            return edgeKey ? { ...item, outputKey: edgeKey } : undefined
          }
        })
        .filter(isNotNullish)

      return items.length > 0
        ? { label: src.label, children: items }
        : undefined
    })
    .filter(isNotNullish)
}

function findOutputKeyByValueType(
  struct: NodeStruct<any>,
  targetType: ValueType
): string | undefined {
  const hit = Object.entries(struct.outputs).find(([, valueType]) =>
    isSameValueType(valueType, targetType)
  )
  return hit ? hit[0] : undefined
}

function findInputKeyByValueType(
  struct: NodeStruct<any>,
  targetType: ValueType
): string | undefined {
  const hit = Object.entries(struct.inputs).find(([, input]) =>
    isSameValueType(input.type, targetType)
  )
  return hit ? hit[0] : undefined
}

type NodeSuggestionMenuOptionSrc = {
  inputKey?: string
  outputKey?: string
} & NodeMenuOption
type NodeSuggestionMenuOption = {
  label: string
  children: NodeSuggestionMenuOptionSrc[]
}

export interface GetGraphNodeModule {
  (type: GraphNodeType): NodeModule<GraphNodes[GraphNodeType]> | undefined
}

export function getGraphNodeModule<T extends GraphNodeType>(
  type: T
): NodeModule<GraphNodes[T]> {
  return NODE_MODULES[type]
}

export function resolveAllNodes<T>(
  getGraphNodeModule: GetGraphNodeModule,
  context: NodeContext<T>,
  nodeMap: GraphNodeMap
): GraphNodeOutputMap {
  return Object.keys(nodeMap).reduce<GraphNodeOutputMap>((p, id) => {
    if (p[id]) return p
    return {
      ...p,
      ...resolveNode<T>(getGraphNodeModule, context, nodeMap, p, id, {}),
    }
  }, {})
}

export function resolveNode<T>(
  getGraphNodeModule: GetGraphNodeModule,
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
    return resolveNode(getGraphNodeModule, context, nodeMap, p, id, nextPathMap)
  }, outputMap)

  return {
    ...fromOutputMap,
    [targetId]: compute<T>(getGraphNodeModule, context, fromOutputMap, target),
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

  const fromOutputMap = getInputFromIds(
    getInputsWithoutLoopStruct(target)
  ).reduce((p, id) => {
    return getCircularRefIds(nodeMap, p, id, nextPathMap, setCircularRefIds)
  }, doneMap)

  return { ...fromOutputMap, [targetId]: true }
}

export function compute<T>(
  getGraphNodeModule: GetGraphNodeModule,
  context: NodeContext<T>,
  outputMap: GraphNodeOutputMap,
  target: GraphNode
): GraphNodeOutputValues {
  const struct = getGraphNodeModule(target.type)?.struct
  if (!struct) return outputMap

  const inputs = getInputs(outputMap, target.inputs)
  return struct.computation(
    mapReduce(inputs, (val, key) => {
      if (val !== undefined) return val
      // use default value if the input may have an invalid connection
      return (struct.inputs as any)[key]?.default
    }),
    target,
    context,
    getGraphNodeModule
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

/**
 * Ignore permitted and intended circular reference
 * e.g. 'output' of custom_input
 */
function getInputsWithoutLoopStruct(target: GraphNode): GraphNodeInputs {
  if (target.type !== 'custom_input') return target.inputs

  const ret = { ...target.inputs }
  delete ret.output
  return ret
}

export function validateAllNodes(
  getGraphNodeModule: GetGraphNodeModule,
  nodeMap: GraphNodeMap
): {
  [id: string]: { [key: string]: boolean }
} {
  return Object.keys(nodeMap).reduce<{
    [id: string]: { [key: string]: boolean }
  }>((p, id) => {
    p[id] = validateNode(getGraphNodeModule, nodeMap, id)
    return p
  }, {})
}

export function validateNode(
  getGraphNodeModule: GetGraphNodeModule,
  nodeMap: GraphNodeMap,
  targetId: string
): {
  [key: string]: boolean
} {
  const target = nodeMap[targetId]
  if (!target) return {}

  const inputStruct = getGraphNodeModule(target.type)?.struct

  return Object.keys(target.inputs).reduce<{
    [key: string]: boolean
  }>((p: any, key) => {
    const input = target.inputs[key]
    if (!input.from) {
      // not connected
      p[key] = true
    } else if (!nodeMap[input.from.id]) {
      // connected but the target not found
      p[key] = false
    } else {
      const outputStruct = getGraphNodeModule(nodeMap[input.from.id].type)
        ?.struct

      if (inputStruct && outputStruct) {
        p[key] = isSameValueType(
          getInputType(inputStruct, target, key),
          getOutputType(outputStruct, nodeMap[input.from.id], input.from.key)
        )
      } else {
        p[key] = false
      }
    }
    return p
  }, {})
}

export function createGraphNodeIncludeCustom<T extends GraphNodeType>(
  customModules: { [key in GraphNodeType]: NodeModule<any> },
  type: T,
  arg: Partial<Omit<GraphNodeBase, 'inputs'>> & {
    inputs?: Partial<GraphNodeBase['inputs']>
  } & { data?: Partial<GraphNodeBase['data']> } = {},
  generateId = false
) {
  return _createGraphNode(
    customModules[type] ? customModules[type] : NODE_MODULES[type],
    arg,
    generateId
  )
}

export function createGraphNode<T extends GraphNodeType>(
  type: T,
  arg: Partial<Omit<GraphNodeBase, 'inputs'>> & {
    inputs?: Partial<GraphNodeBase['inputs']>
  } & { data?: Partial<GraphNodeBase['data']> } = {},
  generateId = false
): GraphNodes[T] {
  return _createGraphNode(NODE_MODULES[type], arg, generateId)
}

function _createGraphNode(
  module: NodeModule<any>,
  arg: Partial<Omit<GraphNodeBase, 'inputs'>> & {
    inputs?: Partial<GraphNodeBase['inputs']>
  } & { data?: Partial<GraphNodeBase['data']> } = {},
  generateId = false
): GraphNodeBase {
  // enable to override partial inputs
  const { inputs, data, ...others } = arg
  const node = module.struct.create(others)
  if (inputs) {
    node.inputs = { ...node.inputs, ...arg.inputs }
  }
  if (data) {
    node.data = { ...node.data, ...arg.data }
  }
  if (generateId) {
    node.id = generateUuid()
  }
  return node
}

export function validateConnection(
  getGraphNodeModule: GetGraphNodeModule,
  from: {
    node: GraphNode
    key: string
  },
  to: {
    node: GraphNode
    key: string
  }
): boolean {
  const toModule = getGraphNodeModule(to.node.type)
  const fromModule = getGraphNodeModule(from.node.type)
  if (!fromModule || !toModule) return false

  return canConnectValueType(
    getInputType(toModule.struct, to.node, to.key),
    getOutputType(fromModule.struct, from.node, from.key)
  )
}

function canConnectValueType(a: ValueType, b: ValueType): boolean {
  if (a.type === 'GENERICS' || b.type === 'GENERICS') return true
  return isSameValueType(a, b)
}

export function resetInput(
  nodeStruct: Pick<NodeStruct<any>, 'inputs'> | undefined,
  node: GraphNode,
  key: string
): GraphNode {
  const current = node.inputs[key]
  const nextInput = resetInputValue(nodeStruct?.inputs[key], current)
  if (!nextInput) {
    const inputs = { ...node.inputs }
    delete inputs[key]
    return { ...node, inputs }
  }

  const updated: GraphNode = {
    ...node,
    inputs: { ...node.inputs, [key]: nextInput },
  }
  return updated
}

export function resetInputValue(
  inputStruct: NodeStruct<any>['inputs']['any'] | undefined,
  current: GraphNodeInput<any> | undefined
): GraphNodeInput<any> | undefined {
  if (!inputStruct) {
    return undefined
  }

  const nextInput: GraphNodeInput<any> =
    inputStruct.type.type === GRAPH_VALUE_TYPE.GENERICS && current?.genericsType
      ? {
          // keep generics if it is confirmed
          genericsType: current.genericsType,
          value: createDefaultValueForGenerics(current.genericsType),
        }
      : { value: inputStruct.default }

  return nextInput
}

export function duplicateNodes(
  getGraphNodeModule: GetGraphNodeModule,
  targetNodeMap: GraphNodeMap,
  currentNodeMap: GraphNodeMap = {},
  getId: (src: { id: string }) => string = (src) => src.id
): IdMap<GraphNode> {
  const duplicatedMap = immigrateNodes(
    mapReduce(targetNodeMap, getId),
    targetNodeMap
  )
  const updatedMap = cleanAllEdgeGenerics(getGraphNodeModule, {
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

export function isUniqueEssentialNodeForCustomGraph(
  type: GraphNodeType
): boolean {
  return type === 'custom_begin_input' || type === 'custom_begin_output'
}

export function isExclusiveNodeForCustomGraph(type: GraphNodeType): boolean {
  return (
    isUniqueEssentialNodeForCustomGraph(type) ||
    type === 'custom_input' ||
    type === 'custom_output'
  )
}

export function deleteAndDisconnectNodes(
  getGraphNodeModule: GetGraphNodeModule,
  nodes: GraphNode[],
  targetIds: IdMap<boolean>
): { nodes: GraphNode[]; updatedIds: IdMap<boolean> } {
  const updatedIds: IdMap<boolean> = {}

  const nextNodes = nodes
    .filter(
      (n) => !targetIds[n.id] || isUniqueEssentialNodeForCustomGraph(n.type)
    )
    .map((n) => {
      return {
        ...n,
        inputs: mapReduce(n.inputs, (input, key) => {
          // check a node is connected with deleted nodes
          if (!input.from) return input
          if (!targetIds[input.from.id]) return input

          // delete this connection
          updatedIds[n.id] = true
          return {
            value:
              getGraphNodeModule(n.type)?.struct.inputs[key].default ??
              undefined,
          }
        }),
      }
    })

  return { nodes: nextNodes, updatedIds }
}

export function isolateNodes(
  getGraphNodeModule: GetGraphNodeModule,
  nodes: GraphNode[]
): { nodes: GraphNode[]; updatedIds: IdMap<boolean> } {
  const idSet = new Set(nodes.map((n) => n.id))
  const updatedIds: IdMap<boolean> = {}

  const nextNodes = nodes.map((n) => {
    const inputs = Object.entries(n.inputs).reduce<GraphNodeInputs>(
      (inputs, [key, input]) => {
        if (!input.from || idSet.has(input.from.id)) {
          inputs[key] = input
          return inputs
        }

        // delete this connection
        updatedIds[n.id] = true
        const nextInput = resetInputValue(
          getGraphNodeModule(n.type)?.struct.inputs[key],
          input
        )
        if (nextInput) {
          inputs[key] = nextInput
        }
        return inputs
      },
      {}
    )
    return { ...n, inputs }
  })

  const updated = cleanAllEdgeGenerics(getGraphNodeModule, toMap(nextNodes))

  return {
    nodes: nextNodes.map((n) => updated[n.id] ?? n),
    updatedIds: { ...updatedIds, ...mapReduce(updated, () => true) },
  }
}

export function getNodeEdgeTypes(
  getGraphNodeModule: GetGraphNodeModule,
  target: GraphNode
): {
  inputs: { [key: string]: ValueType }
  outputs: { [key: string]: ValueType }
} {
  const nodeModule = getGraphNodeModule(target.type)
  return {
    inputs: getInputTypes(nodeModule?.struct, target),
    outputs: getOutputTypes(nodeModule?.struct, target),
  }
}

// this function do connect only and does not resolve generics
// => use "cleanEdgeGenericsGroupAt" to resolve its
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

export function isGenericsResolved(
  genericsType?: ValueType
): genericsType is ValueType {
  return !!genericsType && genericsType.type !== GRAPH_VALUE_TYPE.GENERICS
}

function isGenericsDataField(
  struct: NodeStruct<any> | undefined,
  key: string
): boolean {
  return !!struct && struct.data[key].type.type === GRAPH_VALUE_TYPE.GENERICS
}

export function updateDataField(
  getGraphNodeModule: GetGraphNodeModule,
  nodeType: GraphNodeType,
  key: string,
  old: unknown | GraphNodeData<unknown>,
  nextValue: unknown
): unknown | GraphNodeData<unknown> {
  return isGenericsDataField(getGraphNodeModule(nodeType)?.struct, key)
    ? {
        ...(old as GraphNodeData<unknown>),
        value: nextValue,
      }
    : nextValue
}

export function getDataTypeAndValue(
  getGraphNodeModule: GetGraphNodeModule,
  target: GraphNode,
  key: string
): { type: ValueType; value: unknown } {
  const field = target.data[key] as any
  const struct = getGraphNodeModule(target.type)?.struct
  return isGenericsDataField(struct, key)
    ? {
        type:
          (field.genericsType as ValueType) ??
          struct?.data[key]?.type ??
          UNIT_VALUE_TYPES.UNKNOWN,
        value: field.value,
      }
    : {
        type: struct?.data[key]?.type ?? UNIT_VALUE_TYPES.UNKNOWN,
        value: field,
      }
}

export function getInputType(
  nodeStruct: NodeStruct<any> | undefined,
  target: GraphNode,
  key: string
): ValueType {
  return (
    target.inputs[key].genericsType ??
    nodeStruct?.inputs[key]?.type ??
    UNIT_VALUE_TYPES.UNKNOWN
  )
}

export function getInputTypes(
  nodeStruct: NodeStruct<any> | undefined,
  target: GraphNode
): { [key: string]: ValueType } {
  return mapReduce(target.inputs, (_, key) => {
    return getInputType(nodeStruct, target, key)
  })
}

function getInputOriginalType(
  getGraphNodeModule: GetGraphNodeModule,
  type: GraphNodeType,
  key: string
): ValueType {
  const nodeModule = getGraphNodeModule(type)
  return nodeModule?.struct.inputs[key]?.type ?? UNIT_VALUE_TYPES.UNKNOWN
}

export function getOutputType(
  nodeStruct: NodeStruct<any> | undefined,
  target: GraphNode,
  key: string
): ValueType {
  return (
    nodeStruct?.getOutputType?.(target, key) ??
    nodeStruct?.outputs[key] ??
    UNIT_VALUE_TYPES.UNKNOWN
  )
}

function getOutputTypes(
  nodeStruct: NodeStruct<any> | undefined,
  target: GraphNode
): { [key: string]: ValueType } {
  return nodeStruct
    ? mapReduce(nodeStruct.outputs, (_, key) => {
        return (
          nodeStruct.getOutputType?.(target, key) ?? nodeStruct.outputs[key]
        )
      })
    : {}
}

export function getEdgeChainGroupAt(
  getGraphNodeModule: GetGraphNodeModule,
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

  return _getEdgeChainGroupAt(
    getGraphNodeModule,
    nodeMap,
    allEdgeConnectionInfo,
    item,
    {
      saveDoneItem,
      isDoneItem,
    }
  )
}

function _getEdgeChainGroupAt(
  getGraphNodeModule: GetGraphNodeModule,
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

  const nodeModule = getGraphNodeModule(target.type)
  if (!nodeModule) return []

  const group = getGenericsChainAtFn(
    target.id,
    nodeModule.struct.genericsChains ?? []
  )(item.key, item.output) ?? [
    // this edge has fixed type
    {
      ...item,
      type: item.output
        ? getOutputType(nodeModule.struct, target, item.key)
        : getInputType(nodeModule.struct, target, item.key),
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
            getGraphNodeModule,
            nodeMap,
            allEdgeConnectionInfo,
            nextItem,
            context
          )
        })
    }),
  ]
}

function findResolvedGenericsType(
  group: EdgeChainGroupItem[]
): ValueType | undefined {
  return group.find((item) => isGenericsResolved(item.type))?.type
}

export function cleanEdgeGenericsGroupAt(
  getGraphNodeModule: GetGraphNodeModule,
  nodeMap: GraphNodeMap,
  item: EdgeChainGroupItem
): GraphNodeMap {
  const allEdgeConnectionInfo = getAllEdgeConnectionInfo(nodeMap)
  const group = getEdgeChainGroupAt(
    getGraphNodeModule,
    nodeMap,
    allEdgeConnectionInfo,
    item
  )
  const type = findResolvedGenericsType(group)
  return cleanEdgeGenericsGroupByType(getGraphNodeModule, nodeMap, group, type)
}

function cleanEdgeGenericsGroupByType(
  getGraphNodeModule: GetGraphNodeModule,
  nodeMap: GraphNodeMap,
  group: EdgeChainGroupItem[],
  type: ValueType | undefined
): GraphNodeMap {
  const ret: GraphNodeMap = {}

  group.forEach((item) => {
    if (item.output) return

    const node = ret[item.id] ?? nodeMap[item.id]
    if (!node) return

    if (item.data) {
      if (
        getGraphNodeModule(node.type)?.struct.data[item.key]?.type.type !==
        GRAPH_VALUE_TYPE.GENERICS
      )
        return

      const data = node.data[item.key]
      if (isSameValueType((data as GraphNodeData<unknown>)?.genericsType, type))
        return

      ret[item.id] = {
        ...node,
        data: {
          ...node.data,
          [item.key]: {
            genericsType: type,
            value: createDefaultValueForGenerics(type),
          },
        },
      }
    } else {
      const input = node.inputs[item.key]
      if (!input) return

      const originalType = getInputOriginalType(
        getGraphNodeModule,
        node.type,
        item.key
      ).type

      if (originalType === GRAPH_VALUE_TYPE.GENERICS) {
        if (isSameValueType(input.genericsType, type)) return

        ret[item.id] = {
          ...node,
          inputs: {
            ...node.inputs,
            [item.key]: {
              ...input,
              genericsType: type,
              value: createDefaultValueForGenerics(type),
            },
          },
        }
      } else {
        const inputType = getInputType(
          getGraphNodeModule(node.type)?.struct,
          node,
          item.key
        )
        if (isSameValueType(inputType, type)) return

        ret[item.id] = {
          ...node,
          inputs: {
            ...node.inputs,
            [item.key]: {
              value: createDefaultValueForGenerics(type),
            },
          },
        }
      }
    }
  })

  return ret
}

function createDefaultValueForGenerics(type: ValueType | undefined): unknown {
  if (!type) return undefined

  switch (type.struct) {
    case GRAPH_VALUE_STRUCT.UNIT:
    case GRAPH_VALUE_STRUCT.UNIT_OR_ARRAY:
      return createDefaultUnitValueForGenerics(type.type)
    case GRAPH_VALUE_STRUCT.ARRAY:
      return [createDefaultUnitValueForGenerics(type.type)]
  }
}

export function createDefaultUnitValueForGenerics(
  valueType: GRAPH_VALUE_TYPE_KEY
) {
  switch (valueType) {
    case GRAPH_VALUE_TYPE.SCALER:
      return 0
    case GRAPH_VALUE_TYPE.VECTOR2:
      return { x: 0, y: 0 }
    case GRAPH_VALUE_TYPE.BOOLEAN:
      return false
    case GRAPH_VALUE_TYPE.TRANSFORM:
    case GRAPH_VALUE_TYPE.COLOR:
      return getTransform()
    case GRAPH_VALUE_TYPE.STOP:
      return getGradientStop()
    case GRAPH_VALUE_TYPE.TEXT:
    case GRAPH_VALUE_TYPE.BONE:
    case GRAPH_VALUE_TYPE.OBJECT:
    case GRAPH_VALUE_TYPE.INPUT:
    case GRAPH_VALUE_TYPE.OUTPUT:
      return ''
    case GRAPH_VALUE_TYPE.D:
      return []
    case GRAPH_VALUE_TYPE.GENERICS:
    case GRAPH_VALUE_TYPE.UNKNOWN:
      return undefined
    default: {
      const strange: never = valueType
      throw new Error(`Unexpected value type: ${strange}`)
    }
  }
}

function getGradientStop(): GradientStop {
  return {
    offset: 0,
    color: getTransform(),
    relative: false,
  }
}

export function cleanAllEdgeGenerics(
  getGraphNodeModule: GetGraphNodeModule,
  nodeMap: GraphNodeMap
): GraphNodeMap {
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
    const struct = getGraphNodeModule(target.type)?.struct
    if (!struct?.genericsChains) return p

    const chains = struct.genericsChains
    return chains
      .filter((c) => c.length > 0)
      .reduce((q, c) => {
        const item = { ...c[0], id: target.id }

        // ignore if this chain has been done
        if (item.output && !!doneMap[target.id]?.outputs[item.key]) return q
        if (doneMap[target.id]?.inputs[item.key]) return q

        const group = getEdgeChainGroupAt(
          getGraphNodeModule,
          q,
          allEdgeConnectionInfo,
          item
        )

        group.forEach((c) => {
          doneMap[c.id] ??= { inputs: {}, outputs: {} }
          if (c.output) {
            doneMap[c.id].outputs[c.key] = true
          } else {
            doneMap[c.id].inputs[c.key] = true
          }
        })

        const type = findResolvedGenericsType(group)
        const updated = cleanEdgeGenericsGroupByType(
          getGraphNodeModule,
          q,
          group,
          type
        )
        toList(updated).forEach((n) => (updatedIdMap[n.id] = true))
        return { ...q, ...updated }
      }, p)
  }, nodeMap)

  return extractMap(nextMap, updatedIdMap)
}

export function getNodeErrors(
  getGraphNodeModule: GetGraphNodeModule,
  nodeMap: GraphNodeMap
): IdMap<string[]> {
  const circularRefIds = getAllCircularRefIds(nodeMap)

  return toList(nodeMap).reduce<IdMap<string[]>>((p, node) => {
    const struct = getGraphNodeModule(node.type)?.struct
    const errors = struct
      ? [
          ...(struct.getErrors?.(node) ?? []),
          ...Object.entries(validateNode(getGraphNodeModule, nodeMap, node.id))
            .filter(([_, v]) => !v)
            .map(
              ([key]) => `Invalid input: ${struct.inputs[key]?.label ?? key}`
            ),
          ...(circularRefIds[node.id] ? ['Circular connection is found'] : []),
        ]
      : ['Unknown node']

    if (errors.length > 0) {
      p[node.id] = errors
    }

    return p
  }, {})
}

export function getUpdatedNodeMapToDisconnectNodeInputs(
  getGraphNodeModule: GetGraphNodeModule,
  nodeMap: GraphNodeMap,
  inputsMap: IdMap<IdMap<true>>
): GraphNodeMap {
  const latestMap: GraphNodeMap = nodeMap
  const updatedIds = new Set<string>()

  Object.entries(inputsMap).forEach(([id, inputs]) => {
    Object.keys(inputs).forEach((key) => {
      const updated = getUpdatedNodeMapToDisconnectNodeInput(
        getGraphNodeModule,
        latestMap,
        id,
        key
      )
      Object.entries(updated).forEach(([id, val]) => {
        latestMap[id] = val
        updatedIds.add(id)
      })
    })
  })

  return Array.from(updatedIds).reduce<GraphNodeMap>((p, id) => {
    p[id] = latestMap[id]
    return p
  }, {})
}

export function getUpdatedNodeMapToDisconnectNodeInput(
  getGraphNodeModule: GetGraphNodeModule,
  nodeMap: GraphNodeMap,
  nodeId: string,
  inputKey: string
): GraphNodeMap {
  const node = nodeMap[nodeId]

  const updated = resetInput(
    getGraphNodeModule(node.type)?.struct,
    node,
    inputKey
  )
  const currentInput = node.inputs[inputKey]

  // clean generics
  const updatedMapByDisconnectInput = cleanEdgeGenericsGroupAt(
    getGraphNodeModule,
    { ...nodeMap, [updated.id]: updated },
    { id: updated.id, key: inputKey }
  )
  const updatedMapByDisconnectOutput = currentInput?.from
    ? cleanEdgeGenericsGroupAt(
        getGraphNodeModule,
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

export function cleanNode(
  getGraphNodeModule: GetGraphNodeModule,
  node: GraphNodeBase
): GraphNodeBase | undefined {
  const nodeModule = getGraphNodeModule(node.type)
  if (!nodeModule) return

  const unknownInputs = Object.keys(node.inputs).filter(
    (key) => !nodeModule.struct.inputs[key]
  )
  const unknownData = Object.keys(node.data).filter(
    (key) => !nodeModule.struct.data[key]
  )

  if (unknownInputs.length === 0 && unknownData.length === 0) return node

  const unknownInputSet = new Set(unknownInputs)
  const unknownDataSet = new Set(unknownData)
  return {
    ...node,
    inputs: mapFilter(node.inputs, (_, key) => !unknownInputSet.has(key)),
    data: mapFilter(node.data, (_, key) => !unknownDataSet.has(key)),
  }
}

/**
 * returns only updated nodes
 */
export function getUpdatedNodeMapToChangeNodeStruct(
  getGraphNodeModule: GetGraphNodeModule,
  nodeMap: GraphNodeMap,
  nodeType: GraphNodeType,
  nextStruct: Pick<NodeStruct<any>, 'inputs' | 'outputs'>
): GraphNodeMap {
  const currentStruct = getGraphNodeModule(nodeType)?.struct
  if (!currentStruct) return {}

  const targetTypeNodeMap = mapFilter(nodeMap, (node) => node.type === nodeType)
  const updatedIdSet = new Set<string>()

  const inputCleanedMap = mapReduce(targetTypeNodeMap, (node) => {
    const next = Object.keys(node.inputs).reduce((n, key) => {
      const currentInput = n.inputs[key]
      const nextInputType = nextStruct.inputs[key]?.type
      if (
        nextStruct.inputs[key] &&
        isSameValueType(nextInputType, getInputType(currentStruct, n, key))
      ) {
        if (
          nextInputType.type !== GRAPH_VALUE_TYPE.GENERICS &&
          currentInput.genericsType
        ) {
          updatedIdSet.add(node.id)
          // Current genericsType equals next fixed type
          // => Current connection can be kept
          return {
            ...n,
            inputs: {
              ...n.inputs,
              [key]: currentInput.from
                ? { from: currentInput.from }
                : { value: createDefaultValueForGenerics(nextInputType) },
            },
          }
        }

        return n
      }

      updatedIdSet.add(node.id)
      return resetInput(nextStruct, n, key)
    }, node)

    return Object.keys(nextStruct.inputs).reduce((n, key) => {
      if (n.inputs[key]) return n

      updatedIdSet.add(node.id)
      return resetInput(nextStruct, n, key)
    }, next)
  })

  const outputCleanedMap = mapReduce(
    { ...nodeMap, ...inputCleanedMap },
    (node) => {
      const nodeStruct = getGraphNodeModule(node.type)?.struct
      if (!nodeStruct) return node

      return Object.entries(node.inputs).reduce((n, [key, input]) => {
        if (
          !input.from ||
          !targetTypeNodeMap[input.from.id] ||
          isSameValueType(
            nextStruct.outputs[input.from.key],
            getInputType(nodeStruct, n, key)
          )
        )
          return n

        updatedIdSet.add(n.id)
        return resetInput(nodeStruct, n, key)
      }, node)
    }
  )

  const nextGetGraphNodeModule = (type: GraphNodeType) => {
    const current = getGraphNodeModule(type)
    return type !== nodeType
      ? current
      : ({
          ...current,
          struct: {
            ...current?.struct,
            ...nextStruct,
          },
        } as any)
  }

  return {
    ...mapFilter(outputCleanedMap, (_, id) => updatedIdSet.has(id)),
    ...cleanAllEdgeGenerics(nextGetGraphNodeModule, outputCleanedMap),
  }
}

export function isInterfaceChanged(
  prevStruct: Pick<NodeStruct<any>, 'inputs' | 'outputs'>,
  nextStruct: Pick<NodeStruct<any>, 'inputs' | 'outputs'>
): boolean {
  const prevInputKyes = Object.keys(prevStruct.inputs)
  const nextInputKyes = Object.keys(nextStruct.inputs)
  if (prevInputKyes.length !== nextInputKyes.length) return true
  if (prevInputKyes.some((key, i) => key !== nextInputKyes[i])) return true

  const prevOutputKyes = Object.keys(prevStruct.outputs)
  const nextOutputKyes = Object.keys(nextStruct.outputs)
  if (prevOutputKyes.length !== nextOutputKyes.length) return true
  if (prevOutputKyes.some((key, i) => key !== nextOutputKyes[i])) return true

  return (
    Object.entries(prevStruct.inputs).some(([key, input]) => {
      const next = nextStruct.inputs[key]
      return !next || !isSameValueType(input.type, next.type)
    }) ||
    Object.entries(prevStruct.outputs).some(([key, output]) => {
      const next = nextStruct.outputs[key]
      return !next || !isSameValueType(output, next)
    })
  )
}

/**
 * Complete input values if each node has some errors
 */
export function completeNodeMap(
  getGraphNodeModule: GetGraphNodeModule,
  nodeMap: GraphNodeMap,
  errorIdMap: { [id: string]: unknown }
): GraphNodeMap {
  return mapReduce(nodeMap, (node) => {
    if (!errorIdMap[node.id]) return node

    const struct = getGraphNodeModule(node.type)?.struct
    if (!struct) return node

    const validKeyMap = validateNode(getGraphNodeModule, nodeMap, node.id)
    return {
      ...node,
      inputs: mapReduce(node.inputs, (input, key) =>
        validKeyMap[key] ? input : { value: struct.inputs[key]?.default }
      ),
    }
  })
}

export function inheritOutputValue(
  fromNodeType: string,
  outputValue: unknown
): Partial<GraphNode> {
  switch (fromNodeType) {
    case 'scaler':
      return { data: { value: outputValue } }
    case 'make_vector2': {
      const v = outputValue as IVec2
      return {
        inputs: { x: { value: v.x }, y: { value: v.y } },
      }
    }
    case 'make_transform': {
      const v = outputValue as Transform
      return {
        inputs: {
          translate: { value: v.translate },
          rotate: { value: v.rotate },
          scale: { value: v.scale },
          origin: { value: v.origin },
        },
      }
    }
    case 'color': {
      const v = outputValue as Transform
      return { data: { color: v } }
    }
    case 'make_color': {
      const v = outputValue as Transform
      return {
        inputs: {
          h: { value: v.rotate },
          s: { value: v.translate.x },
          v: { value: v.translate.y },
          a: { value: v.scale.x },
        },
      }
    }
    case 'get_object': {
      const v = outputValue as string
      return {
        data: { object: v },
      }
    }
    default:
      return {}
  }
}

export function getInputsConnectedTo(
  nodeMap: IdMap<GraphNode>,
  nodeId: string,
  outputKey: string
): IdMap<{ [key: string]: true }> {
  const ret: IdMap<{ [key: string]: true }> = {}
  Object.values(nodeMap).forEach((n) => {
    for (const key in n.inputs) {
      const input = n.inputs[key]
      if (
        !!input.from &&
        input.from.id === nodeId &&
        input.from.key === outputKey
      ) {
        ret[n.id] ??= {}
        ret[n.id][key] = true
      }
    }
  })
  return ret
}

export function updateNodeInput(
  getGraphNodeModule: GetGraphNodeModule,
  nodeMap: IdMap<GraphNode>,
  inputId: string,
  inputKey: string,
  outputId: string,
  outputKey: string
): IdMap<GraphNode> {
  if (!nodeMap[outputId] || !nodeMap[inputId]) return {}

  const updated = updateInputConnection(
    { node: nodeMap[outputId], key: outputKey },
    { node: nodeMap[inputId], key: inputKey }
  )
  if (!updated) return {}

  return {
    [updated.id]: updated,
    ...cleanEdgeGenericsGroupAt(
      getGraphNodeModule,
      { ...nodeMap, [updated.id]: updated },
      { id: updated.id, key: inputKey }
    ),
  }
}

export function updateMultipleNodeInput(
  getGraphNodeModule: GetGraphNodeModule,
  nodeMap: IdMap<GraphNode>,
  outputId: string,
  outputKey: string,
  inputs: GraphEdgeConnection[]
): IdMap<GraphNode> {
  if (inputs.length === 0) return {}

  const updatedIds = new Set<string>()
  const latestMap = { ...nodeMap }

  inputs.forEach((input) => {
    const updated = updateNodeInput(
      getGraphNodeModule,
      latestMap,
      input.nodeId,
      input.key,
      outputId,
      outputKey
    )
    for (const id in updated) {
      latestMap[id] = updated[id]
      updatedIds.add(id)
    }
  })

  return mapFilter(latestMap, (_, id) => updatedIds.has(id))
}
