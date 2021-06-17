import { getTransform, Transform } from '/@/models'
import { GraphNodeMakeTransform, GRAPH_VALUE_TYPE } from '/@/models/graphNode'
import { NodeStruce } from '/@/utils/graphNodes/core'

export const struct: NodeStruce<GraphNodeMakeTransform> = {
  inputs: {
    translate: { type: GRAPH_VALUE_TYPE.VECTOR2, default: { x: 0, y: 0 } },
    rotate: { type: GRAPH_VALUE_TYPE.SCALER, default: 0 },
    scale: { type: GRAPH_VALUE_TYPE.VECTOR2, default: { x: 0, y: 0 } },
  },
  outputs: {
    value: GRAPH_VALUE_TYPE.TRANSFORM,
  },
  computation(_self, inputs): { value: Transform } {
    return {
      value: getTransform({
        translate: inputs.translate,
        rotate: inputs.rotate,
        scale: inputs.scale,
      }),
    }
  },
}
