import { GraphNodeBreakVector2, GRAPH_VALUE_TYPE } from '/@/models/graphNode'
import { createBaseNode, NodeStruct } from '/@/utils/graphNodes/core'

export const struct: NodeStruct<GraphNodeBreakVector2> = {
  create(arg = {}) {
    return {
      ...createBaseNode({
        inputs: { vector2: { value: { x: 0, y: 0 } } },
        ...arg,
      }),
      type: 'break_vector2',
    } as GraphNodeBreakVector2
  },
  data: {},
  inputs: {
    vector2: { type: GRAPH_VALUE_TYPE.VECTOR2, required: true },
  },
  outputs: {
    x: GRAPH_VALUE_TYPE.SCALER,
    y: GRAPH_VALUE_TYPE.SCALER,
  },
  computation(inputs) {
    return { x: inputs.vector2.x, y: inputs.vector2.y }
  },
  width: 140,
  color: '#f0e68c',
}
