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

import * as target from '/@/utils/graphNodes/nodes/createObjectClipPath'

describe('src/utils/graphNodes/nodes/createObjectClipPath.ts', () => {
  describe('computation', () => {
    it('should return a created object', () => {
      const createObject = jest.fn().mockReturnValue('a')
      expect(
        target.struct.computation(
          {
            disabled: false,
            parent: 'p',
            relative: true,
          },
          {} as any,
          { createObject } as any
        )
      ).toEqual({
        object: 'a',
        parent: 'p',
      })
      expect(createObject).toHaveBeenCalledWith('clipPath', {
        parent: 'p',
        attributes: {
          clipPathUnits: 'objectBoundingBox',
        },
      })
    })
    it('should not return a created object if disabled = true', () => {
      const createObject = jest.fn().mockReturnValue('a')
      expect(
        target.struct.computation(
          {
            disabled: true,
            parent: 'p',
            relative: true,
          },
          {} as any,
          { createObject } as any
        )
      ).toEqual({
        object: '',
        parent: 'p',
      })
      expect(createObject).not.toHaveBeenCalled()
    })
  })
})
