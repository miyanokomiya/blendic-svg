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
import { useMapStore } from '/@/composables/stores/mapStore'

describe('src/composables/stores/mapStore.ts', () => {
  describe('update', () => {
    it('should return a reduce and a function to create the action to do', () => {
      const historyStore = useHistoryStore()
      const store = useMapStore('test')
      historyStore.defineReducers(store.reducers)

      historyStore.dispatch(store.createUpsertAction({ a: 1, b: 2 })!)
      expect(store.state.value).toEqual({ a: 1, b: 2 })

      historyStore.dispatch(store.createUpsertAction({ b: 20 })!)
      expect(store.state.value).toEqual({ a: 1, b: 20 })

      historyStore!.undo()
      expect(store.state.value).toEqual({ a: 1, b: 2 })

      historyStore!.undo()
      expect(store.state.value).toEqual({})

      historyStore!.redo()
      expect(store.state.value).toEqual({ a: 1, b: 2 })

      historyStore!.redo()
      expect(store.state.value).toEqual({ a: 1, b: 20 })
    })
  })

  describe('set', () => {
    it('should return a reduce and a function to create the action to do', () => {
      const historyStore = useHistoryStore()
      const store = useMapStore('test')
      historyStore.defineReducers(store.reducers)

      historyStore.dispatch(store.createSetAction({ a: 1, b: 2 })!)
      expect(store.state.value).toEqual({ a: 1, b: 2 })

      historyStore.dispatch(store.createSetAction({ b: 20 })!)
      expect(store.state.value).toEqual({ b: 20 })

      historyStore!.undo()
      expect(store.state.value).toEqual({ a: 1, b: 2 })

      historyStore!.undo()
      expect(store.state.value).toEqual({})

      historyStore!.redo()
      expect(store.state.value).toEqual({ a: 1, b: 2 })

      historyStore!.redo()
      expect(store.state.value).toEqual({ b: 20 })
    })
  })
})
