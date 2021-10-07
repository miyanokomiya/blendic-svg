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
  useItemSelectable,
  useAttrsSelectable,
  useGeneAttrsSelectable,
} from '../../src/composables/selectable'

describe('src/composables/selectable.ts', () => {
  describe('useItemSelectable', () => {
    const items = {
      a: { id: 'a' },
      b: { id: 'b' },
    }

    describe('getSelectHistory', () => {
      it('should return history item to select', () => {
        const target = useItemSelectable('Test', () => items)
        const item = target.getSelectHistory('a')
        expect(target.selectedMap.value).toEqual({})
        item.redo()
        expect(target.selectedMap.value).toEqual({ a: true })
        item.undo()
        expect(target.selectedMap.value).toEqual({})
      })
      it('should return history item to clear all if empty id is passed', () => {
        const target = useItemSelectable('Test', () => items)
        target.getSelectHistory('a').redo()
        const item = target.getSelectHistory('')
        expect(target.selectedMap.value).toEqual({ a: true })
        item.redo()
        expect(target.selectedMap.value).toEqual({})
        item.undo()
        expect(target.selectedMap.value).toEqual({ a: true })
      })
    })

    describe('getSelectHistoryDryRun', () => {
      it('should return true only if an operation to select updates the state', () => {
        const target = useItemSelectable('Test', () => items)
        expect(target.getSelectHistoryDryRun('')).toBe(false)
        expect(target.getSelectHistoryDryRun('a')).toBe(true)
        target.getSelectHistory('a').redo()
        expect(target.getSelectHistoryDryRun('a')).toBe(false)
        expect(target.getSelectHistoryDryRun('a', true)).toBe(true)
        expect(target.getSelectHistoryDryRun('')).toBe(true)
        target.getSelectHistory('b', true).redo()
        expect(target.getSelectHistoryDryRun('a')).toBe(true)
        expect(target.getSelectHistoryDryRun('b')).toBe(true)
      })
    })

    describe('getMultiSelectHistory', () => {
      it('should return history item to multi select', () => {
        const target = useItemSelectable('Test', () => items)
        const item = target.getMultiSelectHistory(['a', 'b'])
        expect(target.selectedMap.value).toEqual({})
        item.redo()
        expect(target.selectedMap.value).toEqual({ a: true, b: true })
        item.undo()
        expect(target.selectedMap.value).toEqual({})
      })
    })

    describe('getMultiSelectHistoryDryRun', () => {
      it('should return true only if an operation to select updates the state', () => {
        const target = useItemSelectable('Test', () => items)
        expect(target.getMultiSelectHistoryDryRun([])).toBe(false)
        expect(target.getMultiSelectHistoryDryRun(['a', 'b'])).toBe(true)
        target.getMultiSelectHistory(['a', 'b']).redo()
        expect(target.getMultiSelectHistoryDryRun(['a', 'b'])).toBe(false)
        expect(target.getMultiSelectHistoryDryRun(['b', 'a'])).toBe(false)
        expect(target.getMultiSelectHistoryDryRun(['b'])).toBe(true)
        expect(target.getMultiSelectHistoryDryRun(['a', 'b', 'c'])).toBe(true)
        expect(target.getMultiSelectHistoryDryRun([])).toBe(true)
      })
    })

    describe('getSelectAllHistory', () => {
      it('should return history item to select all', () => {
        const target = useItemSelectable('Test', () => items)
        const item = target.getSelectAllHistory()
        expect(target.selectedMap.value).toEqual({})
        item.redo()
        expect(target.selectedMap.value).toEqual({ a: true, b: true })
        item.undo()
        expect(target.selectedMap.value).toEqual({})
      })
    })

    describe('getClearAllHistory', () => {
      it('should return history item to clear all selections', () => {
        const target = useItemSelectable('Test', () => items)
        target.getSelectAllHistory().redo()
        const item = target.getClearAllHistory()
        expect(target.selectedMap.value).toEqual({ a: true, b: true })
        item.redo()
        expect(target.selectedMap.value).toEqual({})
        item.undo()
        expect(target.selectedMap.value).toEqual({ a: true, b: true })
      })
    })
  })

  describe('useAttrsSelectable', () => {
    const items = {
      a: { id: 'a' },
      b: { id: 'b' },
    }

    describe('allAttrsSelectedIds', () => {
      it('should return computed ids whose all attrs have been selected', () => {
        const target = useAttrsSelectable('Test', () => items, ['x', 'y'])
        const ret = target.allAttrsSelectedIds
        expect(ret.value).toEqual([])
        target.getSelectHistory('a', 'x', true).redo()
        expect(ret.value).toEqual([])
        target.getSelectHistory('a', 'y', true).redo()
        expect(ret.value).toEqual(['a'])
        target.getMultiSelectHistory({ b: { x: true, y: true } }, true).redo()
        expect(ret.value).toEqual(['a', 'b'])
      })
    })

    describe('getSelectHistory', () => {
      it('should return history item to select', () => {
        const target = useAttrsSelectable('Test', () => items, ['x', 'y'])
        const item = target.getSelectHistory('a', 'x')
        expect(target.selectedMap.value).toEqual({})
        item.redo()
        expect(target.selectedMap.value).toEqual({ a: { x: true } })
        item.undo()
        expect(target.selectedMap.value).toEqual({})
      })
      it('should return history item to clear all if empty id is passed', () => {
        const target = useAttrsSelectable('Test', () => items, ['x', 'y'])
        target.getSelectHistory('a', 'x').redo()
        const item = target.getSelectHistory('', 'x')
        expect(target.selectedMap.value).toEqual({ a: { x: true } })
        item.redo()
        expect(target.selectedMap.value).toEqual({})
        item.undo()
        expect(target.selectedMap.value).toEqual({ a: { x: true } })
      })
    })

    describe('getSelectHistoryDryRun', () => {
      it('should return true only if an operation to select updates the state', () => {
        const target = useAttrsSelectable('Test', () => items, ['x', 'y'])
        expect(target.getSelectHistoryDryRun('', 'x')).toBe(false)
        expect(target.getSelectHistoryDryRun('a', 'x')).toBe(true)
        target.getSelectHistory('a', 'x').redo()
        expect(target.getSelectHistoryDryRun('', 'x')).toBe(true)
        expect(target.getSelectHistoryDryRun('a', 'x')).toBe(false)
        expect(target.getSelectHistoryDryRun('a', 'x', true)).toBe(true)
        target.getSelectHistory('b', 'x', true).redo()
        expect(target.getSelectHistoryDryRun('a', 'x')).toBe(true)
        expect(target.getSelectHistoryDryRun('b', 'x')).toBe(true)
        target.getSelectHistory('a', 'y', true).redo()
        expect(target.getSelectHistoryDryRun('a', 'x')).toBe(true)
        expect(target.getSelectHistoryDryRun('a', 'y')).toBe(true)
      })
    })

    describe('getMultiSelectHistory', () => {
      it('should return history item to multi select', () => {
        const target = useAttrsSelectable('Test', () => items, ['x', 'y'])
        const item = target.getMultiSelectHistory({
          a: { x: true },
          b: { y: true },
        })
        expect(target.selectedMap.value).toEqual({})
        item.redo()
        expect(target.selectedMap.value).toEqual({
          a: { x: true },
          b: { y: true },
        })
        item.undo()
        expect(target.selectedMap.value).toEqual({})
      })
    })

    describe('getSelectAllHistory', () => {
      it('should return history item to select all', () => {
        const target = useAttrsSelectable('Test', () => items, ['x', 'y'])
        const item = target.getSelectAllHistory()
        expect(target.selectedMap.value).toEqual({})
        item.redo()
        expect(target.selectedMap.value).toEqual({
          a: { x: true, y: true },
          b: { x: true, y: true },
        })
        item.undo()
        expect(target.selectedMap.value).toEqual({})
      })
    })

    describe('getClearAllHistory', () => {
      it('should return history item to clear all selections', () => {
        const target = useAttrsSelectable('Test', () => items, ['x', 'y'])
        target.getSelectAllHistory().redo()
        const item = target.getClearAllHistory()
        expect(target.selectedMap.value).toEqual({
          a: { x: true, y: true },
          b: { x: true, y: true },
        })
        item.redo()
        expect(target.selectedMap.value).toEqual({})
        item.undo()
        expect(target.selectedMap.value).toEqual({
          a: { x: true, y: true },
          b: { x: true, y: true },
        })
      })
    })
  })

  describe('useGeneAttrsSelectable', () => {
    const items = {
      a: { id: 'a', name: 's' },
      b: { id: 'b', name: 't' },
    }
    const getItems = () => items
    const getItemType = (item: any) => item.name
    const allKeys = {
      s: ['x', 'y'],
      t: ['p', 'q'],
    }

    describe('allAttrsSelectedIds', () => {
      it('should return computed ids whose all props have been selected', () => {
        const target = useGeneAttrsSelectable(
          'Test',
          getItems,
          getItemType,
          allKeys
        )
        const ret = target.allAttrsSelectedIds
        expect(ret.value).toEqual([])
        target.getSelectHistory('a', 'x', true).redo()
        expect(ret.value).toEqual([])
        target.getSelectHistory('a', 'y', true).redo()
        expect(ret.value).toEqual(['a'])
        target
          .getMultiSelectHistory(
            { b: { name: 't', props: { p: true, q: true } } },
            true
          )
          .redo()
        expect(ret.value).toEqual(['a', 'b'])
      })
    })

    describe('getSelectHistory', () => {
      it('should return history item to select', () => {
        const target = useGeneAttrsSelectable(
          'Test',
          getItems,
          getItemType,
          allKeys
        )
        const item = target.getSelectHistory('a', 'x')
        expect(target.selectedMap.value).toEqual({})
        item.redo()
        expect(target.selectedMap.value).toEqual({
          a: { name: 's', props: { x: true } },
        })
        item.undo()
        expect(target.selectedMap.value).toEqual({})
      })
      it('should return history item to clear all if empty id is passed', () => {
        const target = useGeneAttrsSelectable(
          'Test',
          getItems,
          getItemType,
          allKeys
        )
        target.getSelectHistory('a', 'x').redo()
        const item = target.getSelectHistory('', 'x')
        expect(target.selectedMap.value).toEqual({
          a: { name: 's', props: { x: true } },
        })
        item.redo()
        expect(target.selectedMap.value).toEqual({})
        item.undo()
        expect(target.selectedMap.value).toEqual({
          a: { name: 's', props: { x: true } },
        })
      })
    })

    describe('getSelectHistoryDryRun', () => {
      it('should return true only if an operation to select updates the state', () => {
        const target = useGeneAttrsSelectable(
          'Test',
          getItems,
          getItemType,
          allKeys
        )
        expect(target.getSelectHistoryDryRun('', 'x')).toBe(false)
        expect(target.getSelectHistoryDryRun('a', 'x')).toBe(true)
        target.getSelectHistory('a', 'x').redo()
        expect(target.getSelectHistoryDryRun('', 'x')).toBe(true)
        expect(target.getSelectHistoryDryRun('a', 'x')).toBe(false)
        expect(target.getSelectHistoryDryRun('a', 'x', true)).toBe(true)
        target.getSelectHistory('b', 'x', true).redo()
        expect(target.getSelectHistoryDryRun('a', 'x')).toBe(true)
        expect(target.getSelectHistoryDryRun('b', 'x')).toBe(true)
        target.getSelectHistory('a', 'y', true).redo()
        expect(target.getSelectHistoryDryRun('a', 'x')).toBe(true)
        expect(target.getSelectHistoryDryRun('a', 'y')).toBe(true)
      })
    })

    describe('getMultiSelectHistory', () => {
      it('should return history item to multi select', () => {
        const target = useGeneAttrsSelectable(
          'Test',
          getItems,
          getItemType,
          allKeys
        )
        const item = target.getMultiSelectHistory({
          a: { name: 's', props: { x: true } },
          b: { name: 't', props: { q: true } },
        })
        expect(target.selectedMap.value).toEqual({})
        item.redo()
        expect(target.selectedMap.value).toEqual({
          a: { name: 's', props: { x: true } },
          b: { name: 't', props: { q: true } },
        })
        item.undo()
        expect(target.selectedMap.value).toEqual({})
      })
    })

    describe('getSelectAllHistory', () => {
      it('should return history item to select all', () => {
        const target = useGeneAttrsSelectable(
          'Test',
          getItems,
          getItemType,
          allKeys
        )
        const item = target.getSelectAllHistory()
        expect(target.selectedMap.value).toEqual({})
        item.redo()
        expect(target.selectedMap.value).toEqual({
          a: { name: 's', props: { x: true, y: true } },
          b: { name: 't', props: { p: true, q: true } },
        })
        item.undo()
        expect(target.selectedMap.value).toEqual({})
      })
    })

    describe('getClearAllHistory', () => {
      it('should return history item to clear all selections', () => {
        const target = useGeneAttrsSelectable(
          'Test',
          getItems,
          getItemType,
          allKeys
        )
        target.getSelectAllHistory().redo()
        const item = target.getClearAllHistory()
        expect(target.selectedMap.value).toEqual({
          a: { name: 's', props: { x: true, y: true } },
          b: { name: 't', props: { p: true, q: true } },
        })
        item.redo()
        expect(target.selectedMap.value).toEqual({})
        item.undo()
        expect(target.selectedMap.value).toEqual({
          a: { name: 's', props: { x: true, y: true } },
          b: { name: 't', props: { p: true, q: true } },
        })
      })
    })
  })
})
