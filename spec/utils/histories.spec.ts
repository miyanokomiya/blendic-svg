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

import { convolute } from '/@/utils/histories'

describe('src/utils/histories.ts', () => {
  describe('convolute', () => {
    it('should convolute history items', () => {
      const undo = jest.fn()
      const redo = jest.fn()
      const head = {
        name: 'head',
        seriesKey: 'key',
        undo: () => undo('head'),
        redo: () => redo('head'),
      }
      const body = [
        {
          name: 'body_1',
          undo: () => undo('body_1'),
          redo: () => redo('body_1'),
        },
        {
          name: 'body_2',
          undo: () => undo('body_2'),
          redo: () => redo('body_2'),
        },
      ]

      const ret = convolute(head, body)
      expect(ret.name).toBe(head.name)
      expect(ret.seriesKey).toBe(head.seriesKey)

      ret.redo()
      expect(redo).toHaveReturnedTimes(3)
      expect(redo).toHaveBeenNthCalledWith(1, 'head')
      expect(redo).toHaveBeenNthCalledWith(2, 'body_1')
      expect(redo).toHaveBeenNthCalledWith(3, 'body_2')

      ret.undo()
      expect(undo).toHaveReturnedTimes(3)
      expect(undo).toHaveBeenNthCalledWith(1, 'head')
      expect(undo).toHaveBeenNthCalledWith(2, 'body_1')
      expect(undo).toHaveBeenNthCalledWith(3, 'body_2')
    })
    it('should ignore undefined items', () => {
      const undo = jest.fn()
      const redo = jest.fn()
      const head = {
        name: 'head',
        seriesKey: 'key',
        undo: () => undo('head'),
        redo: () => redo('head'),
      }
      const body = [
        undefined,
        {
          name: 'body_2',
          undo: () => undo('body_2'),
          redo: () => redo('body_2'),
        },
      ]

      const ret = convolute(head, body)
      expect(ret.name).toBe(head.name)
      expect(ret.seriesKey).toBe(head.seriesKey)

      ret.redo()
      expect(redo).toHaveReturnedTimes(2)
      expect(redo).toHaveBeenNthCalledWith(1, 'head')
      expect(redo).toHaveBeenNthCalledWith(2, 'body_2')

      ret.undo()
      expect(undo).toHaveReturnedTimes(2)
      expect(undo).toHaveBeenNthCalledWith(1, 'head')
      expect(undo).toHaveBeenNthCalledWith(2, 'body_2')
    })
  })
})