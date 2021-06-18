import { GraphNodeBreakVector2, GRAPH_VALUE_TYPE } from '/@/models/graphNode'
import { createBaseNode, NodeStruce } from '/@/utils/graphNodes/core'

export const struct: NodeStruce<GraphNodeBreakVector2> = {
  create(arg = {}) {
    return {
      ...createBaseNode({
        inputs: { value: { value: { x: 0, y: 0 } } },
        ...arg,
      }),
      type: 'break_vector2',
    } as GraphNodeBreakVector2
  },
  inputs: {
    value: { type: GRAPH_VALUE_TYPE.VECTOR2, required: true },
  },
  outputs: {
    x: GRAPH_VALUE_TYPE.SCALER,
    y: GRAPH_VALUE_TYPE.SCALER,
  },
  computation(inputs) {
    return { x: inputs.value.x, y: inputs.value.y }
  },
}
