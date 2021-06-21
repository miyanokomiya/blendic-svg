import { GraphNodeScaler, GRAPH_VALUE_TYPE } from '/@/models/graphNode'
import { createBaseNode, NodeStruct } from '/@/utils/graphNodes/core'

export const struct: NodeStruct<GraphNodeScaler> = {
  create(arg = {}) {
    return {
      ...createBaseNode({
        data: { value: 0 },
        inputs: {},
        ...arg,
      }),
      type: 'scaler',
    } as GraphNodeScaler
  },
  data: { value: { type: GRAPH_VALUE_TYPE.SCALER } },
  inputs: {},
  outputs: { value: GRAPH_VALUE_TYPE.SCALER },
  computation(_inputs, self) {
    return { value: self.data.value }
  },
  width: 120,
  color: '#f0e68c',
}
