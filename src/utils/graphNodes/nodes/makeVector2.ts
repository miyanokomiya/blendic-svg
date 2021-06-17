import { IVec2 } from 'okageo'
import { GraphNodeMakeVector2 } from '/@/models/graphNode'
import { NodeStruce } from '/@/utils/graphNodes/core'

export const struct: NodeStruce<GraphNodeMakeVector2> = {
  inputs: {
    x: { default: 0 },
    y: { default: 0 },
  },
  computation(_self: GraphNodeMakeVector2, inputs: IVec2): { value: IVec2 } {
    return { value: inputs }
  },
}
