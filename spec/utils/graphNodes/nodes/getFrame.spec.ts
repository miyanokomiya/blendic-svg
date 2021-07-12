import { getTransform } from '/@/models'
import * as target from '/@/utils/graphNodes/nodes/getFrame'

describe('src/utils/graphNodes/nodes/getFrame.ts', () => {
  describe('computation', () => {
    it('should call getFrame of the context and return', () => {
      const getFrameInfo = jest.fn().mockReturnValue({
        currentFrame: 10,
        endFrame: 20,
      })
      expect(
        target.struct.computation(
          {
            object: 'a',
            transform: getTransform({ rotate: 1 }),
          },
          {} as any,
          { getFrameInfo } as any
        )
      ).toEqual({ frame: 10, end_frame: 20 })
      expect(getFrameInfo).toHaveReturnedTimes(1)
    })
  })
})
