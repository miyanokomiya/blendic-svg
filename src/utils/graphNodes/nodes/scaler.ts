import { GraphNodeScaler, GRAPH_VALUE_TYPE } from '/@/models/graphNode'
import { createBaseNode, NodeStruct } from '/@/utils/graphNodes/core'

export const struct: NodeStruct<GraphNodeScaler> = {
  create(arg = {}) {
    return {
      ...createBaseNode({
        inputs: {},
        ...arg,
      }),
      type: 'scaler',
    } as GraphNodeScaler
  },
  inputs: {},
  outputs: { value: GRAPH_VALUE_TYPE.SCALER },
  computation(_inputs, self) {
    return { value: self.data.value }
  },
  width: 120,
}
