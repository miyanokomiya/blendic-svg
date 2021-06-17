import { GraphNodeScaler, GRAPH_VALUE_TYPE } from '/@/models/graphNode'
import { NodeStruce } from '/@/utils/graphNodes/core'

export const struct: NodeStruce<GraphNodeScaler> = {
  inputs: {
    value: { type: GRAPH_VALUE_TYPE.SCALER, default: 0 },
  },
  outputs: {},
  computation(_inputs, self) {
    return { value: self.data.value }
  },
}
