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

import { useHistoryStore } from '/@/composables/stores/history'

describe('composables/stores/history.ts', () => {
  function prepare() {
    const state = { value: 0 }
    const target = useHistoryStore()
    const { dispatch, createAction } = target.defineReducers({
      test_add: {
        redo(val: number) {
          const snapshot = state.value
          state.value = state.value + val
          return snapshot
        },
        undo(val: number) {
          state.value = val
        },
      },
      test_sub: {
        redo(val: number) {
          const snapshot = state.value
          state.value = state.value - val
          return snapshot
        },
        undo(val: number) {
          state.value = val
        },
      },
    })

    return {
      target,
      dispatch,
      createAction,
    }
  }

  describe('useHistoryStore', () => {
    it('should return a module to manage history store', () => {
      const { target, dispatch, createAction } = prepare()

      dispatch(createAction('test_add', 1))
      expect(target.historySummaries.value.length).toBe(1)
      expect(target.currentItemIndex.value).toBe(0)

      target.undo()
      expect(target.currentItemIndex.value).toBe(-1)

      target.redo()
      dispatch(createAction('test_sub', 1))
      expect(target.historySummaries.value).toEqual([
        { name: 'test_add', label: 'test_add', done: true },
        { name: 'test_sub', label: 'test_sub', done: true },
      ])
      expect(target.currentItemIndex.value).toBe(1)

      target.undo()
      expect(target.historySummaries.value).toEqual([
        { name: 'test_add', label: 'test_add', done: true },
        { name: 'test_sub', label: 'test_sub', done: false },
      ])
    })
  })
})
