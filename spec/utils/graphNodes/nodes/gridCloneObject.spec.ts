import * as models from '/@/models'
import * as target from '/@/utils/graphNodes/nodes/gridCloneObject'

describe('src/utils/graphNodes/nodes/gridCloneObject.ts', () => {
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
            centered: false,
            rotate: 0,
            row: 2,
            column: 3,
            width: 10,
            height: 20,
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
        models.getTransform({ translate: { x: 0, y: 0 }, rotate: 10 })
      )
      expect(setTransform).toHaveBeenNthCalledWith(
        2,
        '2',
        models.getTransform({ translate: { x: 10, y: 0 }, rotate: 10 })
      )
      expect(setTransform).toHaveBeenNthCalledWith(
        3,
        '3',
        models.getTransform({ translate: { x: 20, y: 0 }, rotate: 10 })
      )
      expect(setTransform).toHaveBeenNthCalledWith(
        4,
        '4',
        models.getTransform({ translate: { x: 0, y: 20 }, rotate: 10 })
      )
      expect(setTransform).toHaveBeenNthCalledWith(
        5,
        '5',
        models.getTransform({ translate: { x: 10, y: 20 }, rotate: 10 })
      )
      expect(setTransform).toHaveBeenNthCalledWith(
        6,
        '6',
        models.getTransform({ translate: { x: 20, y: 20 }, rotate: 10 })
      )
    })
    it('should center the group if centered is true', () => {
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
            centered: true,
            rotate: 0,
            row: 2,
            column: 2,
            width: 10,
            height: 20,
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
        1,
        '1',
        models.getTransform({ translate: { x: -5, y: -10 }, rotate: 10 })
      )
      expect(setTransform).toHaveBeenNthCalledWith(
        2,
        '2',
        models.getTransform({ translate: { x: 5, y: -10 }, rotate: 10 })
      )
      expect(setTransform).toHaveBeenNthCalledWith(
        3,
        '3',
        models.getTransform({ translate: { x: -5, y: 10 }, rotate: 10 })
      )
      expect(setTransform).toHaveBeenNthCalledWith(
        4,
        '4',
        models.getTransform({ translate: { x: 5, y: 10 }, rotate: 10 })
      )
    })
    it('should rotate the positions of the members', () => {
      let count = 0
      const getTransform = jest
        .fn()
        .mockReturnValue(models.getTransform({ rotate: 10 }))
      const setTransform = jest
        .fn()
        .mockImplementation((id: string, transform: models.Transform) => {
          if (id === '1') {
            expect(transform.translate.x).toBeCloseTo(0)
            expect(transform.translate.y).toBeCloseTo(-5)
          } else if (id === '2') {
            expect(transform.translate.x).toBeCloseTo(0)
            expect(transform.translate.y).toBeCloseTo(5)
          }
        })
      const createCloneGroupObject = jest.fn().mockReturnValue('b')
      const cloneObject = jest.fn().mockImplementation(() => {
        count++
        return count.toString()
      })
      target.struct.computation(
        {
          object: 'a',
          centered: true,
          rotate: 90,
          row: 1,
          column: 2,
          width: 10,
          height: 10,
        },
        {} as any,
        {
          cloneObject,
          getTransform,
          setTransform,
          createCloneGroupObject,
        } as any
      )
      expect.assertions(4)
    })
    it('should not clone any objects if count is not positive integer', () => {
      const inputs = {
        object: 'a',
        centered: false,
        rotate: 0,
        row: 2,
        column: 3,
        width: 10,
        height: 20,
      }
      expect(
        target.struct.computation({ ...inputs, row: 0 }, {} as any, {} as any)
      ).toEqual({ origin: 'a', group: '' })
      expect(
        target.struct.computation(
          { ...inputs, column: 0 },
          {} as any,
          {} as any
        )
      ).toEqual({ origin: 'a', group: '' })
    })
  })
})
