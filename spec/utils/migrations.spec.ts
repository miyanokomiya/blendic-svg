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

import { getConstraint } from '/@/utils/constraints'
import {
  migrateConstraint,
  migrateConstraint4,
  migrateConstraint5,
  migrateConstraint6,
} from '/@/utils/migrations'

describe('src/utils/migrations.ts', () => {
  describe('migrateConstraint', () => {
    it('should return identity model if src is the latest model', () => {
      const src = getConstraint({ type: 'IK' }, true)
      expect(migrateConstraint(src)).toEqual(src)
    })
  })

  describe('migrateConstraint4', () => {
    it('should set type if it is undefined', () => {
      const src = getConstraint({ type: 'IK' })
      expect(
        migrateConstraint4({
          name: src.type,
          option: src.option,
        })
      ).toEqual({
        type: src.type,
        name: src.type,
        option: src.option,
      })
    })
    it('should not replace type if it is defined', () => {
      const src = getConstraint({ type: 'IK' })
      expect(migrateConstraint4(src)).toEqual(src)
    })
  })

  describe('migrateConstraint5', () => {
    it('should set id if it is undefined', () => {
      const src = getConstraint({ type: 'IK' })
      const { id, ...others } = migrateConstraint5({
        type: src.type,
        name: src.type,
        option: src.option,
      })

      expect(id).toBeTruthy()
      expect(others).toEqual({
        type: src.type,
        name: src.type,
        option: src.option,
      })
    })
    it('should not replace id if it is defined', () => {
      const src = getConstraint({ id: 'a', type: 'IK' })
      expect(migrateConstraint5(src)).toEqual(src)
    })
  })

  describe('migrateConstraint6', () => {
    it('should set influence if it is undefined', () => {
      const src = getConstraint({ type: 'IK' })
      const ret = migrateConstraint6({
        id: src.id,
        type: src.type,
        name: src.type,
        option: src.option,
      })

      expect(ret).toEqual({
        id: src.id,
        type: src.type,
        name: src.type,
        option: { ...src.option, influence: 1 },
      })
    })
    it('should not replace id if it is defined', () => {
      const src = getConstraint({ id: 'a', type: 'IK' })
      expect(migrateConstraint6(src)).toEqual(src)
    })
  })
})
