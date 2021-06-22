import type { GraphNodeGetObject } from '/@/models/graphNode'
import * as target from '/@/utils/graphNodes/nodes/getObject'

describe('src/utils/graphNodes/nodes/getObject.ts', () => {
  const node: GraphNodeGetObject = {
    id: 'node',
    type: 'get_object',
    data: { object: 'a' },
    inputs: {},
    position: { x: 0, y: 0 },
  }

  describe('computation', () => {
    it('should return object id of data', () => {
      expect(target.struct.computation({}, node, {} as any)).toEqual({
        object: 'a',
      })
    })
  })
})
