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

import * as target from '/@/utils/graphNodes/nodes/setClipPath'

describe('src/utils/graphNodes/nodes/setClipPath.ts', () => {
  describe('computation', () => {
    it('should call setAttributes of the context and return the object', () => {
      const setAttributes = jest.fn()
      expect(
        target.struct.computation(
          {
            object: 'a',
            clip_path: 'clip',
          },
          { id: 'clip' } as any,
          { setAttributes } as any
        )
      ).toEqual({ object: 'a' })
      expect(setAttributes).toHaveBeenNthCalledWith(1, 'a', {
        'clip-path': 'url(#clip)',
      })
      expect(setAttributes).toHaveBeenNthCalledWith(2, 'clip', {
        id: 'clip',
      })
    })
  })
})
