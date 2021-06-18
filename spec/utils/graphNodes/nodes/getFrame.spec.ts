import { getTransform } from '/@/models'
import type { GraphNodeGetFrame } from '/@/models/graphNode'
import * as target from '/@/utils/graphNodes/nodes/getFrame'

describe('src/utils/graphNodes/nodes/getFrame.ts', () => {
  const node: GraphNodeGetFrame = {
    id: 'node',
    type: 'get_frame',
    data: {},
    inputs: {},
    position: { x: 0, y: 0 },
  }

  describe('computation', () => {
    it('should call getFrame of the context and return', () => {
      const getFrame = jest.fn().mockReturnValue(10)
      expect(
        target.struct.computation(
          {
            object: 'a',
            transform: getTransform({ rotate: 1 }),
          },
          node,
          { getFrame } as any
        )
      ).toEqual({ value: 10 })
      expect(getFrame).toHaveReturnedTimes(1)
    })
  })
})
