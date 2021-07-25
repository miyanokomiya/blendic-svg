import { getTransform } from '/@/models'
import * as target from '/@/utils/graphNodes/nodes/addTransform'

describe('src/utils/graphNodes/nodes/addTransform.ts', () => {
  describe('computation', () => {
    it('should call setTransform of the context and return the object', () => {
      const context = {
        getTransform: jest.fn().mockReturnValue(getTransform({ rotate: 10 })),
        setTransform: jest.fn(),
      }
      expect(
        target.struct.computation(
          {
            object: 'a',
            transform: getTransform({ rotate: 1, scale: { x: 0, y: 0 } }),
          },
          {} as any,
          context as any
        )
      ).toEqual({ object: 'a' })
      expect(context.getTransform).toHaveBeenCalledWith('a')
      expect(context.setTransform).toHaveBeenCalledWith(
        'a',
        getTransform({ rotate: 11 })
      )
    })
  })
})
