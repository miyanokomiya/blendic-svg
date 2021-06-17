import { IVec2 } from 'okageo'
import { getTransform, Transform } from '/@/models'
import { GraphNodeMakeTransform } from '/@/models/graphNode'
import { NodeStruce } from '/@/utils/graphNodes/core'

export const struct: NodeStruce<GraphNodeMakeTransform> = {
  inputs: {
    translate: { default: { x: 0, y: 0 } },
    rotate: { default: 0 },
    scale: { default: { x: 0, y: 0 } },
  },
  computation(
    _self: GraphNodeMakeTransform,
    inputs: { translate: IVec2; rotate: number; scale: IVec2 }
  ): { value: Transform } {
    return {
      value: getTransform({
        translate: inputs.translate,
        rotate: inputs.rotate,
        scale: inputs.scale,
      }),
    }
  },
}
