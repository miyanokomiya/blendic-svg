import { GraphNodeBreakVector2, GRAPH_VALUE_TYPE } from '/@/models/graphNode'
import { NodeStruce } from '/@/utils/graphNodes/core'

export const struct: NodeStruce<GraphNodeBreakVector2> = {
  inputs: {
    value: { type: GRAPH_VALUE_TYPE.VECTOR2, required: true },
  },
  outputs: {
    x: GRAPH_VALUE_TYPE.SCALER,
    y: GRAPH_VALUE_TYPE.SCALER,
  },
  computation(_self, inputs) {
    return { x: inputs.value.x, y: inputs.value.y }
  },
}
