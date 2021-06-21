import * as target from '/@/utils/graphNodes/nodes/cloneObject'

describe('src/utils/graphNodes/nodes/cloneObject.ts', () => {
  describe('computation', () => {
    it('should call cloneObject of the context and return the objects', () => {
      const cloneObject = jest.fn().mockReturnValue('b')
      expect(
        target.struct.computation(
          {
            object: 'a',
          },
          {} as any,
          { cloneObject } as any
        )
      ).toEqual({ origin: 'a', clone: 'b' })
      expect(cloneObject).toHaveBeenCalledWith('a')
    })
  })
})
