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

export interface GraphNodes {
  scaler: GraphNodeScaler
  make_vector2: GraphNodeMakeVector2
  break_vector2: GraphNodeBreakVector2
  make_transform: GraphNodeMakeTransform
  set_transform: GraphNodeSetTransform
  get_frame: GraphNodeGetFrame
}
export type GraphNodeType = keyof GraphNodes
export type GraphNode = GraphNodes[GraphNodeType]

export const GRAPH_VALUE_TYPE = {
  SCALER: 'SCALER',
  VECTOR2: 'VECTOR2',
  OBJECT: 'OBJECT',
  TRANSFORM: 'TRANSFORM',
} as const

export interface GraphNodeInput<T> {
  from?: { id: string; key: string }
  value?: T
}
export type GraphNodeInputs = { [key: string]: GraphNodeInput<unknown> }

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
  }
}

export interface GraphNodeSetTransform extends GraphNodeBase {
  type: 'set_transform'
  inputs: {
    object: GraphNodeInput<string>
    transform: GraphNodeInput<Transform>
  }
}

export interface GraphNodeGetFrame extends GraphNodeBase {
  type: 'get_frame'
  inputs: {}
}

export interface GraphNodeMap {
  [id: string]: GraphNode
}

export interface GraphNodeOutputValues {
  [key: string]: unknown
}

export interface GraphNodeOutputMap {
  [id: string]: GraphNodeOutputValues
}

export interface GraphNodeEdgePositions {
  inputs: { [key: string]: IVec2 }
  outputs: { [key: string]: IVec2 }
}
