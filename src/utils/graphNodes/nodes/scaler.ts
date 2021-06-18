import { GraphNodeScaler, GRAPH_VALUE_TYPE } from '/@/models/graphNode'
import { NodeStruce } from '/@/utils/graphNodes/core'

export const struct: NodeStruce<GraphNodeScaler> = {
  inputs: {},
  outputs: { value: GRAPH_VALUE_TYPE.SCALER },
  computation(_inputs, self) {
    return { value: self.data.value }
  },
}
