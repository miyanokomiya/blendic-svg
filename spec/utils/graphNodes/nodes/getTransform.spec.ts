import { getTransform } from '/@/models'
import * as target from '/@/utils/graphNodes/nodes/getTransform'

describe('src/utils/graphNodes/nodes/getTransform.ts', () => {
  describe('computation', () => {
    it('should call getTransform of the context and return the transform', () => {
      const context = {
        getTransform: jest.fn().mockReturnValue(getTransform({ rotate: 10 })),
      }
      expect(
        target.struct.computation(
          {
            object: 'a',
          },
          {} as any,
          context as any
        )
      ).toEqual({ transform: getTransform({ rotate: 10 }) })
      expect(context.getTransform).toHaveBeenCalledWith('a')
    })
  })
})
