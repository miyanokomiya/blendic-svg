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

import {
  convolute,
  getAddItemHistory,
  getReplaceItem,
  getSelectItemHistory,
  hasSameSeriesKey,
} from '/@/utils/histories'

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
    it('should set name if it is passed', () => {
      const head = {
        name: 'original',
        seriesKey: 'key',
        undo: () => {},
        redo: () => {},
      }

      const ret = convolute(head, [], 'changed')
      expect(ret.name).toBe('changed')
    })
  })

  describe('getReplaceItem', () => {
    it('should return history item to do', () => {
      const setFn = jest.fn()
      const item = getReplaceItem({ a: 1 }, { b: 2 }, setFn)
      expect(setFn).toHaveBeenCalledTimes(0)
      item.redo()
      expect(setFn).toHaveBeenLastCalledWith({ b: 2 })
      item.undo()
      expect(setFn).toHaveBeenLastCalledWith({ a: 1 })
    })

    it('should set name and seriesKey if its are passed', () => {
      const ret = getReplaceItem({}, {}, () => {}, 'name', 'seriesKey')
      expect(ret.name).toBe('name')
      expect(ret.seriesKey).toBe('seriesKey')
    })
  })

  describe('hasSameSeriesKey', () => {
    it('should return false if some keys are undefined', () => {
      expect(
        hasSameSeriesKey({ seriesKey: undefined }, { seriesKey: 'b' })
      ).toBe(false)
      expect(
        hasSameSeriesKey({ seriesKey: 'a' }, { seriesKey: undefined })
      ).toBe(false)
    })
    it('should return false if both keys are not same', () => {
      expect(hasSameSeriesKey({ seriesKey: 'a' }, { seriesKey: 'b' })).toBe(
        false
      )
    })
    it('should return true if both keys are same', () => {
      expect(hasSameSeriesKey({ seriesKey: 'a' }, { seriesKey: 'a' })).toBe(
        true
      )
    })
  })

  describe('getAddItemHistory', () => {
    it('should return a history item to add an item', () => {
      const accessor = {
        get: jest.fn().mockReturnValue([]),
        set: jest.fn(),
      }
      const val = { id: 'a' }
      const ret = getAddItemHistory(accessor, val)
      ret.redo()
      expect(accessor.set).toHaveBeenCalledWith([val])
      ret.undo()
      expect(accessor.set).toHaveBeenCalledWith([])
    })
  })

  describe('getSelectItemHistory', () => {
    it('should return a history item to select an item', () => {
      const selectedNodesAccessor = {
        get: jest.fn().mockReturnValue({}),
        set: jest.fn(),
      }
      const lastSelectedNodeAccessor = {
        get: jest.fn().mockReturnValue(''),
        set: jest.fn(),
      }
      const ret = getSelectItemHistory(
        selectedNodesAccessor,
        lastSelectedNodeAccessor,
        'a'
      )
      ret.redo()
      expect(selectedNodesAccessor.set).toHaveBeenCalledWith({ a: true })
      expect(lastSelectedNodeAccessor.set).toHaveBeenCalledWith('a')
      ret.undo()
      expect(selectedNodesAccessor.set).toHaveBeenCalledWith({})
      expect(lastSelectedNodeAccessor.set).toHaveBeenCalledWith('')
    })
  })
})
