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

import { getBone } from '/@/models'
import * as ik from '/@/utils/constraints/ik'
import {
  getConstraint,
  getDependentCountMap,
  sortBoneByHighDependency,
  sortByDependency,
} from '/@/utils/constraints/index'

describe('src/utils/constraints/index.ts', () => {
  describe('sortBoneByHighDependency', () => {
    it('sort by high dependency', () => {
      const bones = [
        getBone({
          id: 'a',
          constraints: ['a_0'],
        }),
        getBone({
          id: 'b',
          parentId: 'a',
        }),
        getBone({ id: 'c' }),
      ]
      const constraintMap = {
        a_0: getConstraint({
          id: 'a_0',
          type: 'IK',
          name: 'IK.001',
          option: ik.getOption({ targetId: 'c' }),
        }),
      }
      const res = sortBoneByHighDependency(bones, constraintMap)
      expect(res.map((b) => b.id)).toEqual(['c', 'a', 'b'])
    })
  })

  describe('getDependentCountMap', () => {
    it('should return dependency map', () => {
      const boneMap = {
        a: getBone({
          id: 'a',
          constraints: ['a_0'],
        }),
        b: getBone({
          id: 'b',
          parentId: 'a',
        }),
        c: getBone({ id: 'c' }),
      }
      const constraintMap = {
        a_0: getConstraint({
          id: 'a_0',
          type: 'IK',
          name: 'IK.001',
          option: ik.getOption({ targetId: 'c' }),
        }),
      }
      const res = getDependentCountMap(boneMap, constraintMap)
      expect(res).toEqual({
        a: { c: 1 },
        b: { a: 1 },
        c: {},
      })
    })
  })

  describe('sortByDependency', () => {
    it('sort by dependency', () => {
      const map = {
        a: { b: 1 },
        b: { c: 1, d: 1 },
        c: { e: 1 },
        d: { c: 1 },
        e: {},
      }
      expect(sortByDependency(map)).toEqual(['e', 'c', 'd', 'b', 'a'])
    })
    it('give up circular dependency and sort them as string', () => {
      const map = {
        b: { c: 1 },
        c: { b: 1 },
        a: { b: 1 },
        d: {},
      }
      expect(sortByDependency(map)).toEqual(['d', 'a', 'b', 'c'])
    })
  })
})
