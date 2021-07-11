import * as target from '/@/utils/graphNodes/nodes/setStrokeLength'

describe('src/utils/graphNodes/nodes/setStrokeLength.ts', () => {
  describe('computation', () => {
    it('should call setAttributes to set stroke-dasharray and stroke-dashoffset', () => {
      const setAttributes = jest.fn()
      expect(
        target.struct.computation(
          {
            object: 'a',
            length: 2,
            max_length: 10,
          },
          {} as any,
          { setAttributes } as any
        )
      ).toEqual({ object: 'a' })
      expect(setAttributes).toHaveBeenCalledWith('a', {
        'stroke-dasharray': '10',
        'stroke-dashoffset': 8,
      })
    })
  })
})
