import {
  useItemSelectable,
  useAttrsSelectable,
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
})
