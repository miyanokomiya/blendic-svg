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
    self: T,
    inputs: {
      [key in keyof T['inputs']]: Required<T['inputs'][key]>['value']
    }
  ) => { [key in keyof NodeStruce<T>['outputs']]: unknown }
}
