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
