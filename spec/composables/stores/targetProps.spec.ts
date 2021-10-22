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
import { useTargetProps } from '/@/composables/stores/targetProps'

describe('src/composables/stores/targetProps.ts', () => {
  const visibledMap = {
    a: { id: 'a', props: {} },
    b: { id: 'b', props: {} },
  }

  function getStore() {
    return useTargetProps('props', () => visibledMap)
  }

  describe('restore', () => {
    it('should restore the state from its snapshot', () => {
      const store1 = getStore()
      const historyStore = useHistoryStore()
      historyStore.defineReducers(store1.reducers)

      historyStore.dispatch(
        store1.createSelectAction('a', {
          props: { x: 'selected' },
        })
      )
      historyStore.dispatch(
        store1.createSelectAction('b', { props: { y: 'selected' } }, true)
      )
      expect(store1.selectedStateMap.value).toEqual({
        a: { props: { x: 'selected' } },
        b: { props: { y: 'selected' } },
      })

      const store2 = getStore()
      store2.restore(store1.createSnapshot())
      expect(store2.selectedStateMap.value).toEqual({
        a: { props: { x: 'selected' } },
        b: { props: { y: 'selected' } },
      })
    })
  })

  describe('selectDryRun', () => {
    it('should return true if the operation to do with the args will update the state', () => {
      const targetProps = getStore()
      const historyStore = useHistoryStore()
      historyStore.defineReducers(targetProps.reducers)

      expect(targetProps.selectDryRun('a', { props: { x: 'selected' } })).toBe(
        true
      )

      historyStore.dispatch(
        targetProps.createSelectAction('a', {
          props: { x: 'selected' },
        })
      )
      expect(targetProps.selectDryRun('a', { props: { x: 'selected' } })).toBe(
        false
      )
      expect(
        targetProps.selectDryRun('a', { props: { x: 'selected' } }, true)
      ).toBe(true)

      historyStore.dispatch(
        targetProps.createSelectAction(
          'a',
          {
            props: { x: 'selected' },
          },
          true
        )
      )
      expect(
        targetProps.selectDryRun('a', { props: { x: 'selected' } }, true)
      ).toBe(true)
    })
  })

  describe('action to select', () => {
    it('should create an action to do', () => {
      const targetProps = getStore()
      const historyStore = useHistoryStore()
      historyStore.defineReducers(targetProps.reducers)

      historyStore.dispatch(
        targetProps.createSelectAction('a', {
          props: { x: 'selected' },
        })
      )
      expect(targetProps.selectedStateMap.value).toEqual({
        a: { props: { x: 'selected' } },
      })

      historyStore.undo()
      expect(targetProps.selectedStateMap.value).toEqual({})

      historyStore.redo()
      expect(targetProps.selectedStateMap.value).toEqual({
        a: { props: { x: 'selected' } },
      })

      historyStore.dispatch(
        targetProps.createSelectAction('b', {
          props: { x: 'selected' },
        })
      )
      expect(targetProps.selectedStateMap.value).toEqual({
        b: { props: { x: 'selected' } },
      })
    })
    describe('shift select', () => {
      it('add selected state', () => {
        const targetProps = getStore()
        const historyStore = useHistoryStore()
        historyStore.defineReducers(targetProps.reducers)

        historyStore.dispatch(
          targetProps.createSelectAction('a', { props: { x: 'selected' } })
        )
        historyStore.dispatch(
          targetProps.createSelectAction(
            'b',
            { props: { x: 'selected' } },
            true
          )
        )
        expect(targetProps.selectedStateMap.value).toEqual({
          a: { props: { x: 'selected' } },
          b: { props: { x: 'selected' } },
        })

        historyStore.undo()
        expect(targetProps.selectedStateMap.value).toEqual({
          a: { props: { x: 'selected' } },
        })

        historyStore.redo()
        expect(targetProps.selectedStateMap.value).toEqual({
          a: { props: { x: 'selected' } },
          b: { props: { x: 'selected' } },
        })

        historyStore.dispatch(
          targetProps.createSelectAction(
            'b',
            { props: { y: 'selected' } },
            true
          )
        )
        expect(targetProps.selectedStateMap.value).toEqual({
          a: { props: { x: 'selected' } },
          b: { props: { x: 'selected', y: 'selected' } },
        })
      })

      it('toggle selected', () => {
        const targetProps = getStore()
        const historyStore = useHistoryStore()
        historyStore.defineReducers(targetProps.reducers)

        historyStore.dispatch(
          targetProps.createSelectAction('a', { props: { x: 'selected' } })
        )
        historyStore.dispatch(
          targetProps.createSelectAction(
            'a',
            { props: { x: 'selected' } },
            true
          )
        )
        expect(targetProps.selectedStateMap.value).toEqual({})

        historyStore.undo()
        expect(targetProps.selectedStateMap.value).toEqual({
          a: { props: { x: 'selected' } },
        })

        historyStore.redo()
        expect(targetProps.selectedStateMap.value).toEqual({})
      })

      it('not toggle selected if notToggle = true', () => {
        const targetProps = getStore()
        const historyStore = useHistoryStore()
        historyStore.defineReducers(targetProps.reducers)

        historyStore.dispatch(
          targetProps.createSelectAction('a', { props: { x: 'selected' } })
        )
        historyStore.dispatch(
          targetProps.createSelectAction(
            'a',
            { props: { x: 'selected' } },
            true,
            true
          )
        )
        expect(targetProps.selectedStateMap.value).toEqual({
          a: { props: { x: 'selected' } },
        })

        historyStore.undo()
        expect(targetProps.selectedStateMap.value).toEqual({
          a: { props: { x: 'selected' } },
        })

        historyStore.redo()
        expect(targetProps.selectedStateMap.value).toEqual({
          a: { props: { x: 'selected' } },
        })
      })

      it('should keep invisible items', () => {
        const targetProps = getStore()
        const historyStore = useHistoryStore()
        historyStore.defineReducers(targetProps.reducers)

        historyStore.dispatch(
          targetProps.createSelectAllAction({
            b: { id: 'b', props: { x: true } },
            c: { id: 'c', props: { x: true } },
          })
        )

        historyStore.dispatch(
          targetProps.createSelectAction('a', { props: { x: 'selected' } })
        )
        expect(targetProps.selectedStateMap.value).toEqual({
          a: { props: { x: 'selected' } },
          c: { props: { x: 'selected' } },
        })
      })
    })
  })

  describe('action to selectAll', () => {
    it('should create an action to do', () => {
      const targetProps = getStore()
      const historyStore = useHistoryStore()
      historyStore.defineReducers(targetProps.reducers)

      historyStore.dispatch(
        targetProps.createSelectAllAction({
          a: { id: 'a', props: { x: true, y: false } },
          b: { id: 'b', props: { p: 0, q: 1 } },
        })
      )
      expect(targetProps.selectedStateMap.value).toEqual({
        a: { props: { x: 'selected', y: 'selected' } },
        b: { props: { p: 'selected', q: 'selected' } },
      })

      historyStore.undo()
      expect(targetProps.selectedStateMap.value).toEqual({})

      historyStore.redo()
      expect(targetProps.selectedStateMap.value).toEqual({
        a: { props: { x: 'selected', y: 'selected' } },
        b: { props: { p: 'selected', q: 'selected' } },
      })
    })

    it('should keep invisible items', () => {
      const targetProps = getStore()
      const historyStore = useHistoryStore()
      historyStore.defineReducers(targetProps.reducers)

      historyStore.dispatch(
        targetProps.createSelectAction('b', { props: { x: 'selected' } })
      )
      historyStore.dispatch(
        targetProps.createSelectAction('c', { props: { x: 'selected' } })
      )

      historyStore.dispatch(
        targetProps.createSelectAllAction({
          a: { id: 'a', props: { y: true } },
        })
      )
      expect(targetProps.selectedStateMap.value).toEqual({
        a: { props: { y: 'selected' } },
        c: { props: { x: 'selected' } },
      })
    })
  })

  describe('action filter', () => {
    it('should create an action to do', () => {
      const targetProps = getStore()
      const historyStore = useHistoryStore()
      historyStore.defineReducers(targetProps.reducers)

      historyStore.dispatch(
        targetProps.createSelectAllAction({
          a: { id: 'a', props: { x: true, y: true } },
          b: { id: 'b', props: { p: true, q: true } },
        })
      )

      historyStore.dispatch(targetProps.createFilterAction({ b: true }))
      expect(targetProps.selectedStateMap.value).toEqual({
        b: { props: { p: 'selected', q: 'selected' } },
      })

      historyStore.undo()
      expect(targetProps.selectedStateMap.value).toEqual({
        a: { props: { x: 'selected', y: 'selected' } },
        b: { props: { p: 'selected', q: 'selected' } },
      })

      historyStore.redo()
      expect(targetProps.selectedStateMap.value).toEqual({
        b: { props: { p: 'selected', q: 'selected' } },
      })
    })

    it('should keep invisible items', () => {
      const targetProps = getStore()
      const historyStore = useHistoryStore()
      historyStore.defineReducers(targetProps.reducers)

      historyStore.dispatch(
        targetProps.createSelectAllAction({
          a: { id: 'a', props: { x: true } },
          b: { id: 'b', props: { x: true } },
          c: { id: 'c', props: { x: true } },
        })
      )

      historyStore.dispatch(targetProps.createFilterAction({ b: true }))
      expect(targetProps.selectedStateMap.value).toEqual({
        b: { props: { x: 'selected' } },
        c: { props: { x: 'selected' } },
      })
    })
  })

  describe('action to drop', () => {
    it('should create an action to do', () => {
      const targetProps = getStore()
      const historyStore = useHistoryStore()
      historyStore.defineReducers(targetProps.reducers)

      historyStore.dispatch(
        targetProps.createSelectAllAction({
          a: { id: 'a', props: { x: true, y: true } },
          b: { id: 'b', props: { p: true, q: true } },
        })
      )

      historyStore.dispatch(targetProps.createDropAction({ b: true }))
      expect(targetProps.selectedStateMap.value).toEqual({
        a: { props: { x: 'selected', y: 'selected' } },
      })

      historyStore.undo()
      expect(targetProps.selectedStateMap.value).toEqual({
        a: { props: { x: 'selected', y: 'selected' } },
        b: { props: { p: 'selected', q: 'selected' } },
      })

      historyStore.redo()
      expect(targetProps.selectedStateMap.value).toEqual({
        a: { props: { x: 'selected', y: 'selected' } },
      })
    })
  })

  describe('action to clearAll', () => {
    it('should create an action to do', () => {
      const targetProps = getStore()
      const historyStore = useHistoryStore()
      historyStore.defineReducers(targetProps.reducers)

      historyStore.dispatch(
        targetProps.createSelectAllAction({
          a: { id: 'a', props: { x: true, y: true } },
          b: { id: 'b', props: { p: true, q: true } },
        })
      )

      historyStore.dispatch(targetProps.createClearAllAction())
      expect(targetProps.selectedStateMap.value).toEqual({})

      historyStore.undo()
      expect(targetProps.selectedStateMap.value).toEqual({
        a: { props: { x: 'selected', y: 'selected' } },
        b: { props: { p: 'selected', q: 'selected' } },
      })

      historyStore.redo()
      expect(targetProps.selectedStateMap.value).toEqual({})
    })
  })
})
