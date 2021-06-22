import { getTransform } from '/@/models'
import { GraphNodeSetTransform, GRAPH_VALUE_TYPE } from '/@/models/graphNode'
import { createBaseNode, NodeStruct } from '/@/utils/graphNodes/core'

export const struct: NodeStruct<GraphNodeSetTransform> = {
  create(arg = {}) {
    return {
      ...createBaseNode({
        inputs: { object: { value: '' }, transform: { value: getTransform() } },
        ...arg,
      }),
      type: 'set_transform',
    } as GraphNodeSetTransform
  },
  data: {},
  inputs: {
    object: { type: GRAPH_VALUE_TYPE.OBJECT, default: '' },
    transform: { type: GRAPH_VALUE_TYPE.TRANSFORM, default: getTransform() },
  },
  outputs: {
    object: GRAPH_VALUE_TYPE.OBJECT,
  },
  computation(inputs, _self, context): { object: string } {
    context.setTransform(inputs.object, inputs.transform)
    return {
      object: inputs.object,
    }
  },
  width: 140,
  color: '#dc143c',
  textColor: '#fff',
}
