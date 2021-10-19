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
} from '/@/composables/stores/selectable'
import { useHistoryStore } from '/@/composables/stores/history'

describe('src/composables/stores/selectable.ts', () => {
  describe('useItemSelectable', () => {
    const items = {
      a: { id: 'a' },
      b: { id: 'b' },
    }

    describe('select', () => {
      it('should define a reducer and create an action to do', () => {
        const history = useHistoryStore()
        const target = useItemSelectable('Test', () => items)
        const { dispatch } = history.defineReducers(target.reducers)

        dispatch(target.createSelectAction('a'))
        expect(target.selectedMap.value).toEqual({ a: true })

        history.undo()
        expect(target.selectedMap.value).toEqual({})

        history.redo()
        expect(target.selectedMap.value).toEqual({ a: true })
      })

      it('should return history item to clear all if empty id is passed', () => {
        const history = useHistoryStore()
        const target = useItemSelectable('Test', () => items)
        const { dispatch } = history.defineReducers(target.reducers)

        dispatch(target.createSelectAction('a'))
        expect(target.selectedMap.value).toEqual({ a: true })

        dispatch(target.createSelectAction(''))
        expect(target.selectedMap.value).toEqual({})

        history.undo()
        expect(target.selectedMap.value).toEqual({ a: true })

        history.redo()
        expect(target.selectedMap.value).toEqual({})
      })
    })

    describe('getSelectHistoryDryRun', () => {
      it('should return true only if an operation to select updates the state', () => {
        const history = useHistoryStore()
        const target = useItemSelectable('Test', () => items)
        const { dispatch } = history.defineReducers(target.reducers)

        expect(target.getSelectHistoryDryRun('')).toBe(false)
        expect(target.getSelectHistoryDryRun('a')).toBe(true)

        dispatch(target.createSelectAction('a'))
        expect(target.getSelectHistoryDryRun('a')).toBe(false)
        expect(target.getSelectHistoryDryRun('a', true)).toBe(true)
        expect(target.getSelectHistoryDryRun('')).toBe(true)

        dispatch(target.createSelectAction('a', true))
        expect(target.getSelectHistoryDryRun('a')).toBe(true)
        expect(target.getSelectHistoryDryRun('b')).toBe(true)
      })
    })

    describe('multi select', () => {
      it('should define a reducer and create an action to do', () => {
        const history = useHistoryStore()
        const target = useItemSelectable('Test', () => items)
        const { dispatch } = history.defineReducers(target.reducers)

        dispatch(target.createMultiSelectAction(['a', 'b']))
        expect(target.selectedMap.value).toEqual({ a: true, b: true })

        history.undo()
        expect(target.selectedMap.value).toEqual({})

        history.redo()
        expect(target.selectedMap.value).toEqual({ a: true, b: true })
      })
    })

    describe('getMultiSelectHistoryDryRun', () => {
      it('should return true only if an operation to select updates the state', () => {
        const history = useHistoryStore()
        const target = useItemSelectable('Test', () => items)
        const { dispatch } = history.defineReducers(target.reducers)

        expect(target.getMultiSelectHistoryDryRun([])).toBe(false)
        expect(target.getMultiSelectHistoryDryRun(['a', 'b'])).toBe(true)

        dispatch(target.createMultiSelectAction(['a', 'b']))
        expect(target.getMultiSelectHistoryDryRun(['a', 'b'])).toBe(false)
        expect(target.getMultiSelectHistoryDryRun(['b', 'a'])).toBe(false)
        expect(target.getMultiSelectHistoryDryRun(['b'])).toBe(true)
        expect(target.getMultiSelectHistoryDryRun(['a', 'b', 'c'])).toBe(true)
        expect(target.getMultiSelectHistoryDryRun([])).toBe(true)
      })
    })

    describe('select all', () => {
      it('should return true only if an operation to select updates the state', () => {
        const history = useHistoryStore()
        const target = useItemSelectable('Test', () => items)
        const { dispatch } = history.defineReducers(target.reducers)

        dispatch(target.createSelectAllAction())
        expect(target.selectedMap.value).toEqual({ a: true, b: true })

        history.undo()
        expect(target.selectedMap.value).toEqual({})

        history.redo()
        expect(target.selectedMap.value).toEqual({ a: true, b: true })
      })
    })

    describe('clear all', () => {
      it('should return true only if an operation to select updates the state', () => {
        const history = useHistoryStore()
        const target = useItemSelectable('Test', () => items)
        const { dispatch } = history.defineReducers(target.reducers)

        dispatch(target.createSelectAllAction())
        expect(target.selectedMap.value).toEqual({ a: true, b: true })

        dispatch(target.createClearAllAction())
        expect(target.selectedMap.value).toEqual({})

        history.undo()
        expect(target.selectedMap.value).toEqual({ a: true, b: true })

        history.redo()
        expect(target.selectedMap.value).toEqual({})
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
        const history = useHistoryStore()
        const target = useAttrsSelectable('Test', () => items, ['x', 'y'])
        const { dispatch } = history.defineReducers(target.reducers)

        const ret = target.allAttrsSelectedIds
        expect(ret.value).toEqual([])

        dispatch(target.createSelectAction('a', 'x', true))
        expect(ret.value).toEqual([])

        dispatch(target.createSelectAction('a', 'y', true))
        expect(ret.value).toEqual(['a'])

        dispatch(
          target.createMultiSelectAction({ b: { x: true, y: true } }, true)
        )
        expect(ret.value).toEqual(['a', 'b'])
      })
    })

    describe('getSelectHistory', () => {
      it('should return history item to select', () => {
        const history = useHistoryStore()
        const target = useAttrsSelectable('Test', () => items, ['x', 'y'])
        const { dispatch } = history.defineReducers(target.reducers)

        dispatch(target.createSelectAction('a', 'x', true))
        expect(target.selectedMap.value).toEqual({ a: { x: true } })

        history.undo()
        expect(target.selectedMap.value).toEqual({})

        history.redo()
        expect(target.selectedMap.value).toEqual({ a: { x: true } })
      })
      it('should return history item to clear all if empty id is passed', () => {
        const history = useHistoryStore()
        const target = useAttrsSelectable('Test', () => items, ['x', 'y'])
        const { dispatch } = history.defineReducers(target.reducers)

        dispatch(target.createSelectAction('a', 'x'))
        expect(target.selectedMap.value).toEqual({ a: { x: true } })

        dispatch(target.createSelectAction('', 'x'))
        expect(target.selectedMap.value).toEqual({})

        history.undo()
        expect(target.selectedMap.value).toEqual({ a: { x: true } })

        history.redo()
        expect(target.selectedMap.value).toEqual({})
      })
    })

    describe('getSelectHistoryDryRun', () => {
      it('should return true only if an operation to select updates the state', () => {
        const history = useHistoryStore()
        const target = useAttrsSelectable('Test', () => items, ['x', 'y'])
        const { dispatch } = history.defineReducers(target.reducers)

        expect(target.getSelectHistoryDryRun('', 'x')).toBe(false)
        expect(target.getSelectHistoryDryRun('a', 'x')).toBe(true)

        dispatch(target.createSelectAction('a', 'x'))
        expect(target.getSelectHistoryDryRun('', 'x')).toBe(true)
        expect(target.getSelectHistoryDryRun('a', 'x')).toBe(false)
        expect(target.getSelectHistoryDryRun('a', 'x', true)).toBe(true)

        dispatch(target.createSelectAction('b', 'x', true))
        expect(target.getSelectHistoryDryRun('a', 'x')).toBe(true)
        expect(target.getSelectHistoryDryRun('b', 'x')).toBe(true)

        dispatch(target.createSelectAction('a', 'y', true))
        expect(target.getSelectHistoryDryRun('a', 'x')).toBe(true)
        expect(target.getSelectHistoryDryRun('a', 'y')).toBe(true)
      })
    })

    describe('getMultiSelectHistory', () => {
      it('should return history item to multi select', () => {
        const history = useHistoryStore()
        const target = useAttrsSelectable('Test', () => items, ['x', 'y'])
        const { dispatch } = history.defineReducers(target.reducers)

        dispatch(
          target.createMultiSelectAction({
            a: { x: true },
            b: { y: true },
          })
        )
        expect(target.selectedMap.value).toEqual({
          a: { x: true },
          b: { y: true },
        })

        history.undo()
        expect(target.selectedMap.value).toEqual({})

        history.redo()
        expect(target.selectedMap.value).toEqual({
          a: { x: true },
          b: { y: true },
        })
      })
    })

    describe('getSelectAllHistory', () => {
      it('should return history item to select all', () => {
        const history = useHistoryStore()
        const target = useAttrsSelectable('Test', () => items, ['x', 'y'])
        const { dispatch } = history.defineReducers(target.reducers)

        dispatch(target.createSelectAllAction())
        expect(target.selectedMap.value).toEqual({
          a: { x: true, y: true },
          b: { x: true, y: true },
        })

        history.undo()
        expect(target.selectedMap.value).toEqual({})

        history.redo()
        expect(target.selectedMap.value).toEqual({
          a: { x: true, y: true },
          b: { x: true, y: true },
        })
      })
    })

    describe('getClearAllHistory', () => {
      it('should return history item to clear all selections', () => {
        const history = useHistoryStore()
        const target = useAttrsSelectable('Test', () => items, ['x', 'y'])
        const { dispatch } = history.defineReducers(target.reducers)

        dispatch(target.createSelectAllAction())
        expect(target.selectedMap.value).toEqual({
          a: { x: true, y: true },
          b: { x: true, y: true },
        })

        dispatch(target.createClearAllAction())
        expect(target.selectedMap.value).toEqual({})

        history.undo()
        expect(target.selectedMap.value).toEqual({
          a: { x: true, y: true },
          b: { x: true, y: true },
        })

        history.redo()
        expect(target.selectedMap.value).toEqual({})
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
        const history = useHistoryStore()
        const target = useGeneAttrsSelectable(
          'Test',
          getItems,
          getItemType,
          allKeys
        )
        const { dispatch } = history.defineReducers(target.reducers)

        const ret = target.allAttrsSelectedIds
        expect(ret.value).toEqual([])

        dispatch(target.createSelectAction('a', 'x', true))
        expect(ret.value).toEqual([])

        dispatch(target.createSelectAction('a', 'y', true))
        expect(ret.value).toEqual(['a'])

        dispatch(
          target.createMultiSelectAction(
            { b: { name: 't', props: { p: true, q: true } } },
            true
          )
        )
        expect(ret.value).toEqual(['a', 'b'])
      })
    })

    describe('getSelectHistory', () => {
      it('should return history item to select', () => {
        const history = useHistoryStore()
        const target = useGeneAttrsSelectable(
          'Test',
          getItems,
          getItemType,
          allKeys
        )
        const { dispatch } = history.defineReducers(target.reducers)

        dispatch(target.createSelectAction('a', 'x'))
        expect(target.selectedMap.value).toEqual({
          a: { name: 's', props: { x: true } },
        })

        history.undo()
        expect(target.selectedMap.value).toEqual({})

        history.redo()
        expect(target.selectedMap.value).toEqual({
          a: { name: 's', props: { x: true } },
        })
      })
      it('should return history item to clear all if empty id is passed', () => {
        const history = useHistoryStore()
        const target = useGeneAttrsSelectable(
          'Test',
          getItems,
          getItemType,
          allKeys
        )
        const { dispatch } = history.defineReducers(target.reducers)

        dispatch(target.createSelectAction('a', 'x'))
        expect(target.selectedMap.value).toEqual({
          a: { name: 's', props: { x: true } },
        })

        dispatch(target.createSelectAction('', 'x'))
        expect(target.selectedMap.value).toEqual({})

        history.undo()
        expect(target.selectedMap.value).toEqual({
          a: { name: 's', props: { x: true } },
        })

        history.redo()
        expect(target.selectedMap.value).toEqual({})
      })
    })

    describe('getSelectHistoryDryRun', () => {
      it('should return true only if an operation to select updates the state', () => {
        const history = useHistoryStore()
        const target = useGeneAttrsSelectable(
          'Test',
          getItems,
          getItemType,
          allKeys
        )
        const { dispatch } = history.defineReducers(target.reducers)

        expect(target.getSelectHistoryDryRun('', 'x')).toBe(false)
        expect(target.getSelectHistoryDryRun('a', 'x')).toBe(true)

        dispatch(target.createSelectAction('a', 'x'))
        expect(target.getSelectHistoryDryRun('', 'x')).toBe(true)
        expect(target.getSelectHistoryDryRun('a', 'x')).toBe(false)
        expect(target.getSelectHistoryDryRun('a', 'x', true)).toBe(true)

        dispatch(target.createSelectAction('b', 'x', true))
        expect(target.getSelectHistoryDryRun('a', 'x')).toBe(true)
        expect(target.getSelectHistoryDryRun('b', 'x')).toBe(true)

        dispatch(target.createSelectAction('a', 'y', true))
        expect(target.getSelectHistoryDryRun('a', 'x')).toBe(true)
        expect(target.getSelectHistoryDryRun('a', 'y')).toBe(true)
      })
    })

    describe('getMultiSelectHistory', () => {
      it('should return history item to multi select', () => {
        const history = useHistoryStore()
        const target = useGeneAttrsSelectable(
          'Test',
          getItems,
          getItemType,
          allKeys
        )
        const { dispatch } = history.defineReducers(target.reducers)

        dispatch(
          target.createMultiSelectAction({
            a: { name: 's', props: { x: true } },
            b: { name: 't', props: { q: true } },
          })
        )
        expect(target.selectedMap.value).toEqual({
          a: { name: 's', props: { x: true } },
          b: { name: 't', props: { q: true } },
        })

        history.undo()
        expect(target.selectedMap.value).toEqual({})

        history.redo()
        expect(target.selectedMap.value).toEqual({
          a: { name: 's', props: { x: true } },
          b: { name: 't', props: { q: true } },
        })
      })
    })

    describe('getSelectAllHistory', () => {
      it('should return history item to select all', () => {
        const history = useHistoryStore()
        const target = useGeneAttrsSelectable(
          'Test',
          getItems,
          getItemType,
          allKeys
        )
        const { dispatch } = history.defineReducers(target.reducers)

        dispatch(target.createSelectAllAction())
        expect(target.selectedMap.value).toEqual({
          a: { name: 's', props: { x: true, y: true } },
          b: { name: 't', props: { p: true, q: true } },
        })

        history.undo()
        expect(target.selectedMap.value).toEqual({})

        history.redo()
        expect(target.selectedMap.value).toEqual({
          a: { name: 's', props: { x: true, y: true } },
          b: { name: 't', props: { p: true, q: true } },
        })
      })
    })

    describe('getClearAllHistory', () => {
      it('should return history item to clear all selections', () => {
        const history = useHistoryStore()
        const target = useGeneAttrsSelectable(
          'Test',
          getItems,
          getItemType,
          allKeys
        )
        const { dispatch } = history.defineReducers(target.reducers)

        dispatch(target.createSelectAllAction())
        expect(target.selectedMap.value).toEqual({
          a: { name: 's', props: { x: true, y: true } },
          b: { name: 't', props: { p: true, q: true } },
        })

        dispatch(target.createClearAllAction())
        expect(target.selectedMap.value).toEqual({})

        history.undo()
        expect(target.selectedMap.value).toEqual({
          a: { name: 's', props: { x: true, y: true } },
          b: { name: 't', props: { p: true, q: true } },
        })

        history.redo()
        expect(target.selectedMap.value).toEqual({})
      })
    })
  })
})
