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

import * as target from '/@/utils/graphNodes/nodes/makePathM'

describe('src/utils/graphNodes/nodes/makePathM.ts', () => {
  describe('computation', () => {
    it('should return a created object', () => {
      const createObject = jest.fn().mockReturnValue('a')
      expect(
        target.struct.computation(
          {
            d: ['M1,2'],
            relative: false,
            p: { x: 10, y: 20 },
          },
          {} as any,
          { createObject } as any
        )
      ).toEqual({
        d: ['M1,2', 'M10,20'],
      })
      expect(
        target.struct.computation(
          {
            d: ['M1,2'],
            relative: true,
            p: { x: 10, y: 20 },
          },
          {} as any,
          { createObject } as any
        )
      ).toEqual({
        d: ['M1,2', 'm10,20'],
      })
    })
  })
})
