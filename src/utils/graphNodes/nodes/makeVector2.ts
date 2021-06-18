import { GraphNodeMakeVector2, GRAPH_VALUE_TYPE } from '/@/models/graphNode'
import { createBaseNode, NodeStruce } from '/@/utils/graphNodes/core'

export const struct: NodeStruce<GraphNodeMakeVector2> = {
  create(arg = {}) {
    return {
      ...createBaseNode({
        inputs: { x: { value: 0 }, y: { value: 0 } },
        ...arg,
      }),
      type: 'make_vector2',
    } as GraphNodeMakeVector2
  },
  inputs: {
    x: { type: GRAPH_VALUE_TYPE.SCALER, default: 0 },
    y: { type: GRAPH_VALUE_TYPE.SCALER, default: 0 },
  },
  outputs: {
    object: GRAPH_VALUE_TYPE.VECTOR2,
  },
  computation(inputs) {
    return { value: inputs }
  },
}
