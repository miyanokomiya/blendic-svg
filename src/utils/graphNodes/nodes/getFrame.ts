import { GraphNodeGetFrame, GRAPH_VALUE_TYPE } from '/@/models/graphNode'
import { createBaseNode, NodeStruce } from '/@/utils/graphNodes/core'

export const struct: NodeStruce<GraphNodeGetFrame> = {
  create(arg = {}) {
    return {
      ...createBaseNode({
        inputs: {},
        ...arg,
      }),
      type: 'get_frame',
    } as GraphNodeGetFrame
  },
  inputs: {},
  outputs: { value: GRAPH_VALUE_TYPE.SCALER },
  computation(_inputs, _self, context) {
    return { value: context.getFrame() }
  },
}
