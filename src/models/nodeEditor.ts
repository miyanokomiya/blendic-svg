import { IVec2 } from 'okageo'

export interface GraphEdge {
  id: string
  from: string
  to: string
}

export interface GraphEdgeBinder {
  id: string
  position: IVec2
}

export interface GraphNodeBase {
  id: string
  type: GraphNodeType
  data: { [key: string]: unknown }
  inputs?: GraphNodeInputs
  position: IVec2
}

export interface GraphNodes {
  scaler: GraphNodeScaler
  make_vector2: GraphNodeMakeVector2
  break_vector2: GraphNodeBreakVector2
}
export type GraphNodeType = keyof GraphNodes
export type GraphNode = GraphNodes[GraphNodeType]

export interface GraphValueType {
  scaler: number
  vector2: IVec2
}
export type GraphValueTypeKey = keyof GraphValueType

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
  inputs: { value: GraphNodeInput<IVec2> }
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
