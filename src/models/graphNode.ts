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
} as const
export type GRAPH_VALUE_TYPE_KEY = keyof typeof GRAPH_VALUE_TYPE

export interface GraphNodeInput<T> {
  from?: { id: string; key: string }
  value?: T
}
export type GraphNodeInputs = { [key: string]: GraphNodeInput<unknown> }

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

  get_object: GraphNodeGetObject
  set_transform: GraphNodeSetTransform
  clone_object: GraphNodeCloneObject

  add_scaler: GraphNodeAddScaler
  sub_scaler: GraphNodeSubScaler
  multi_scaler: GraphNodeMultiScaler
  divide_scaler: GraphNodeDivideScaler

  not: GraphNodeNot
  equal: GraphNodeEqual
  greater_than: GraphNodeGreaterThan
  greater_than_or_equal: GraphNodeBase
  less_than: GraphNodeLessThan
  less_than_or_equal: GraphNodeLessThanOrEqual
  switch_scaler: GraphNodeSwitchScaler
}
export type GraphNodeType = keyof GraphNodes
export type GraphNode = GraphNodes[GraphNodeType]

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

export interface GraphNodeCloneObject extends GraphNodeBase {
  type: 'clone_object'
  inputs: {
    object: GraphNodeInput<string>
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

export interface GraphNodeNot extends GraphNodeBase {
  type: 'not'
  inputs: { condition: GraphNodeInput<boolean> }
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
