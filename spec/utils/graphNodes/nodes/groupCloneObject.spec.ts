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

Copyright (C) 2022, Tomoya Komiyama.
*/

import * as models from '/@/models'
import * as target from '/@/utils/graphNodes/nodes/groupCloneObject'

describe('src/utils/graphNodes/nodes/groupCloneObject.ts', () => {
  describe('computation', () => {
    it('should call some functions of the context to create a group and clone the object under the group', () => {
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
          { object: 'a' },
          { id: 'b' } as any,
          {
            cloneObject,
            getTransform,
            setTransform,
            createCloneGroupObject,
          } as any
        )
      ).toEqual({ origin: 'a', group: 'b', clone: '1' })
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
      expect(setTransform).toHaveBeenNthCalledWith(
        1,
        '1',
        models.getTransform({ rotate: 10 })
      )
    })
  })
})
