import { getTransform } from '/@/models'
import type { GraphNodeSetTransform } from '/@/models/graphNode'
import * as target from '/@/utils/graphNodes/nodes/setTransform'

describe('src/utils/graphNodes/nodes/setTransform.ts', () => {
  const node: GraphNodeSetTransform = {
    id: 'node',
    type: 'set_transform',
    data: {},
    inputs: {
      object: { value: 'a' },
      transform: { value: getTransform() },
    },
    position: { x: 0, y: 0 },
  }

  describe('computation', () => {
    it('should call setTransform of the context and return the object', () => {
      const setTransform = jest.fn()
      expect(
        target.struct.computation(
          {
            object: 'a',
            transform: getTransform({ rotate: 1 }),
          },
          node,
          { setTransform } as any
        )
      ).toEqual({ object: 'a' })
      expect(setTransform).toHaveBeenCalledWith(
        'a',
        getTransform({ rotate: 1 })
      )
    })
  })
})
