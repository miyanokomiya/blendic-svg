import { GraphNodeGetObject, GRAPH_VALUE_TYPE } from '/@/models/graphNode'
import { createBaseNode, NodeStruct } from '/@/utils/graphNodes/core'

export const struct: NodeStruct<GraphNodeGetObject> = {
  create(arg = {}) {
    return {
      ...createBaseNode({
        data: { object: '' },
        inputs: {},
        ...arg,
      }),
      type: 'get_object',
    } as GraphNodeGetObject
  },
  data: { object: { type: GRAPH_VALUE_TYPE.OBJECT } },
  inputs: {},
  outputs: {
    object: GRAPH_VALUE_TYPE.OBJECT,
  },
  computation(_inputs, self, _context): { object: string } {
    return {
      object: self.data.object,
    }
  },
  width: 120,
  color: '#dc143c',
  textColor: '#fff',
}
