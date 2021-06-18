import { Transform } from '/@/models'
import { GraphNodeBase, GRAPH_VALUE_TYPE } from '/@/models/graphNode'

export interface NodeStruce<T extends GraphNodeBase> {
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
  ) => { [key in keyof NodeStruce<T>['outputs']]: unknown }
}

export interface NodeContext<T> {
  setTransform: (objectId: string, transform: Transform) => void
  getFrame: () => number
  getObjectMap: () => { [id: string]: T }
  cloneObject: (objectId: string) => string
}
