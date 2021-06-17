import { GraphNodeMakeVector2, GRAPH_VALUE_TYPE } from '/@/models/graphNode'
import { NodeStruce } from '/@/utils/graphNodes/core'

export const struct: NodeStruce<GraphNodeMakeVector2> = {
  inputs: {
    x: { type: GRAPH_VALUE_TYPE.SCALER, default: 0 },
    y: { type: GRAPH_VALUE_TYPE.SCALER, default: 0 },
  },
  outputs: {
    object: GRAPH_VALUE_TYPE.VECTOR2,
  },
  computation(_self, inputs) {
    return { value: inputs }
  },
}
