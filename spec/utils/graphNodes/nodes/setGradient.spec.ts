import * as target from '/@/utils/graphNodes/nodes/setGradient'

describe('src/utils/graphNodes/nodes/setGradient.ts', () => {
  describe('computation', () => {
    it('should call setFill of the context and return the object', () => {
      const setFill = jest.fn()
      const setStroke = jest.fn()
      expect(
        target.struct.computation(
          {
            object: 'a',
            fill_gradient: 'b',
            stroke_gradient: 'c',
          },
          {} as any,
          { setFill, setStroke } as any
        )
      ).toEqual({ object: 'a' })
      expect(setFill).toHaveBeenCalledWith('a', 'b')
      expect(setStroke).toHaveBeenCalledWith('a', 'c')
    })
  })
})
