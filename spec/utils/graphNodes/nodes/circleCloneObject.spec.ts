/*
This file is part of Blendic SVG.

Blendic SVG is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Blendic SVG is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with Blendic SVG.  If not, see <https://www.gnu.org/licenses/>.

Copyright (C) 2021, Tomoya Komiyama.
*/

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
            rotate: 90,
            count: 2.9,
            radius: 10,
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
      expect(setTransform).toHaveBeenNthCalledWith(
        1,
        '1',
        models.getTransform({
          translate: rotate({ x: 10, y: 0 }, Math.PI / 2),
          rotate: 10,
        })
      )
      expect(setTransform).toHaveBeenNthCalledWith(
        2,
        '2',
        models.getTransform({
          translate: rotate({ x: 10, y: 0 }, Math.PI * 1.5),
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
            rotate: 0,
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
          { object: 'a', rotate: 0, count: 0, radius: 0, fix_rotate: false },
          {} as any,
          {} as any
        )
      ).toEqual({ origin: 'a', group: '' })
      expect(
        target.struct.computation(
          { object: 'a', rotate: 0, count: 0.9, radius: 0, fix_rotate: false },
          {} as any,
          {} as any
        )
      ).toEqual({ origin: 'a', group: '' })
      expect(
        target.struct.computation(
          { object: 'a', rotate: 0, count: -2, radius: 0, fix_rotate: false },
          {} as any,
          {} as any
        )
      ).toEqual({ origin: 'a', group: '' })
    })
  })
})
