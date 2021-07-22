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

import { IVec2 } from 'okageo'
import { Transform } from '/@/models'

export interface GraphEdge {
  from: GraphEdgeConnection
  to: GraphEdgeConnection
}

export type GraphEdgeConnection = {
  nodeId: string
  key: string
}

export interface GraphEdgeBinder {
  id: string
  position: IVec2
}

export interface GraphNodeBase {
  id: string
  type: GraphNodeType
  data: { [key: string]: unknown }
  inputs: GraphNodeInputs
  position: IVec2
}

export const GRAPH_VALUE_TYPE = {
  BOOLEAN: 'BOOLEAN',
  SCALER: 'SCALER',
  VECTOR2: 'VECTOR2',
  OBJECT: 'OBJECT',
  TRANSFORM: 'TRANSFORM',
  COLOR: 'COLOR',
  TEXT: 'TEXT',
  D: 'D',
  STOP: 'STOP',
  GENERICS: 'GENERICS',
} as const
export type GRAPH_VALUE_TYPE_KEY = keyof typeof GRAPH_VALUE_TYPE

export type GradientStop = {
  offset: number
  color: Transform
  relative: boolean
}

export type ValueType =
  | ValueTypeBase<GRAPH_VALUE_TYPE_KEY>
  | ValueTypeScaler
  | ValueTypeVector2

export const GRAPH_VALUE_STRUCT = {
  UNIT: 'UNIT',
  ARRAY: 'ARRAY',
  UNIT_OR_ARRAY: 'UNIT_OR_ARRAY',
} as const
export type GRAPH_VALUE_STRUCT_KEY = keyof typeof GRAPH_VALUE_STRUCT

interface ValueTypeBase<T extends GRAPH_VALUE_TYPE_KEY> {
  type: T
  struct: GRAPH_VALUE_STRUCT_KEY
}

interface ValueTypeScaler extends ValueTypeBase<'SCALER'> {
  scale: number
}

interface ValueTypeVector2 extends ValueTypeBase<'VECTOR2'> {
  scale: number
}

export interface GraphNodeInput<T> {
  from?: { id: string; key: string }
  value?: T
  // an input having a generics type may have this property if the type is decided
  genericsType?: ValueType
}
export type GraphNodeInputs = { [key: string]: GraphNodeInput<any> }

export interface GraphNodeMap {
  [id: string]: GraphNode
}

export interface GraphNodeOutputValues {
  [key: string]: unknown
}

export interface GraphNodeOutputMap {
  [id: string]: GraphNodeOutputValues
}

export interface GraphNodeEdgeInfo {
  p: IVec2
  type: ValueType
}

export interface GraphNodeEdgePositions {
  inputs: { [key: string]: GraphNodeEdgeInfo }
  outputs: { [key: string]: GraphNodeEdgeInfo }
}

////
// GraphNodes
////

export interface GraphNodes {
  get_frame: GraphNodeGetFrame
  scaler: GraphNodeScaler
  make_vector2: GraphNodeMakeVector2
  break_vector2: GraphNodeBreakVector2
  make_transform: GraphNodeMakeTransform
  color: GraphNodeColor
  make_color: GraphNodeMakeColor
  break_color: GraphNodeBreakColor

  get_object: GraphNodeGetObject
  set_transform: GraphNodeSetTransform
  set_fill: GraphNodeSetFill
  set_stroke: GraphNodeSetStroke
  set_stroke_length: GraphNodeSetStrokeLength
  hide_object: GraphNodeHideObject
  set_viewbox: GraphNodeSetViewbox

  clone_object: GraphNodeCloneObject
  circle_clone_object: GraphNodeCircleCloneObject
  grid_clone_object: GraphNodeGridCloneObject
  tornado_clone_object: GraphNodeTornadoCloneObject

  create_object_group: GraphNodeCreateObjectGroup
  create_object_rect: GraphNodeCreateObjectRect
  create_object_ellipse: GraphNodeCreateObjectEllipse
  create_object_text: GraphNodeCreateObjectText
  create_object_path: GraphNodeCreateObjectPath

  make_path_m: GraphNodeMakePathM
  make_path_l: GraphNodeMakePathL
  make_path_h: GraphNodeMakePathH
  make_path_v: GraphNodeMakePathV
  make_path_q: GraphNodeMakePathQ
  make_path_t: GraphNodeMakePathT
  make_path_c: GraphNodeMakePathC
  make_path_s: GraphNodeMakePathS
  make_path_a: GraphNodeMakePathA
  make_path_z: GraphNodeMakePathZ

  create_linear_gradient: GraphNodeCreateLinearGradient
  make_stop: GraphNodeMakeStop
  set_gradient: GraphNodeSetGradient

  add_generics: GraphNodeAddGenerics
  sub_generics: GraphNodeSubGenerics
  multi_scaler: GraphNodeMultiScaler
  divide_scaler: GraphNodeDivideScaler
  sin: GraphNodeSin
  cos: GraphNodeCos
  polar_coord: GraphNodePolarCoord
  invert_polar_coord: GraphNodeInvertPolarCoord
  pow: GraphNodePow
  rotate_vector2: GraphNodeRotateVector2
  scale_vector2: GraphNodeScaleVector2
  distance: GraphNodeDistance
  lerp_generics: GraphNodeLerpGenerics
  clamp: GraphNodeClamp
  round_trip: GraphNodeRoundTrip

  not: GraphNodeNot
  and: GraphNodeAnd
  or: GraphNodeOr
  equal_generics: GraphNodeEqualGenerics
  greater_than: GraphNodeGreaterThan
  greater_than_or_equal: GraphNodeBase
  less_than: GraphNodeLessThan
  less_than_or_equal: GraphNodeLessThanOrEqual
  between: GraphNodeBetween
  switch_generics: GraphNodeSwitchGenerics
}
export type GraphNodeType = keyof GraphNodes
// Note: this union decrease performance too much of type checking and unit test
// export type GraphNode = GraphNodes[GraphNodeType]
export type GraphNode = GraphNodeBase

export interface GraphNodeScaler extends GraphNodeBase {
  type: 'scaler'
  data: { value: number }
}

export interface GraphNodeMakeVector2 extends GraphNodeBase {
  type: 'make_vector2'
  inputs: { x: GraphNodeInput<number>; y: GraphNodeInput<number> }
}

export interface GraphNodeBreakVector2 extends GraphNodeBase {
  type: 'break_vector2'
  inputs: { vector2: GraphNodeInput<IVec2> }
}

export interface GraphNodeMakeTransform extends GraphNodeBase {
  type: 'make_transform'
  inputs: {
    translate: GraphNodeInput<IVec2>
    rotate: GraphNodeInput<number>
    scale: GraphNodeInput<IVec2>
    origin: GraphNodeInput<IVec2>
  }
}

export interface GraphNodeColor extends GraphNodeBase {
  type: 'color'
  data: { color: Transform }
}

export interface GraphNodeMakeColor extends GraphNodeBase {
  type: 'make_color'
  inputs: {
    h: GraphNodeInput<number>
    s: GraphNodeInput<number>
    v: GraphNodeInput<number>
    a: GraphNodeInput<number>
  }
}

export interface GraphNodeBreakColor extends GraphNodeBase {
  type: 'break_color'
  inputs: { color: GraphNodeInput<Transform> }
}

export interface GraphNodeGetFrame extends GraphNodeBase {
  type: 'get_frame'
}

export interface GraphNodeGetObject extends GraphNodeBase {
  type: 'get_object'
  data: { object: string }
}

export interface GraphNodeSetTransform extends GraphNodeBase {
  type: 'set_transform'
  inputs: {
    object: GraphNodeInput<string>
    transform: GraphNodeInput<Transform>
  }
}

export interface GraphNodeSetFill extends GraphNodeBase {
  type: 'set_fill'
  inputs: {
    object: GraphNodeInput<string>
    color: GraphNodeInput<Transform>
  }
}

export interface GraphNodeSetStroke extends GraphNodeBase {
  type: 'set_stroke'
  inputs: {
    object: GraphNodeInput<string>
    color: GraphNodeInput<Transform>
  }
}

export interface GraphNodeSetStrokeLength extends GraphNodeBase {
  type: 'set_stroke_length'
  inputs: {
    object: GraphNodeInput<string>
    length: GraphNodeInput<number>
    max_length: GraphNodeInput<number>
  }
}

export interface GraphNodeHideObject extends GraphNodeBase {
  type: 'hide_object'
  inputs: {
    disabled: GraphNodeInput<boolean>
    object: GraphNodeInput<string>
  }
}

export interface GraphNodeCloneObject extends GraphNodeBase {
  type: 'clone_object'
  inputs: {
    object: GraphNodeInput<string>
  }
}

export interface GraphNodeCircleCloneObject extends GraphNodeBase {
  type: 'circle_clone_object'
  inputs: {
    object: GraphNodeInput<string>
    rotate: GraphNodeInput<number>
    count: GraphNodeInput<number>
    radius: GraphNodeInput<number>
    fix_rotate: GraphNodeInput<boolean>
  }
}

export interface GraphNodeGridCloneObject extends GraphNodeBase {
  type: 'grid_clone_object'
  inputs: {
    object: GraphNodeInput<string>
    centered: GraphNodeInput<boolean>
    rotate: GraphNodeInput<number>
    row: GraphNodeInput<number>
    column: GraphNodeInput<number>
    width: GraphNodeInput<number>
    height: GraphNodeInput<number>
  }
}

export interface GraphNodeTornadoCloneObject extends GraphNodeBase {
  type: 'tornado_clone_object'
  inputs: {
    object: GraphNodeInput<string>
    rotate: GraphNodeInput<number>
    max_rotate: GraphNodeInput<number>
    interval: GraphNodeInput<number>
    offset: GraphNodeInput<number>
    radius: GraphNodeInput<number>
    radius_grow: GraphNodeInput<number>
    scale_grow: GraphNodeInput<number>
    fix_rotate: GraphNodeInput<boolean>
  }
}

export interface GraphNodeSetViewbox extends GraphNodeBase {
  type: 'set_viewbox'
  inputs: {
    object: GraphNodeInput<string>
    centered: GraphNodeInput<boolean>
    x: GraphNodeInput<number>
    y: GraphNodeInput<number>
    width: GraphNodeInput<number>
    height: GraphNodeInput<number>
  }
}

export interface GraphNodeCreateObjectInputsBase {
  disabled: GraphNodeInput<boolean>
  parent: GraphNodeInput<string>
  transform: GraphNodeInput<Transform>
  fill: GraphNodeInput<Transform>
  stroke: GraphNodeInput<Transform>
  'stroke-width': GraphNodeInput<number>
}

export interface GraphNodeCreateObjectGroup extends GraphNodeBase {
  type: 'create_object_group'
  inputs: {
    disabled: GraphNodeInput<boolean>
    parent: GraphNodeInput<string>
    transform: GraphNodeInput<Transform>
  }
}

export interface GraphNodeCreateObjectRect extends GraphNodeBase {
  type: 'create_object_rect'
  inputs: {
    centered: GraphNodeInput<boolean>
    x: GraphNodeInput<number>
    y: GraphNodeInput<number>
    width: GraphNodeInput<number>
    height: GraphNodeInput<number>
  } & {
    [key in keyof GraphNodeCreateObjectInputsBase]: GraphNodeCreateObjectInputsBase[key]
  }
}

export interface GraphNodeCreateObjectEllipse extends GraphNodeBase {
  type: 'create_object_ellipse'
  inputs: {
    cx: GraphNodeInput<number>
    cy: GraphNodeInput<number>
    rx: GraphNodeInput<number>
    ry: GraphNodeInput<number>
  } & {
    [key in keyof GraphNodeCreateObjectInputsBase]: GraphNodeCreateObjectInputsBase[key]
  }
}

export interface GraphNodeCreateObjectText extends GraphNodeBase {
  type: 'create_object_text'
  inputs: {
    centered: GraphNodeInput<boolean>
    x: GraphNodeInput<number>
    y: GraphNodeInput<number>
    dx: GraphNodeInput<number>
    dy: GraphNodeInput<number>
    text: GraphNodeInput<string>
    'font-size': GraphNodeInput<number>
  } & {
    [key in keyof GraphNodeCreateObjectInputsBase]: GraphNodeCreateObjectInputsBase[key]
  }
}

export interface GraphNodeCreateObjectPath extends GraphNodeBase {
  type: 'create_object_path'
  inputs: {
    d: GraphNodeInput<string[]>
  } & {
    [key in keyof GraphNodeCreateObjectInputsBase]: GraphNodeCreateObjectInputsBase[key]
  }
}

export interface GraphNodeMakePathM extends GraphNodeBase {
  type: 'make_path_m'
  inputs: {
    d: GraphNodeInput<string[]>
    relative: GraphNodeInput<boolean>
    p: GraphNodeInput<IVec2>
  }
}

export interface GraphNodeMakePathL extends GraphNodeBase {
  type: 'make_path_l'
  inputs: {
    d: GraphNodeInput<string[]>
    relative: GraphNodeInput<boolean>
    p: GraphNodeInput<IVec2>
  }
}

export interface GraphNodeMakePathH extends GraphNodeBase {
  type: 'make_path_h'
  inputs: {
    d: GraphNodeInput<string[]>
    relative: GraphNodeInput<boolean>
    x: GraphNodeInput<number>
  }
}

export interface GraphNodeMakePathV extends GraphNodeBase {
  type: 'make_path_v'
  inputs: {
    d: GraphNodeInput<string[]>
    relative: GraphNodeInput<boolean>
    y: GraphNodeInput<number>
  }
}

export interface GraphNodeMakePathQ extends GraphNodeBase {
  type: 'make_path_q'
  inputs: {
    d: GraphNodeInput<string[]>
    relative: GraphNodeInput<boolean>
    c1: GraphNodeInput<IVec2>
    p: GraphNodeInput<IVec2>
  }
}

export interface GraphNodeMakePathT extends GraphNodeBase {
  type: 'make_path_t'
  inputs: {
    d: GraphNodeInput<string[]>
    relative: GraphNodeInput<boolean>
    p: GraphNodeInput<IVec2>
  }
}

export interface GraphNodeMakePathC extends GraphNodeBase {
  type: 'make_path_c'
  inputs: {
    d: GraphNodeInput<string[]>
    relative: GraphNodeInput<boolean>
    c1: GraphNodeInput<IVec2>
    c2: GraphNodeInput<IVec2>
    p: GraphNodeInput<IVec2>
  }
}

export interface GraphNodeMakePathS extends GraphNodeBase {
  type: 'make_path_s'
  inputs: {
    d: GraphNodeInput<string[]>
    relative: GraphNodeInput<boolean>
    c1: GraphNodeInput<IVec2>
    p: GraphNodeInput<IVec2>
  }
}

export interface GraphNodeMakePathA extends GraphNodeBase {
  type: 'make_path_a'
  inputs: {
    d: GraphNodeInput<string[]>
    relative: GraphNodeInput<boolean>
    rx: GraphNodeInput<number>
    ry: GraphNodeInput<number>
    rotate: GraphNodeInput<number>
    'large-arc': GraphNodeInput<boolean>
    sweep: GraphNodeInput<boolean>
    p: GraphNodeInput<IVec2>
  }
}

export interface GraphNodeCreateLinearGradient extends GraphNodeBase {
  type: 'create_linear_gradient'
  inputs: {
    disabled: GraphNodeInput<boolean>
    parent: GraphNodeInput<string>
    relative: GraphNodeInput<boolean>
    stop: GraphNodeInput<GradientStop[]>
    from: GraphNodeInput<IVec2>
    to: GraphNodeInput<IVec2>
  }
}

export interface GraphNodeMakeStop extends GraphNodeBase {
  type: 'make_stop'
  inputs: {
    stop: GraphNodeInput<GradientStop[]>
    relative: GraphNodeInput<boolean>
    offset: GraphNodeInput<number>
    color: GraphNodeInput<Transform>
  }
}

export interface GraphNodeSetGradient extends GraphNodeBase {
  type: 'set_gradient'
  inputs: {
    object: GraphNodeInput<string>
    fill_gradient: GraphNodeInput<string>
    stroke_gradient: GraphNodeInput<string>
  }
}

export interface GraphNodeMakePathZ extends GraphNodeBase {
  type: 'make_path_z'
  inputs: {
    d: GraphNodeInput<string[]>
  }
}

export interface GraphNodeAddGenerics extends GraphNodeBase {
  type: 'add_generics'
  inputs: { a: GraphNodeInput<any>; b: GraphNodeInput<any> }
}

export interface GraphNodeSubGenerics extends GraphNodeBase {
  type: 'sub_generics'
  inputs: { a: GraphNodeInput<any>; b: GraphNodeInput<any> }
}

export interface GraphNodeMultiScaler extends GraphNodeBase {
  type: 'multi_scaler'
  inputs: { a: GraphNodeInput<number>; b: GraphNodeInput<number> }
}

export interface GraphNodeDivideScaler extends GraphNodeBase {
  type: 'divide_scaler'
  inputs: { a: GraphNodeInput<number>; b: GraphNodeInput<number> }
}

export interface GraphNodeSin extends GraphNodeBase {
  type: 'sin'
  inputs: { rotate: GraphNodeInput<number> }
}

export interface GraphNodeCos extends GraphNodeBase {
  type: 'cos'
  inputs: { rotate: GraphNodeInput<number> }
}

export interface GraphNodePolarCoord extends GraphNodeBase {
  type: 'polar_coord'
  inputs: { rotate: GraphNodeInput<number>; radius: GraphNodeInput<number> }
}

export interface GraphNodeInvertPolarCoord extends GraphNodeBase {
  type: 'invert_polar_coord'
  inputs: { vector2: GraphNodeInput<IVec2> }
}

export interface GraphNodePow extends GraphNodeBase {
  type: 'pow'
  inputs: { x: GraphNodeInput<number>; t: GraphNodeInput<number> }
}

export interface GraphNodeScaleVector2 extends GraphNodeBase {
  type: 'scale_vector2'
  inputs: { vector2: GraphNodeInput<IVec2>; scale: GraphNodeInput<number> }
}

export interface GraphNodeDistance extends GraphNodeBase {
  type: 'distance'
  inputs: { a: GraphNodeInput<IVec2>; b: GraphNodeInput<IVec2> }
}

export interface GraphNodeRotateVector2 extends GraphNodeBase {
  type: 'rotate_vector2'
  inputs: {
    vector2: GraphNodeInput<IVec2>
    rotate: GraphNodeInput<number>
    origin: GraphNodeInput<IVec2>
  }
}

export interface GraphNodeLerpGenerics extends GraphNodeBase {
  type: 'lerp_generics'
  inputs: {
    a: GraphNodeInput<any>
    b: GraphNodeInput<any>
    alpha: GraphNodeInput<number>
  }
}

export interface GraphNodeClamp extends GraphNodeBase {
  type: 'clamp'
  inputs: {
    number: GraphNodeInput<number>
    from: GraphNodeInput<number>
    to: GraphNodeInput<number>
    loop: GraphNodeInput<boolean>
  }
}

export interface GraphNodeRoundTrip extends GraphNodeBase {
  type: 'round_trip'
  inputs: {
    number: GraphNodeInput<number>
    from: GraphNodeInput<number>
    to: GraphNodeInput<number>
  }
}

export interface GraphNodeNot extends GraphNodeBase {
  type: 'not'
  inputs: { condition: GraphNodeInput<boolean> }
}

export interface GraphNodeAnd extends GraphNodeBase {
  type: 'and'
  inputs: { a: GraphNodeInput<boolean>; b: GraphNodeInput<boolean> }
}

export interface GraphNodeOr extends GraphNodeBase {
  type: 'or'
  inputs: { a: GraphNodeInput<boolean>; b: GraphNodeInput<boolean> }
}

export interface GraphNodeEqualGenerics extends GraphNodeBase {
  type: 'equal_generics'
  inputs: {
    a: GraphNodeInput<any>
    b: GraphNodeInput<any>
    threshold: GraphNodeInput<any>
  }
}

export interface GraphNodeGreaterThan extends GraphNodeBase {
  type: 'greater_than'
  inputs: {
    a: GraphNodeInput<number>
    b: GraphNodeInput<number>
  }
}

export interface GraphNodeGreaterThanOrEqual extends GraphNodeBase {
  type: 'greater_than_or_equal'
  inputs: { a: GraphNodeInput<number>; b: GraphNodeInput<number> }
}

export interface GraphNodeLessThan extends GraphNodeBase {
  type: 'less_than'
  inputs: { a: GraphNodeInput<number>; b: GraphNodeInput<number> }
}

export interface GraphNodeLessThanOrEqual extends GraphNodeBase {
  type: 'less_than_or_equal'
  inputs: { a: GraphNodeInput<number>; b: GraphNodeInput<number> }
}

export interface GraphNodeBetween extends GraphNodeBase {
  type: 'between'
  inputs: {
    number: GraphNodeInput<number>
    from: GraphNodeInput<number>
    to: GraphNodeInput<number>
  }
}

export interface GraphNodeSwitchGenerics extends GraphNodeBase {
  type: 'switch_generics'
  inputs: {
    condition: GraphNodeInput<boolean>
    if_true: GraphNodeInput<unknown>
    if_false: GraphNodeInput<unknown>
  }
}
