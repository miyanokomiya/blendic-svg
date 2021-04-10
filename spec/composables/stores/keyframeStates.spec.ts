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

import { useKeyframeStates } from '/@/composables/stores/keyframeStates'

describe('src/composables/stores/keyframeStates.ts', () => {
  const visibledMap = {
    a: { id: 'a', points: {} },
    b: { id: 'b', points: {} },
  }

  function getStore() {
    return useKeyframeStates(() => visibledMap)
  }

  describe('select', () => {
    it('should return history item to do', () => {
      const store = getStore()
      const ret = store.select('a', { props: { x: true } })

      expect(store.selectedStateMap.value).toEqual({})
      ret.redo()
      expect(store.selectedStateMap.value).toEqual({
        a: { props: { x: true } },
      })
      ret.undo()
      expect(store.selectedStateMap.value).toEqual({})
    })

    it('should keep invisible items', () => {
      const store = getStore()
      store
        .selectAll({
          b: { id: 'b', points: { x: true } },
          c: { id: 'c', points: { x: true } },
        })
        .redo()

      store.select('a', { props: { x: true } }).redo()
      expect(store.selectedStateMap.value).toEqual({
        a: { props: { x: true } },
        c: { props: { x: true } },
      })
    })

    describe('shift select', () => {
      it('add selected state', () => {
        const store = getStore()
        store.select('a', { props: { x: true } }).redo()
        const item = store.select('b', { props: { x: true } }, true)
        expect(store.selectedStateMap.value).toEqual({
          a: { props: { x: true } },
        })
        item.redo()
        expect(store.selectedStateMap.value).toEqual({
          a: { props: { x: true } },
          b: { props: { x: true } },
        })
        item.undo()
        expect(store.selectedStateMap.value).toEqual({
          a: { props: { x: true } },
        })
        item.redo()
        store.select('b', { props: { y: true } }, true).redo()
        expect(store.selectedStateMap.value).toEqual({
          a: { props: { x: true } },
          b: { props: { x: true, y: true } },
        })
      })

      it('toggle selected', () => {
        const store = getStore()
        store.select('a', { props: { x: true } }).redo()
        const item = store.select('a', { props: { x: true } }, true)
        expect(store.selectedStateMap.value).toEqual({
          a: { props: { x: true } },
        })
        item.redo()
        expect(store.selectedStateMap.value).toEqual({})
        item.undo()
        expect(store.selectedStateMap.value).toEqual({
          a: { props: { x: true } },
        })

        // not toggle partial selected
        store.select('a', { props: { x: true, y: true } }, true).redo()
        expect(store.selectedStateMap.value).toEqual({
          a: { props: { x: true, y: true } },
        })

        // toggle all selected
        store.select('b', { props: { x: true, y: true } }, true).redo()
        store.select('a', { props: { x: true, y: true } }, true).redo()
        expect(store.selectedStateMap.value).toEqual({
          b: { props: { x: true, y: true } },
        })
      })
    })
  })

  describe('selectList', () => {
    it('should return history item to do', () => {
      const store = getStore()
      const ret = store.selectList({ a: { id: 'a', points: { x: 1 } } })
      expect(store.selectedStateMap.value).toEqual({})
      ret.redo()
      expect(store.selectedStateMap.value).toEqual({
        a: { props: { x: true } },
      })
      ret.undo()
      expect(store.selectedStateMap.value).toEqual({})
    })

    it('should keep invisible items', () => {
      const store = getStore()
      store.select('b', { props: { x: true } }).redo()
      store.select('c', { props: { x: true } }).redo()

      store.selectList({ a: { id: 'a', points: { x: 1 } } }).redo()
      expect(store.selectedStateMap.value).toEqual({
        a: { props: { x: true } },
        c: { props: { x: true } },
      })
    })

    describe('shift select', () => {
      it('add selected state', () => {
        const store = getStore()
        store.selectList({ a: { id: 'a', points: { x: 1 } } }, true).redo()

        const item = store.selectList(
          { b: { id: 'b', points: { x: 1 } } },
          true
        )

        expect(store.selectedStateMap.value).toEqual({
          a: { props: { x: true } },
        })

        item.redo()
        expect(store.selectedStateMap.value).toEqual({
          a: { props: { x: true } },
          b: { props: { x: true } },
        })

        item.undo()
        expect(store.selectedStateMap.value).toEqual({
          a: { props: { x: true } },
        })

        item.redo()
        store
          .selectList({ b: { id: 'b', points: { y: 1, z: 1 } } }, true)
          .redo()
        expect(store.selectedStateMap.value).toEqual({
          a: { props: { x: true } },
          b: { props: { y: true, z: true } },
        })
      })

      it('toggle selected', () => {
        const store = getStore()
        store.selectList({ a: { id: 'a', points: { x: 1 } } }, true).redo()

        const item = store.selectList(
          { a: { id: 'a', points: { x: 1 } } },
          true
        )

        item.redo()
        expect(store.selectedStateMap.value).toEqual({})

        item.undo()
        expect(store.selectedStateMap.value).toEqual({
          a: { props: { x: true } },
        })

        store
          .selectList({ a: { id: 'a', points: { x: 1, y: 1 } } }, true)
          .redo()
        expect(store.selectedStateMap.value).toEqual({
          a: { props: { x: true, y: true } },
        })
      })
    })
  })

  describe('selectAll', () => {
    it('should return history item to do', () => {
      const store = getStore()
      const item = store.selectAll({
        a: { id: 'a', points: { x: true, y: false } },
        b: { id: 'b', points: { p: 0, q: 1 } },
      })
      expect(store.selectedStateMap.value).toEqual({})
      item.redo()
      expect(store.selectedStateMap.value).toEqual({
        a: { props: { x: true, y: true } },
        b: { props: { p: true, q: true } },
      })
      item.undo()
      expect(store.selectedStateMap.value).toEqual({})
    })

    it('should keep invisible items', () => {
      const store = getStore()
      store.select('b', { props: { x: true } }).redo()
      store.select('c', { props: { x: true } }).redo()

      store.selectAll({ a: { id: 'a', points: { y: 1 } } }).redo()
      expect(store.selectedStateMap.value).toEqual({
        a: { props: { y: true } },
        c: { props: { x: true } },
      })
    })
  })

  describe('filter', () => {
    it('should return history item to do', () => {
      const store = getStore()
      store
        .selectAll({
          a: { id: 'a', points: { x: true, y: true } },
          b: { id: 'b', points: { p: true, q: true } },
        })
        .redo()
      const item = store.filter({ b: true })
      expect(store.selectedStateMap.value).toEqual({
        a: { props: { x: true, y: true } },
        b: { props: { p: true, q: true } },
      })
      item.redo()
      expect(store.selectedStateMap.value).toEqual({
        b: { props: { p: true, q: true } },
      })
      item.undo()
      expect(store.selectedStateMap.value).toEqual({
        a: { props: { x: true, y: true } },
        b: { props: { p: true, q: true } },
      })
    })

    it('should keep invisible items', () => {
      const store = getStore()
      store
        .selectAll({
          a: { id: 'a', points: { x: true } },
          b: { id: 'b', points: { x: true } },
          c: { id: 'c', points: { x: true } },
        })
        .redo()

      store.filter({ b: true }).redo()
      expect(store.selectedStateMap.value).toEqual({
        b: { props: { x: true } },
        c: { props: { x: true } },
      })
    })
  })

  describe('drop', () => {
    it('should return history item to do', () => {
      const store = getStore()
      store
        .selectAll({
          a: { id: 'a', points: { x: true, y: true } },
          b: { id: 'b', points: { p: true, q: true } },
        })
        .redo()
      const item = store.drop({ b: true })
      expect(store.selectedStateMap.value).toEqual({
        a: { props: { x: true, y: true } },
        b: { props: { p: true, q: true } },
      })
      item.redo()
      expect(store.selectedStateMap.value).toEqual({
        a: { props: { x: true, y: true } },
      })
      item.undo()
      expect(store.selectedStateMap.value).toEqual({
        a: { props: { x: true, y: true } },
        b: { props: { p: true, q: true } },
      })
    })
  })

  describe('clear', () => {
    it('should return history item to do', () => {
      const store = getStore()
      store.selectAll({ a: { id: 'a', points: { x: true, y: true } } }).redo()
      const item = store.clear()
      expect(store.selectedStateMap.value).toEqual({
        a: { props: { x: true, y: true } },
      })
      item.redo()
      expect(store.selectedStateMap.value).toEqual({})
      item.undo()
      expect(store.selectedStateMap.value).toEqual({
        a: { props: { x: true, y: true } },
      })
    })
  })
})
