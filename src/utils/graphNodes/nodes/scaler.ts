import { GraphNodeScaler } from '/@/models/graphNode'
import { NodeStruce } from '/@/utils/graphNodes/core'

export const struct: NodeStruce<GraphNodeScaler> = {
  inputs: {
    value: { default: 0 },
  },
  computation(self): { value: number } {
    return { value: self.data.value }
  },
}
