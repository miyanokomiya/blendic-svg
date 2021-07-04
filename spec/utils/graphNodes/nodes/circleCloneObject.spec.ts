import { rotate } from 'okageo'
import * as models from '/@/models'
import * as target from '/@/utils/graphNodes/nodes/circleCloneObject'

describe('src/utils/graphNodes/nodes/circleCloneObject.ts', () => {
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
            count: 2.9,
            radius: 10,
            fix_rotate: false,
          },
          {} as any,
          {
            cloneObject,
            getTransform,
            setTransform,
            createCloneGroupObject,
          } as any
        )
      ).toEqual({ origin: 'a', group: 'b' })
      expect(getTransform).toHaveBeenNthCalledWith(1, 'a')
      expect(createCloneGroupObject).toHaveBeenNthCalledWith(1, 'a')
      expect(cloneObject).toHaveBeenNthCalledWith(1, 'a', { parent: 'b' })
      expect(cloneObject).toHaveBeenNthCalledWith(2, 'a', { parent: 'b' })
      expect(setTransform).toHaveBeenNthCalledWith(
        1,
        '1',
        models.getTransform({
          translate: rotate({ x: 10, y: 0 }, 0),
          rotate: 10,
        })
      )
      expect(setTransform).toHaveBeenNthCalledWith(
        2,
        '2',
        models.getTransform({
          translate: rotate({ x: 10, y: 0 }, Math.PI),
          rotate: 190,
        })
      )
    })
    it('should not rotate cloned object if fix_rotate is true', () => {
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
            count: 2,
            radius: 10,
            fix_rotate: true,
          },
          {} as any,
          {
            cloneObject,
            getTransform,
            setTransform,
            createCloneGroupObject,
          } as any
        )
      ).toEqual({ origin: 'a', group: 'b' })
      expect(setTransform).toHaveBeenNthCalledWith(
        2,
        '2',
        models.getTransform({
          translate: rotate({ x: 10, y: 0 }, Math.PI),
          rotate: 10,
        })
      )
    })
    it('should not clone any objects if count is not positive integer', () => {
      expect(
        target.struct.computation(
          { object: 'a', count: 0, radius: 0, fix_rotate: false },
          {} as any,
          {} as any
        )
      ).toEqual({ origin: 'a', group: '' })
      expect(
        target.struct.computation(
          { object: 'a', count: 0.9, radius: 0, fix_rotate: false },
          {} as any,
          {} as any
        )
      ).toEqual({ origin: 'a', group: '' })
      expect(
        target.struct.computation(
          { object: 'a', count: -2, radius: 0, fix_rotate: false },
          {} as any,
          {} as any
        )
      ).toEqual({ origin: 'a', group: '' })
    })
  })
})
