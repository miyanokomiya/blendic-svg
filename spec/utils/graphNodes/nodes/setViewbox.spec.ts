import * as target from '/@/utils/graphNodes/nodes/setViewbox'

describe('src/utils/graphNodes/nodes/setViewbox.ts', () => {
  describe('computation', () => {
    it('should call setAttributes of the context and return the object', () => {
      const setAttributes = jest.fn()
      expect(
        target.struct.computation(
          {
            object: 'a',
            centered: false,
            x: 1,
            y: 2,
            width: 3,
            height: 4,
          },
          {} as any,
          { setAttributes } as any
        )
      ).toEqual({ object: 'a' })
      expect(setAttributes).toHaveBeenCalledWith('a', {
        viewBox: { x: 1, y: 2, width: 3, height: 4 },
      })
    })
    it('should let viewbox be centered if centered is true', () => {
      const setAttributes = jest.fn()
      expect(
        target.struct.computation(
          {
            object: 'a',
            centered: true,
            x: 0,
            y: 0,
            width: 4,
            height: 10,
          },
          {} as any,
          { setAttributes } as any
        )
      ).toEqual({ object: 'a' })
      expect(setAttributes).toHaveBeenCalledWith('a', {
        viewBox: { x: -2, y: -5, width: 4, height: 10 },
      })
    })
  })
})
