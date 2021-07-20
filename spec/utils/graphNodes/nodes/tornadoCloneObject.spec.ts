import * as models from '/@/models'
import * as target from '/@/utils/graphNodes/nodes/tornadoCloneObject'

describe('src/utils/graphNodes/nodes/tornadoCloneObject.ts', () => {
  describe('computation', () => {
    it('should call some functions of the context to clone a group and return the group object', () => {
      let count = 0
      const getTransform = jest
        .fn()
        .mockReturnValue(models.getTransform({ rotate: 10 }))
      const setTransform = jest.fn()
      const createCloneGroupObject = jest.fn().mockReturnValue('b')
      const cloneObject = jest.fn().mockImplementation(() => {
        count++
        return count.toString()
      })
      expect(
        target.struct.computation(
          {
            object: 'a',
            rotate: 90,
            max_rotate: 360,
            interval: 90,
            offset: 90,
            radius: 100,
            radius_grow: 2,
            scale_grow: 2,
            fix_rotate: false,
          },
          { id: 'b' } as any,
          {
            cloneObject,
            getTransform,
            setTransform,
            createCloneGroupObject,
          } as any
        )
      ).toEqual({ origin: 'a', group: 'b' })
      expect(getTransform).toHaveBeenNthCalledWith(1, 'a')
      expect(createCloneGroupObject).toHaveBeenNthCalledWith(1, 'a', {
        id: 'b',
      })
      expect(cloneObject).toHaveBeenNthCalledWith(
        1,
        'a',
        { parent: 'b' },
        'b_0'
      )
      expect(cloneObject).toHaveBeenNthCalledWith(
        2,
        'a',
        { parent: 'b' },
        'b_1'
      )
      expect(setTransform).toHaveReturnedTimes(4)
    })
    it('should not clone if some parameters are invalid', () => {
      const node = {
        object: 'a',
        rotate: 90,
        max_rotate: 360,
        interval: 90,
        offset: 90,
        radius: 100,
        radius_grow: 2,
        scale_grow: 2,
        fix_rotate: false,
      } as any
      const cloneObject = jest.fn()

      expect(
        target.struct.computation(
          { ...node, object: '' },
          { id: 'b' } as any,
          { cloneObject } as any
        )
      ).toEqual({ origin: '', group: '' })
      expect(cloneObject).not.toHaveBeenCalled()

      expect(
        target.struct.computation(
          { ...node, max_rotate: -10 },
          { id: 'b' } as any,
          { cloneObject } as any
        )
      ).toEqual({ origin: 'a', group: '' })
      expect(cloneObject).not.toHaveBeenCalled()

      expect(
        target.struct.computation(
          { ...node, interval: -10 },
          { id: 'b' } as any,
          { cloneObject } as any
        )
      ).toEqual({ origin: 'a', group: '' })
      expect(cloneObject).not.toHaveBeenCalled()

      expect(
        target.struct.computation(
          { ...node, radius: -10 },
          { id: 'b' } as any,
          { cloneObject } as any
        )
      ).toEqual({ origin: 'a', group: '' })
      expect(cloneObject).not.toHaveBeenCalled()

      expect(
        target.struct.computation(
          { ...node, radius_grow: -10 },
          { id: 'b' } as any,
          { cloneObject } as any
        )
      ).toEqual({ origin: 'a', group: '' })
      expect(cloneObject).not.toHaveBeenCalled()

      expect(
        target.struct.computation(
          { ...node, scale_grow: -10 },
          { id: 'b' } as any,
          { cloneObject } as any
        )
      ).toEqual({ origin: 'a', group: '' })
      expect(cloneObject).not.toHaveBeenCalled()
    })
  })
})
