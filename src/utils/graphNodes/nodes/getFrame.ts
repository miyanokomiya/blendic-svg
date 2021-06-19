import { GraphNodeGetFrame, GRAPH_VALUE_TYPE } from '/@/models/graphNode'
import { createBaseNode, NodeStruct } from '/@/utils/graphNodes/core'

export const struct: NodeStruct<GraphNodeGetFrame> = {
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
  outputs: { frame: GRAPH_VALUE_TYPE.SCALER },
  computation(_inputs, _self, context) {
    return { frame: context.getFrame() }
  },
  width: 120,
}
