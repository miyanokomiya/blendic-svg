import { getTransform, Transform } from '/@/models'
import { GraphNodeMakeTransform, GRAPH_VALUE_TYPE } from '/@/models/graphNode'
import { createBaseNode, NodeStruct } from '/@/utils/graphNodes/core'

export const struct: NodeStruct<GraphNodeMakeTransform> = {
  create(arg = {}) {
    return {
      ...createBaseNode({
        inputs: {
          translate: { value: { x: 0, y: 0 } },
          rotate: { value: 0 },
          scale: { value: { x: 1, y: 1 } },
        },
        ...arg,
      }),
      type: 'make_transform',
    } as GraphNodeMakeTransform
  },
  data: {},
  inputs: {
    translate: { type: GRAPH_VALUE_TYPE.VECTOR2, default: { x: 0, y: 0 } },
    rotate: { type: GRAPH_VALUE_TYPE.SCALER, default: 0 },
    scale: { type: GRAPH_VALUE_TYPE.VECTOR2, default: { x: 1, y: 1 } },
  },
  outputs: {
    transform: GRAPH_VALUE_TYPE.TRANSFORM,
  },
  computation(inputs): { transform: Transform } {
    return {
      transform: getTransform({
        translate: inputs.translate,
        rotate: inputs.rotate,
        scale: inputs.scale,
      }),
    }
  },
  width: 140,
}
