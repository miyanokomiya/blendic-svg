import { useEntities } from '/@/composables/entities'

describe('src/composables/entities.ts', () => {
  describe('useEntities', () => {
    describe('getAddItemsHistory', () => {
      it('should return history item to add entities', () => {
        const entities = useEntities('Test')
        const item = entities.getAddItemsHistory([{ id: 'a' }])
        expect(item.name).toBe('Add Test')
        expect(entities.getEntities()).toEqual({
          byId: {},
          allIds: [],
        })
        item.redo()
        expect(entities.getEntities()).toEqual({
          byId: { a: { id: 'a' } },
          allIds: ['a'],
        })
        item.undo()
        expect(entities.getEntities()).toEqual({
          byId: {},
          allIds: [],
        })
      })
    })

    describe('getDeleteItemsHistory', () => {
      it('should return history item to delete entities', () => {
        const entities = useEntities('Test')
        entities
          .getAddItemsHistory([
            { id: 'a' },
            { id: 'b' },
            { id: 'c' },
            { id: 'd' },
          ])
          .redo()
        const item = entities.getDeleteItemsHistory(['b', 'c'])
        expect(item.name).toBe('Delete Test')
        expect(entities.getEntities()).toEqual({
          byId: {
            a: { id: 'a' },
            b: { id: 'b' },
            c: { id: 'c' },
            d: { id: 'd' },
          },
          allIds: ['a', 'b', 'c', 'd'],
        })
        item.redo()
        expect(entities.getEntities()).toEqual({
          byId: { a: { id: 'a' }, d: { id: 'd' } },
          allIds: ['a', 'd'],
        })
        item.undo()
        expect(entities.getEntities()).toEqual({
          byId: {
            a: { id: 'a' },
            b: { id: 'b' },
            c: { id: 'c' },
            d: { id: 'd' },
          },
          allIds: ['a', 'b', 'c', 'd'],
        })
      })
    })
  })
})
