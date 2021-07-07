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
import * as target from '/@/utils/graphNodes/nodes/createObjectText'

describe('src/utils/graphNodes/nodes/createObjectText.ts', () => {
  describe('computation', () => {
    it('should return a created object', () => {
      const createObject = jest.fn().mockReturnValue('a')
      expect(
        target.struct.computation(
          {
            disabled: false,
            parent: 'p',
            transform: getTransform({ rotate: 10 }),
            fill: getTransform({ rotate: 11 }),
            stroke: getTransform({ rotate: 12 }),
            'stroke-width': 2,
            centered: false,
            x: 2,
            y: 3,
            dx: 12,
            dy: 13,
            text: 'abc',
            'font-size': 5,
          },
          {} as any,
          { createObject } as any
        )
      ).toEqual({
        object: 'a',
      })
      expect(createObject).toHaveBeenCalledWith('text', {
        transform: getTransform({ rotate: 10 }),
        fill: getTransform({ rotate: 11 }),
        stroke: getTransform({ rotate: 12 }),
        'stroke-width': 2,
        parent: 'p',
        text: 'abc',
        attributes: {
          x: 2,
          y: 3,
          dx: 12,
          dy: 13,
          'font-size': 5,
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
            transform: getTransform({ rotate: 10 }),
            fill: getTransform({ rotate: 11 }),
            stroke: getTransform({ rotate: 12 }),
            'stroke-width': 2,
            centered: false,
            x: 2,
            y: 3,
            dx: 12,
            dy: 13,
            text: 'abc',
            'font-size': 5,
          },
          {} as any,
          { createObject } as any
        )
      ).toEqual({
        object: '',
      })
      expect(createObject).not.toHaveBeenCalled()
    })
    it('should center the object if centered is true', () => {
      const createObject = jest.fn().mockReturnValue('a')
      expect(
        target.struct.computation(
          {
            disabled: false,
            parent: 'p',
            transform: getTransform({ rotate: 10 }),
            fill: getTransform({ rotate: 11 }),
            stroke: getTransform({ rotate: 12 }),
            'stroke-width': 2,
            centered: true,
            x: 2,
            y: 3,
            dx: 12,
            dy: 13,
            text: 'abc',
            'font-size': 5,
          },
          {} as any,
          { createObject } as any
        )
      ).toEqual({
        object: 'a',
      })
      expect(createObject).toHaveBeenCalledWith('text', {
        transform: getTransform({ rotate: 10 }),
        fill: getTransform({ rotate: 11 }),
        stroke: getTransform({ rotate: 12 }),
        'stroke-width': 2,
        parent: 'p',
        text: 'abc',
        attributes: {
          x: 2,
          y: 3,
          dx: 12,
          dy: 13,
          'font-size': 5,
          'text-anchor': 'middle',
          'dominant-baseline': 'middle',
        },
      })
    })
  })
})
