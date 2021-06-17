import { GraphNodeBase, GraphNodeOutputValues } from '/@/models/graphNode'

export interface NodeStruce<T extends GraphNodeBase> {
  inputs: {
    [key in keyof T['inputs']]:
      | { default: Required<T['inputs'][key]>['value'] }
      | { required: true }
  }
  computation: (
    self: T,
    inputs: {
      [key in keyof T['inputs']]: Required<T['inputs'][key]>['value']
    }
  ) => GraphNodeOutputValues
}
