import { GraphNodeBreakVector2 } from '/@/models/graphNode'
import { NodeStruce } from '/@/utils/graphNodes/core'

export const struct: NodeStruce<GraphNodeBreakVector2> = {
  inputs: {
    value: { required: true },
  },
  computation(_self: GraphNodeBreakVector2, inputs): { x: number; y: number } {
    return inputs.value
  },
}
