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
  D: 'D',
} as const
export type GRAPH_VALUE_TYPE_KEY = keyof typeof GRAPH_VALUE_TYPE

export interface GraphNodeInput<T> {
  from?: { id: string; key: string }
  value?: T
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
  type: GRAPH_VALUE_TYPE_KEY
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
  hide_object: GraphNodeHideObject
  clone_object: GraphNodeCloneObject
  circle_clone_object: GraphNodeCircleCloneObject
  create_object_group: GraphNodeCreateObjectGroup
  create_object_rect: GraphNodeCreateObjectRect
  create_object_ellipse: GraphNodeCreateObjectEllipse
  create_object_path: GraphNodeCreateObjectPath
  set_viewbox: GraphNodeSetViewbox

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

  add_scaler: GraphNodeAddScaler
  sub_scaler: GraphNodeSubScaler
  multi_scaler: GraphNodeMultiScaler
  divide_scaler: GraphNodeDivideScaler
  sin: GraphNodeSin
  cos: GraphNodeCos
  polar_coord: GraphNodePolarCoord
  invert_polar_coord: GraphNodeInvertPolarCoord
  pow: GraphNodePow
  rotate_vector2: GraphNodeRotateVector2
  add_vector2: GraphNodeAddVector2
  sub_vector2: GraphNodeSubVector2
  scale_vector2: GraphNodeScaleVector2
  distance: GraphNodeDistance
  lerp_scaler: GraphNodeLerpScaler
  lerp_vector2: GraphNodeLerpVector2
  lerp_transform: GraphNodeLerpTransform
  lerp_color: GraphNodeLerpColor

  not: GraphNodeNot
  and: GraphNodeAnd
  or: GraphNodeOr
  equal: GraphNodeEqual
  greater_than: GraphNodeGreaterThan
  greater_than_or_equal: GraphNodeBase
  less_than: GraphNodeLessThan
  less_than_or_equal: GraphNodeLessThanOrEqual
  switch_scaler: GraphNodeSwitchScaler
  switch_vector2: GraphNodeSwitchVector2
  switch_transform: GraphNodeSwitchTransform
  switch_object: GraphNodeSwitchObject
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
    count: GraphNodeInput<number>
    radius: GraphNodeInput<number>
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

export interface GraphNodeMakePathZ extends GraphNodeBase {
  type: 'make_path_z'
  inputs: {
    d: GraphNodeInput<string[]>
  }
}

export interface GraphNodeAddScaler extends GraphNodeBase {
  type: 'add_scaler'
  inputs: { a: GraphNodeInput<number>; b: GraphNodeInput<number> }
}

export interface GraphNodeSubScaler extends GraphNodeBase {
  type: 'sub_scaler'
  inputs: { a: GraphNodeInput<number>; b: GraphNodeInput<number> }
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

export interface GraphNodeAddVector2 extends GraphNodeBase {
  type: 'add_vector2'
  inputs: { a: GraphNodeInput<IVec2>; b: GraphNodeInput<IVec2> }
}

export interface GraphNodeSubVector2 extends GraphNodeBase {
  type: 'sub_vector2'
  inputs: { a: GraphNodeInput<IVec2>; b: GraphNodeInput<IVec2> }
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

export interface GraphNodeLerpScaler extends GraphNodeBase {
  type: 'lerp_scaler'
  inputs: {
    a: GraphNodeInput<number>
    b: GraphNodeInput<number>
    alpha: GraphNodeInput<number>
  }
}

export interface GraphNodeLerpVector2 extends GraphNodeBase {
  type: 'lerp_vector2'
  inputs: {
    a: GraphNodeInput<IVec2>
    b: GraphNodeInput<IVec2>
    alpha: GraphNodeInput<number>
  }
}

export interface GraphNodeLerpTransform extends GraphNodeBase {
  type: 'lerp_transform'
  inputs: {
    a: GraphNodeInput<Transform>
    b: GraphNodeInput<Transform>
    alpha: GraphNodeInput<number>
  }
}

export interface GraphNodeLerpColor extends GraphNodeBase {
  type: 'lerp_color'
  inputs: {
    a: GraphNodeInput<Transform>
    b: GraphNodeInput<Transform>
    alpha: GraphNodeInput<number>
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

export interface GraphNodeEqual extends GraphNodeBase {
  type: 'equal'
  inputs: {
    a: GraphNodeInput<number>
    b: GraphNodeInput<number>
    threshold: GraphNodeInput<number>
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

export interface GraphNodeSwitchScaler extends GraphNodeBase {
  type: 'switch_scaler'
  inputs: {
    condition: GraphNodeInput<boolean>
    if_true: GraphNodeInput<number>
    if_false: GraphNodeInput<number>
  }
}

export interface GraphNodeSwitchVector2 extends GraphNodeBase {
  type: 'switch_vector2'
  inputs: {
    condition: GraphNodeInput<boolean>
    if_true: GraphNodeInput<IVec2>
    if_false: GraphNodeInput<IVec2>
  }
}

export interface GraphNodeSwitchTransform extends GraphNodeBase {
  type: 'switch_transform'
  inputs: {
    condition: GraphNodeInput<boolean>
    if_true: GraphNodeInput<Transform>
    if_false: GraphNodeInput<Transform>
  }
}

export interface GraphNodeSwitchObject extends GraphNodeBase {
  type: 'switch_object'
  inputs: {
    condition: GraphNodeInput<boolean>
    if_true: GraphNodeInput<string>
    if_false: GraphNodeInput<string>
  }
}
