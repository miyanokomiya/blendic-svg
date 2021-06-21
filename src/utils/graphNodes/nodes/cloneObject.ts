import { GraphNodeCloneObject, GRAPH_VALUE_TYPE } from '/@/models/graphNode'
import { createBaseNode, NodeStruct } from '/@/utils/graphNodes/core'

export const struct: NodeStruct<GraphNodeCloneObject> = {
  create(arg = {}) {
    return {
      ...createBaseNode({
        inputs: { object: { value: '' } },
        ...arg,
      }),
      type: 'clone_object',
    } as GraphNodeCloneObject
  },
  data: {},
  inputs: {
    object: { type: GRAPH_VALUE_TYPE.OBJECT, default: '' },
  },
  outputs: {
    origin: GRAPH_VALUE_TYPE.OBJECT,
    clone: GRAPH_VALUE_TYPE.OBJECT,
  },
  computation(inputs, _self, context): { origin: string; clone: string } {
    const clone = context.cloneObject(inputs.object)
    return { origin: inputs.object, clone }
  },
  width: 140,
  color: '#dc143c',
  textColor: '#fff',
}
