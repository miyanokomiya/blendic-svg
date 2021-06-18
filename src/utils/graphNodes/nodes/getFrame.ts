import { GraphNodeGetFrame, GRAPH_VALUE_TYPE } from '/@/models/graphNode'
import { NodeStruce } from '/@/utils/graphNodes/core'

export const struct: NodeStruce<GraphNodeGetFrame> = {
  inputs: {},
  outputs: { value: GRAPH_VALUE_TYPE.SCALER },
  computation(_inputs, _self, context) {
    return { value: context.getFrame() }
  },
}
