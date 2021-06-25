import { getTransform } from '/@/models'
import type { GraphNodeSetFill } from '/@/models/graphNode'
import * as target from '/@/utils/graphNodes/nodes/setFill'

describe('src/utils/graphNodes/nodes/setFill.ts', () => {
  const node: GraphNodeSetFill = {
    id: 'node',
    type: 'set_fill',
    data: {},
    inputs: {
      object: { value: 'a' },
      color: { value: getTransform() },
    },
    position: { x: 0, y: 0 },
  }

  describe('computation', () => {
    it('should call setFill of the context and return the object', () => {
      const setFill = jest.fn()
      expect(
        target.struct.computation(
          {
            object: 'a',
            color: getTransform({ rotate: 1 }),
          },
          node,
          { setFill } as any
        )
      ).toEqual({ object: 'a' })
      expect(setFill).toHaveBeenCalledWith('a', getTransform({ rotate: 1 }))
    })
  })
})
