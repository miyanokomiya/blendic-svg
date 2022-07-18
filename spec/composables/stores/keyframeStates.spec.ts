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
import { useKeyframeStates } from '/@/composables/stores/keyframeStates'

describe('src/composables/stores/keyframeStates.ts', () => {
  const visibledMap = {
    a: { id: 'a', points: {} },
    b: { id: 'b', points: {} },
  }

  function getStore() {
    return useKeyframeStates('Keyframe', () => visibledMap)
  }

  describe('restore', () => {
    it('should restore the state from its snapshot', () => {
      const historyStore = useHistoryStore()
      const store1 = getStore()
      historyStore.defineReducers(store1.reducers)

      historyStore.dispatch(
        store1.createSelectAction('a', { props: { x: true } })
      )
      historyStore.dispatch(
        store1.createSelectAction('b', { props: { x: true } }, true)
      )
      historyStore.dispatch(
        store1.createSelectAction('a', { props: { y: true } }, true)
      )
      expect(store1.selectedStateMap.value).toEqual({
        a: { props: { x: true, y: true } },
        b: { props: { x: true } },
      })

      const store2 = getStore()
      store2.restore(store1.createSnapshot())

      expect(store1.selectedStateMap.value).toEqual(
        store2.selectedStateMap.value
      )
    })
  })

  describe('select', () => {
    it('should create an action to do', () => {
      const historyStore = useHistoryStore()
      const store = getStore()
      historyStore.defineReducers(store.reducers)

      historyStore.dispatch(
        store.createSelectAction('a', { props: { x: true } })
      )
      expect(store.selectedStateMap.value).toEqual({
        a: { props: { x: true } },
      })

      historyStore.undo()
      expect(store.selectedStateMap.value).toEqual({})

      historyStore.redo()
      expect(store.selectedStateMap.value).toEqual({
        a: { props: { x: true } },
      })
    })

    it('should keep invisible items', () => {
      const historyStore = useHistoryStore()
      const store = getStore()
      historyStore.defineReducers(store.reducers)

      historyStore.dispatch(
        store.createSelectAllAction({
          b: { id: 'b', points: { x: true } },
          c: { id: 'c', points: { x: true } },
        })
      )

      historyStore.dispatch(
        store.createSelectAction('a', { props: { x: true } })
      )
      expect(store.selectedStateMap.value).toEqual({
        a: { props: { x: true } },
        c: { props: { x: true } },
      })
    })

    describe('shift select', () => {
      it('add selected state', () => {
        const historyStore = useHistoryStore()
        const store = getStore()
        historyStore.defineReducers(store.reducers)

        historyStore.dispatch(
          store.createSelectAction('a', { props: { x: true } })
        )
        historyStore.dispatch(
          store.createSelectAction('b', { props: { x: true } }, true)
        )
        expect(store.selectedStateMap.value).toEqual({
          a: { props: { x: true } },
          b: { props: { x: true } },
        })

        historyStore.undo()
        expect(store.selectedStateMap.value).toEqual({
          a: { props: { x: true } },
        })

        historyStore.redo()
        expect(store.selectedStateMap.value).toEqual({
          a: { props: { x: true } },
          b: { props: { x: true } },
        })

        historyStore.dispatch(
          store.createSelectAction('b', { props: { y: true } }, true)
        )
        expect(store.selectedStateMap.value).toEqual({
          a: { props: { x: true } },
          b: { props: { x: true, y: true } },
        })
      })

      it('toggle selected', () => {
        const historyStore = useHistoryStore()
        const store = getStore()
        historyStore.defineReducers(store.reducers)

        historyStore.dispatch(
          store.createSelectAction('a', { props: { x: true } })
        )
        historyStore.dispatch(
          store.createSelectAction('a', { props: { x: true } }, true)
        )
        expect(store.selectedStateMap.value).toEqual({})

        historyStore.undo()
        expect(store.selectedStateMap.value).toEqual({
          a: { props: { x: true } },
        })

        // not toggle partial selected
        historyStore.dispatch(
          store.createSelectAction('a', { props: { x: true, y: true } }, true)
        )
        expect(store.selectedStateMap.value).toEqual({
          a: { props: { x: true, y: true } },
        })

        // toggle all selected
        historyStore.dispatch(
          store.createSelectAction('b', { props: { x: true, y: true } }, true)
        )
        historyStore.dispatch(
          store.createSelectAction('a', { props: { x: true, y: true } }, true)
        )
        expect(store.selectedStateMap.value).toEqual({
          b: { props: { x: true, y: true } },
        })
      })
    })
  })

  describe('multiSelect', () => {
    it('should create an action to do', () => {
      const historyStore = useHistoryStore()
      const store = getStore()
      historyStore.defineReducers(store.reducers)

      historyStore.dispatch(
        store.createMultiSelectAction({ a: { id: 'a', points: { x: 1 } } })
      )
      expect(store.selectedStateMap.value).toEqual({
        a: { props: { x: true } },
      })

      historyStore.undo()
      expect(store.selectedStateMap.value).toEqual({})

      historyStore.redo()
      expect(store.selectedStateMap.value).toEqual({
        a: { props: { x: true } },
      })
    })

    it('should keep invisible items', () => {
      const historyStore = useHistoryStore()
      const store = getStore()
      historyStore.defineReducers(store.reducers)

      historyStore.dispatch(
        store.createSelectAction('b', { props: { x: true } })
      )
      historyStore.dispatch(
        store.createSelectAction('c', { props: { x: true } })
      )

      historyStore.dispatch(
        store.createMultiSelectAction({ a: { id: 'a', points: { x: 1 } } })
      )
      expect(store.selectedStateMap.value).toEqual({
        a: { props: { x: true } },
        c: { props: { x: true } },
      })
    })

    describe('shift select', () => {
      it('add selected state', () => {
        const historyStore = useHistoryStore()
        const store = getStore()
        historyStore.defineReducers(store.reducers)

        historyStore.dispatch(
          store.createMultiSelectAction(
            { a: { id: 'a', points: { x: 1 } } },
            true
          )
        )

        historyStore.dispatch(
          store.createMultiSelectAction(
            { b: { id: 'b', points: { x: 1 } } },
            true
          )
        )
        expect(store.selectedStateMap.value).toEqual({
          a: { props: { x: true } },
          b: { props: { x: true } },
        })

        historyStore.undo()
        expect(store.selectedStateMap.value).toEqual({
          a: { props: { x: true } },
        })

        historyStore.redo()
        expect(store.selectedStateMap.value).toEqual({
          a: { props: { x: true } },
          b: { props: { x: true } },
        })

        historyStore.dispatch(
          store.createMultiSelectAction(
            { b: { id: 'b', points: { y: 1, z: 1 } } },
            true
          )
        )
        expect(store.selectedStateMap.value).toEqual({
          a: { props: { x: true } },
          b: { props: { x: true, y: true, z: true } },
        })
      })

      it('toggle selected', () => {
        const historyStore = useHistoryStore()
        const store = getStore()
        historyStore.defineReducers(store.reducers)

        historyStore.dispatch(
          store.createMultiSelectAction(
            { a: { id: 'a', points: { x: 1 } } },
            true
          )
        )

        historyStore.dispatch(
          store.createMultiSelectAction(
            { a: { id: 'a', points: { x: 1 } } },
            true
          )
        )
        expect(store.selectedStateMap.value).toEqual({})

        historyStore.undo()
        expect(store.selectedStateMap.value).toEqual({
          a: { props: { x: true } },
        })

        historyStore.redo()
        expect(store.selectedStateMap.value).toEqual({})

        historyStore.dispatch(
          store.createMultiSelectAction(
            {
              a: { id: 'a', points: { x: 1, y: 1 } },
            },
            true
          )
        )
        expect(store.selectedStateMap.value).toEqual({
          a: { props: { x: true, y: true } },
        })
      })
      it('should avoid toggling separately', () => {
        const historyStore = useHistoryStore()
        const store = getStore()
        historyStore.defineReducers(store.reducers)

        historyStore.dispatch(
          store.createMultiSelectAction(
            { a: { id: 'a', points: { x: 1 } } },
            true
          )
        )

        historyStore.dispatch(
          store.createMultiSelectAction(
            {
              a: { id: 'a', points: { x: 1, y: 1 } },
            },
            true
          )
        )
        expect(store.selectedStateMap.value).toEqual({
          a: { props: { x: true, y: true } },
        })

        historyStore.dispatch(
          store.createMultiSelectAction(
            {
              a: { id: 'a', points: { x: 1, y: 1 } },
              b: { id: 'b', points: { x: 1, y: 1 } },
            },
            true
          )
        )
        expect(store.selectedStateMap.value).toEqual({
          a: { props: { x: true, y: true } },
          b: { props: { x: true, y: true } },
        })
      })
    })
  })

  describe('selectAll', () => {
    it('should return history item to do', () => {
      const historyStore = useHistoryStore()
      const store = getStore()
      historyStore.defineReducers(store.reducers)

      historyStore.dispatch(
        store.createSelectAllAction({
          a: { id: 'a', points: { x: true, y: false } },
          b: { id: 'b', points: { p: true, q: true } },
        })
      )
      expect(store.selectedStateMap.value).toEqual({
        a: { props: { x: true, y: true } },
        b: { props: { p: true, q: true } },
      })

      historyStore.undo()
      expect(store.selectedStateMap.value).toEqual({})

      historyStore.redo()
      expect(store.selectedStateMap.value).toEqual({
        a: { props: { x: true, y: true } },
        b: { props: { p: true, q: true } },
      })
    })

    it('should keep invisible items', () => {
      const historyStore = useHistoryStore()
      const store = getStore()
      historyStore.defineReducers(store.reducers)

      historyStore.dispatch(
        store.createSelectAction('b', { props: { x: true } })
      )
      historyStore.dispatch(
        store.createSelectAction('c', { props: { x: true } })
      )

      historyStore.dispatch(
        store.createSelectAllAction({ a: { id: 'a', points: { y: 1 } } })
      )
      expect(store.selectedStateMap.value).toEqual({
        a: { props: { y: true } },
        c: { props: { x: true } },
      })
    })
  })

  describe('filter', () => {
    it('should return history item to do', () => {
      const historyStore = useHistoryStore()
      const store = getStore()
      historyStore.defineReducers(store.reducers)

      historyStore.dispatch(
        store.createSelectAllAction({
          a: { id: 'a', points: { x: true, y: true } },
          b: { id: 'b', points: { p: true, q: true } },
        })
      )

      historyStore.dispatch(store.createFilterAction({ b: true }))
      expect(store.selectedStateMap.value).toEqual({
        b: { props: { p: true, q: true } },
      })

      historyStore.undo()
      expect(store.selectedStateMap.value).toEqual({
        a: { props: { x: true, y: true } },
        b: { props: { p: true, q: true } },
      })

      historyStore.redo()
      expect(store.selectedStateMap.value).toEqual({
        b: { props: { p: true, q: true } },
      })
    })

    it('should keep invisible items', () => {
      const historyStore = useHistoryStore()
      const store = getStore()
      historyStore.defineReducers(store.reducers)

      historyStore.dispatch(
        store.createSelectAllAction({
          a: { id: 'a', points: { x: true } },
          b: { id: 'b', points: { x: true } },
          c: { id: 'c', points: { x: true } },
        })
      )

      historyStore.dispatch(store.createFilterAction({ b: true }))
      expect(store.selectedStateMap.value).toEqual({
        b: { props: { x: true } },
        c: { props: { x: true } },
      })
    })
  })

  describe('drop', () => {
    it('should return history item to do', () => {
      const historyStore = useHistoryStore()
      const store = getStore()
      historyStore.defineReducers(store.reducers)

      historyStore.dispatch(
        store.createSelectAllAction({
          a: { id: 'a', points: { x: true, y: true } },
          b: { id: 'b', points: { p: true, q: true } },
        })
      )

      historyStore.dispatch(store.createDropAction({ b: true }))
      expect(store.selectedStateMap.value).toEqual({
        a: { props: { x: true, y: true } },
      })

      historyStore.undo()
      expect(store.selectedStateMap.value).toEqual({
        a: { props: { x: true, y: true } },
        b: { props: { p: true, q: true } },
      })

      historyStore.redo()
      expect(store.selectedStateMap.value).toEqual({
        a: { props: { x: true, y: true } },
      })
    })
  })

  describe('clear', () => {
    it('should return history item to clear all states', () => {
      const historyStore = useHistoryStore()
      const store = getStore()
      historyStore.defineReducers(store.reducers)

      historyStore.dispatch(
        store.createSelectAllAction({
          a: { id: 'a', points: { x: true, y: true } },
          c: { id: 'c', points: { x: true, y: true } },
        })
      )
      expect(store.selectedStateMap.value).toEqual({
        a: { props: { x: true, y: true } },
        c: { props: { x: true, y: true } },
      })

      historyStore.dispatch(store.createClearAllAction())
      // should clear all items including invisible ones
      expect(store.selectedStateMap.value).toEqual({})

      historyStore.undo()
      expect(store.selectedStateMap.value).toEqual({
        a: { props: { x: true, y: true } },
        c: { props: { x: true, y: true } },
      })

      historyStore.redo()
      expect(store.selectedStateMap.value).toEqual({})
    })
  })
})
