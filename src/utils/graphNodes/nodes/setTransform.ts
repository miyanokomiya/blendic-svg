import { getTransform } from '/@/models'
import { GraphNodeSetTransform, GRAPH_VALUE_TYPE } from '/@/models/graphNode'
import { createBaseNode, NodeStruce } from '/@/utils/graphNodes/core'

export const struct: NodeStruce<GraphNodeSetTransform> = {
  create(arg = {}) {
    return {
      ...createBaseNode({
        inputs: { object: { value: '' }, transform: { value: getTransform() } },
        ...arg,
      }),
      type: 'set_transform',
    } as GraphNodeSetTransform
  },
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
}
