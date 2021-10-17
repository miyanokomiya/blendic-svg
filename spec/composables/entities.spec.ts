import { useEntities } from '/@/composables/entities'
import { useHistoryStore } from '/@/composables/stores/history'

describe('src/composables/entities.ts', () => {
  describe('useEntities', () => {
    describe('init', () => {
      it('should init this composable', () => {
        const entities = useEntities('Test')
        entities.init({
          byId: { a: { id: 'a' } },
          allIds: ['a'],
        })
        expect(entities.entities.value).toEqual({
          byId: { a: { id: 'a' } },
          allIds: ['a'],
        })
        entities.init({
          byId: { b: { id: 'b' } },
          allIds: ['b'],
        })
        expect(entities.entities.value).toEqual({
          byId: { b: { id: 'b' } },
          allIds: ['b'],
        })
      })
    })

    describe('add', () => {
      it('should define a reducer and create an action to do', () => {
        const history = useHistoryStore()
        const entities = useEntities('Test')
        const { dispatch } = history.defineReducers(entities.reducers)
        dispatch(entities.createAddAction([{ id: 'a' }]))
        expect(entities.entities.value).toEqual({
          byId: { a: { id: 'a' } },
          allIds: ['a'],
        })

        history.undo()
        expect(entities.entities.value).toEqual({
          byId: {},
          allIds: [],
        })
      })
    })

    describe('delete', () => {
      it('should define a reducer and create an action to do', () => {
        const history = useHistoryStore()
        const entities = useEntities('Test')
        const { dispatch } = history.defineReducers(entities.reducers)

        dispatch(
          entities.createAddAction([
            { id: 'a' },
            { id: 'b' },
            { id: 'c' },
            { id: 'd' },
          ])
        )
        expect(entities.entities.value).toEqual({
          byId: {
            a: { id: 'a' },
            b: { id: 'b' },
            c: { id: 'c' },
            d: { id: 'd' },
          },
          allIds: ['a', 'b', 'c', 'd'],
        })

        dispatch(entities.createDeleteAction(['b', 'c']))
        expect(entities.entities.value).toEqual({
          byId: { a: { id: 'a' }, d: { id: 'd' } },
          allIds: ['a', 'd'],
        })

        history.undo()
        expect(entities.entities.value).toEqual({
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

    describe('update', () => {
      it('should define a reducer and create an action to do', () => {
        const history = useHistoryStore()
        const entities = useEntities<{ id: string; val: number }>('Test')
        const { dispatch } = history.defineReducers(entities.reducers)

        dispatch(
          entities.createAddAction([
            { id: 'a', val: 0 },
            { id: 'b', val: 0 },
            { id: 'c', val: 0 },
          ])
        )
        expect(entities.entities.value).toEqual({
          byId: {
            a: { id: 'a', val: 0 },
            b: { id: 'b', val: 0 },
            c: { id: 'c', val: 0 },
          },
          allIds: ['a', 'b', 'c'],
        })

        history.dispatch(
          entities.createUpdateAction({
            a: { id: 'a', val: 1 },
            c: { id: 'c', val: 2 },
          })
        )
        expect(entities.entities.value).toEqual({
          byId: {
            a: { id: 'a', val: 1 },
            b: { id: 'b', val: 0 },
            c: { id: 'c', val: 2 },
          },
          allIds: ['a', 'b', 'c'],
        })

        history.undo()
        expect(entities.entities.value).toEqual({
          byId: {
            a: { id: 'a', val: 0 },
            b: { id: 'b', val: 0 },
            c: { id: 'c', val: 0 },
          },
          allIds: ['a', 'b', 'c'],
        })
      })
    })

    describe('replace', () => {
      it('should define a reducer and create an action to do', () => {
        const history = useHistoryStore()
        const entities = useEntities<{ id: string; val: number }>('Test')
        const { dispatch } = history.defineReducers(entities.reducers)

        dispatch(
          entities.createAddAction([
            { id: 'a', val: 0 },
            { id: 'b', val: 0 },
            { id: 'c', val: 0 },
          ])
        )
        expect(entities.entities.value).toEqual({
          byId: {
            a: { id: 'a', val: 0 },
            b: { id: 'b', val: 0 },
            c: { id: 'c', val: 0 },
          },
          allIds: ['a', 'b', 'c'],
        })

        history.dispatch(
          entities.createReplaceAction([{ id: 'a', val: 1 }], ['a', 'b'])
        )
        expect(entities.entities.value).toEqual({
          byId: {
            a: { id: 'a', val: 1 },
            c: { id: 'c', val: 0 },
          },
          allIds: ['a', 'c'],
        })

        history.undo()
        expect(entities.entities.value).toEqual({
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
