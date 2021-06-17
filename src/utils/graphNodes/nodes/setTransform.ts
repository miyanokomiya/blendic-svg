import { getTransform } from '/@/models'
import { GraphNodeSetTransform, GRAPH_VALUE_TYPE } from '/@/models/graphNode'
import { NodeStruce } from '/@/utils/graphNodes/core'

export const struct: NodeStruce<GraphNodeSetTransform> = {
  inputs: {
    object: { type: GRAPH_VALUE_TYPE.OBJECT, default: '' },
    transform: { type: GRAPH_VALUE_TYPE.TRANSFORM, default: getTransform() },
  },
  outputs: {
    object: GRAPH_VALUE_TYPE.OBJECT,
  },
  computation(_self, inputs): { object: string } {
    return {
      object: inputs.object,
    }
  },
}
