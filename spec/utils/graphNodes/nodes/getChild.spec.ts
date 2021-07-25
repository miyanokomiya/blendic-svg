import * as target from '/@/utils/graphNodes/nodes/getChild'

describe('src/utils/graphNodes/nodes/getChild.ts', () => {
  describe('computation', () => {
    it('should return child id of the index', () => {
      const getChildId = jest.fn().mockImplementation((_id, index: number) => {
        return `c_${index}`
      })
      expect(
        target.struct.computation(
          { object: 'a', index: 0 },
          {} as any,
          { getChildId } as any
        )
      ).toEqual({ child: 'c_0' })
      expect(getChildId).toHaveBeenNthCalledWith(1, 'a', 0)
      expect(getChildId).toHaveReturnedTimes(1)
    })
  })
})
