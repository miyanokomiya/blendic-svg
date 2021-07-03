import { getTransform } from '/@/models'
import * as target from '/@/utils/graphNodes/nodes/hideObject'

describe('src/utils/graphNodes/nodes/hideObject.ts', () => {
  describe('computation', () => {
    it('should call setStroke of the context and return the object', () => {
      const setFill = jest.fn()
      const setStroke = jest.fn()
      expect(
        target.struct.computation(
          { disabled: false, object: 'a' },
          {} as any,
          { setStroke, setFill } as any
        )
      ).toEqual({ object: 'a' })
      expect(setStroke).toHaveBeenCalledWith(
        'a',
        getTransform({ scale: { x: 0, y: 1 } })
      )
      expect(setFill).toHaveBeenCalledWith(
        'a',
        getTransform({ scale: { x: 0, y: 1 } })
      )
    })
    it('should do nohting if disabled is true', () => {
      const setFill = jest.fn()
      const setStroke = jest.fn()
      expect(
        target.struct.computation(
          { disabled: true, object: 'a' },
          {} as any,
          { setStroke, setFill } as any
        )
      ).toEqual({ object: 'a' })
      expect(setStroke).not.toHaveBeenCalled()
      expect(setFill).not.toHaveBeenCalled()
    })
  })
})
