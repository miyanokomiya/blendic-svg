import { getTransform } from '/@/models'
import type { GraphNodeSetStroke } from '/@/models/graphNode'
import * as target from '/@/utils/graphNodes/nodes/setStroke'

describe('src/utils/graphNodes/nodes/setStroke.ts', () => {
  const node: GraphNodeSetStroke = {
    id: 'node',
    type: 'set_stroke',
    data: {},
    inputs: {
      object: { value: 'a' },
      color: { value: getTransform() },
    },
    position: { x: 0, y: 0 },
  }

  describe('computation', () => {
    it('should call setStroke of the context and return the object', () => {
      const setStroke = jest.fn()
      expect(
        target.struct.computation(
          {
            object: 'a',
            color: getTransform({ rotate: 1 }),
          },
          node,
          { setStroke } as any
        )
      ).toEqual({ object: 'a' })
      expect(setStroke).toHaveBeenCalledWith('a', getTransform({ rotate: 1 }))
    })
  })
})
