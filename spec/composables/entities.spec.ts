import { useEntities } from '/@/composables/entities'

describe('src/composables/entities.ts', () => {
  describe('useEntities', () => {
    describe('init', () => {
      it('should init this composable', () => {
        const entities = useEntities('Test')
        entities.init({
          byId: { a: { id: 'a' } },
          allIds: ['a'],
        })
        expect(entities.getEntities()).toEqual({
          byId: { a: { id: 'a' } },
          allIds: ['a'],
        })
        entities.init({
          byId: { b: { id: 'b' } },
          allIds: ['b'],
        })
        expect(entities.getEntities()).toEqual({
          byId: { b: { id: 'b' } },
          allIds: ['b'],
        })
      })
    })

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

    describe('getUpdateItemHistory', () => {
      it('should return history item to update entities', () => {
        const entities = useEntities<{ id: string; val: number }>('Test')
        entities
          .getAddItemsHistory([
            { id: 'a', val: 0 },
            { id: 'b', val: 0 },
            { id: 'c', val: 0 },
          ])
          .redo()
        const item = entities.getUpdateItemHistory({
          a: { id: 'a', val: 1 },
          c: { id: 'c', val: 2 },
        })
        expect(item.name).toBe('Update Test')
        expect(entities.getEntities()).toEqual({
          byId: {
            a: { id: 'a', val: 0 },
            b: { id: 'b', val: 0 },
            c: { id: 'c', val: 0 },
          },
          allIds: ['a', 'b', 'c'],
        })
        item.redo()
        expect(entities.getEntities()).toEqual({
          byId: {
            a: { id: 'a', val: 1 },
            b: { id: 'b', val: 0 },
            c: { id: 'c', val: 2 },
          },
          allIds: ['a', 'b', 'c'],
        })
        item.undo()
        expect(entities.getEntities()).toEqual({
          byId: {
            a: { id: 'a', val: 0 },
            b: { id: 'b', val: 0 },
            c: { id: 'c', val: 0 },
          },
          allIds: ['a', 'b', 'c'],
        })
      })
    })
  })
})
