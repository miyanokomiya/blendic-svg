import { Transform } from '/@/models'
import { GraphNodeBase, GRAPH_VALUE_TYPE } from '/@/models/graphNode'

export interface NodeModule<T extends GraphNodeBase> {
  struct: NodeStruct<T>
}

export interface NodeStruct<T extends GraphNodeBase> {
  create: (arg?: Partial<T>) => T
  data: {
    [key in keyof T['data']]: { type: keyof typeof GRAPH_VALUE_TYPE }
  }
  inputs: {
    [key in keyof T['inputs']]: { type: keyof typeof GRAPH_VALUE_TYPE } & (
      | { default: Required<T['inputs'][key]>['value'] }
      | { required: true }
    )
  }
  outputs: {
    [key: string]: keyof typeof GRAPH_VALUE_TYPE
  }
  computation: (
    inputs: {
      [key in keyof T['inputs']]: Required<T['inputs'][key]>['value']
    },
    self: T,
    context: NodeContext<unknown>
  ) => { [key in keyof NodeStruct<T>['outputs']]: unknown }
  width: number
  color?: string
  textColor?: string
  label?: string
}

export interface NodeContext<T> {
  setTransform: (objectId: string, transform: Transform) => void
  getFrame: () => number
  getObjectMap: () => { [id: string]: T }
  cloneObject: (objectId: string) => string
}

export function createBaseNode(
  arg: Partial<GraphNodeBase> = {}
): GraphNodeBase {
  return {
    id: '',
    type: 'scaler',
    data: {},
    inputs: {},
    position: { x: 0, y: 0 },
    ...arg,
  }
}
