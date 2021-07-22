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

import { getTransform } from '/@/models'
import * as target from '/@/utils/graphNodes/nodes/createLinearGradient'

describe('src/utils/graphNodes/nodes/createLinearGradient.ts', () => {
  describe('computation', () => {
    it('should return a created object', () => {
      const createObject = jest.fn().mockReturnValue('a')
      expect(
        target.struct.computation(
          {
            disabled: false,
            parent: 'p',
            relative: true,
            stop: [
              {
                offset: 1,
                color: getTransform({ rotate: 10 }),
                relative: true,
              },
            ],
            from: { x: 0.1, y: 0.2 },
            to: { x: 0.3, y: 0.4 },
          },
          { id: 'a' } as any,
          { createObject } as any
        )
      ).toEqual({ gradient: 'a' })
      expect(createObject).toHaveBeenNthCalledWith(1, 'linearGradient', {
        id: 'a',
        parent: 'p',
        attributes: {
          id: 'a',
          x1: 0.1,
          y1: 0.2,
          x2: 0.3,
          y2: 0.4,
          gradientUnits: 'objectBoundingBox',
        },
      })
      expect(createObject).toHaveBeenNthCalledWith(2, 'stop', {
        id: 'a_stop_0',
        parent: 'a',
        attributes: {
          offset: 1,
          'stop-color': getTransform({ rotate: 10 }),
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
            stop: [
              {
                offset: 0,
                color: getTransform({ rotate: 10 }),
                relative: true,
              },
            ],
            from: { x: 0.1, y: 0.2 },
            to: { x: 0.3, y: 0.4 },
          },
          { id: 'self' } as any,
          { createObject } as any
        )
      ).toEqual({ gradient: '' })
      expect(createObject).not.toHaveBeenCalled()
    })
  })
})
