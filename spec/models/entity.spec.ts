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

import * as target from '../../src/models/entity'

describe('src/models/entity.ts', () => {
  describe('setEntities', () => {
    it('should set  entities', () => {
      const src = {
        byId: { a: { id: 'a' } },
        allIds: ['a'],
      }
      target.setEntities(src, [{ id: 'b' }])
      expect(src).toEqual({
        byId: { b: { id: 'b' } },
        allIds: ['b'],
      })
    })
  })

  describe('addEntity', () => {
    it('should add new entity', () => {
      const src = {
        byId: { a: { id: 'a' } },
        allIds: ['a'],
      }
      target.addEntity(src, { id: 'b' })
      expect(src).toEqual({
        byId: { a: { id: 'a' }, b: { id: 'b' } },
        allIds: ['a', 'b'],
      })
    })
  })

  describe('updateEntity', () => {
    it('should update the entity', () => {
      const src = {
        byId: { a: { id: 'a' }, b: { id: 'b', val: 1 } },
        allIds: ['a', 'b'],
      }
      target.updateEntity(src, { id: 'b', val: 2 })
      expect(src).toEqual({
        byId: { a: { id: 'a' }, b: { id: 'b', val: 2 } },
        allIds: ['a', 'b'],
      })
    })
  })

  describe('updateEntities', () => {
    it('should update some entities', () => {
      const src = {
        byId: { a: { id: 'a', val: 0 }, b: { id: 'b', val: 1 } },
        allIds: ['a', 'b'],
      }
      target.updateEntities(src, {
        a: { id: 'a', val: 1 },
        b: { id: 'b', val: 2 },
      })
      expect(src).toEqual({
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
      const src = {
        byId: { a: { id: 'a' }, b: { id: 'b' }, c: { id: 'c' } },
        allIds: ['a', 'b', 'c'],
      }
      target.removeEntities(src, ['b', 'c'])
      expect(src).toEqual({
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
