import * as target from '../../src/models/entity'

describe('src/models/entity.ts', () => {
  describe('addEntity', () => {
    it('should add new entity', () => {
      expect(
        target.addEntity(
          {
            byId: { a: { id: 'a' } },
            allIds: ['a'],
          },
          { id: 'b' }
        )
      ).toEqual({
        byId: { a: { id: 'a' }, b: { id: 'b' } },
        allIds: ['a', 'b'],
      })
    })
  })

  describe('updateEntity', () => {
    it('should update the entity', () => {
      expect(
        target.updateEntity(
          {
            byId: { a: { id: 'a' }, b: { id: 'b', val: 1 } },
            allIds: ['a', 'b'],
          },
          { id: 'b', val: 2 }
        )
      ).toEqual({
        byId: { a: { id: 'a' }, b: { id: 'b', val: 2 } },
        allIds: ['a', 'b'],
      })
    })
  })

  describe('updateEntities', () => {
    it('should update some entities', () => {
      expect(
        target.updateEntities(
          {
            byId: { a: { id: 'a', val: 0 }, b: { id: 'b', val: 1 } },
            allIds: ['a', 'b'],
          },
          {
            a: { id: 'a', val: 1 },
            b: { id: 'b', val: 2 },
          }
        )
      ).toEqual({
        byId: { a: { id: 'a', val: 1 }, b: { id: 'b', val: 2 } },
        allIds: ['a', 'b'],
      })
    })
  })

  describe('removeEntity', () => {
    it('should remove the entity', () => {
      expect(
        target.removeEntity(
          {
            byId: { a: { id: 'a' }, b: { id: 'b' } },
            allIds: ['a', 'b'],
          },
          'b'
        )
      ).toEqual({
        byId: { a: { id: 'a' } },
        allIds: ['a'],
      })
    })
  })

  describe('removeEntities', () => {
    it('should remove some entities', () => {
      expect(
        target.removeEntities(
          {
            byId: { a: { id: 'a' }, b: { id: 'b' }, c: { id: 'c' } },
            allIds: ['a', 'b', 'c'],
          },
          ['b', 'c']
        )
      ).toEqual({
        byId: { a: { id: 'a' } },
        allIds: ['a'],
      })
    })
  })

  describe('toEntityList', () => {
    it('should return list of entities', () => {
      expect(
        target.toEntityList({
          byId: { a: { id: 'a' }, b: { id: 'b' } },
          allIds: ['a', 'b'],
        })
      ).toEqual([{ id: 'a' }, { id: 'b' }])
    })
  })

  describe('fromEntityList', () => {
    it('should return entities from list', () => {
      expect(target.fromEntityList([{ id: 'a' }, { id: 'b' }])).toEqual({
        byId: { a: { id: 'a' }, b: { id: 'b' } },
        allIds: ['a', 'b'],
      })
    })
  })
})
