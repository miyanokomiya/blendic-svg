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

import { getTransform, getBone } from '/@/models'
import {
  apply,
  getDependentCountMap,
  getOption,
  immigrate,
} from '/@/utils/constraints/copyRotation'

describe('utils/constraints/copyRotation.ts', () => {
  describe('apply', () => {
    const parent = getBone({
      id: 'parent',
      transform: getTransform({ rotate: 10 }),
    })
    const boneMap = {
      a: getBone({
        id: 'a',
        tail: { x: 1, y: 1 },
        transform: getTransform({ rotate: 180 }),
      }),
      b: getBone({
        id: 'b',
        tail: { x: 0, y: 1 },
        transform: getTransform({ rotate: 10 }),
        parentId: 'parent',
      }),
      parent,
    }
    const localMap = {
      a: getBone({
        id: 'a',
        transform: getTransform({ rotate: 90 }),
      }),
      b: getBone({
        id: 'b',
        transform: getTransform({ rotate: 0 }),
        parentId: 'parent',
      }),
      parent,
    }

    describe('target: world, owner: world', () => {
      it('copy rotation', () => {
        const ret = apply(
          'b',
          getOption({
            targetId: 'a',
          }),
          localMap,
          boneMap
        )
        expect(ret.b).toEqual(
          getBone({
            id: 'b',
            tail: { x: 0, y: 1 },
            transform: getTransform({ rotate: 135 }),
            parentId: 'parent',
          })
        )
      })
    })
    describe('target: world, owner: world, invert: true', () => {
      it('copy rotation', () => {
        const ret = apply(
          'b',
          getOption({
            targetId: 'a',
            invert: true,
          }),
          localMap,
          boneMap
        )
        expect(ret.b).toEqual(
          getBone({
            id: 'b',
            tail: { x: 0, y: 1 },
            transform: getTransform({ rotate: -315 }),
            parentId: 'parent',
          })
        )
      })
    })
    describe('influence: 0.5', () => {
      it('target: world, owner: world', () => {
        const ret = apply(
          'b',
          getOption({
            targetId: 'a',
            influence: 0.5,
          }),
          localMap,
          boneMap
        )
        expect(ret.b).toEqual(
          getBone({
            id: 'b',
            tail: { x: 0, y: 1 },
            transform: getTransform({ rotate: 72.5 }),
            parentId: 'parent',
          })
        )
      })
    })
    describe('target: world, owner: local', () => {
      it('copy rotation', () => {
        const ret = apply(
          'b',
          getOption({
            targetId: 'a',
            ownerSpaceType: 'local',
          }),
          localMap,
          boneMap
        )
        expect(ret.b).toEqual(
          getBone({
            id: 'b',
            tail: { x: 0, y: 1 },
            transform: getTransform({ rotate: 235 }),
            parentId: 'parent',
          })
        )
      })
      it('inheritRotation: false', () => {
        const ret = apply(
          'b',
          getOption({
            targetId: 'a',
            ownerSpaceType: 'local',
          }),
          localMap,
          { ...boneMap, b: { ...boneMap.b, inheritRotation: false } }
        )
        expect(ret.b).toEqual(
          getBone({
            id: 'b',
            tail: { x: 0, y: 1 },
            transform: getTransform({ rotate: 225 }),
            parentId: 'parent',
            inheritRotation: false,
          })
        )
      })
    })
    describe('target: local, owner: world', () => {
      it('copy rotation', () => {
        const ret = apply(
          'b',
          getOption({
            targetId: 'a',
            targetSpaceType: 'local',
          }),
          localMap,
          boneMap
        )
        expect(ret.b).toEqual(
          getBone({
            id: 'b',
            tail: { x: 0, y: 1 },
            transform: getTransform({ rotate: 0 }),
            parentId: 'parent',
          })
        )
      })
    })
    describe('target: local, owner: local', () => {
      it('copy rotation', () => {
        const ret = apply(
          'b',
          getOption({
            targetId: 'a',
            targetSpaceType: 'local',
            ownerSpaceType: 'local',
          }),
          localMap,
          boneMap
        )
        expect(ret.b).toEqual(
          getBone({
            id: 'b',
            tail: { x: 0, y: 1 },
            transform: getTransform({ rotate: 100 }),
            parentId: 'parent',
          })
        )
      })
    })
  })

  describe('immigrate', () => {
    it('immigrate bone ids', () => {
      expect(immigrate({ a: 'aa', b: 'bb' }, getOption())).toEqual(getOption())
      expect(
        immigrate({ a: 'aa', b: 'bb' }, getOption({ targetId: 'a' }))
      ).toEqual(getOption({ targetId: 'aa' }))
      expect(immigrate({}, getOption({ targetId: 'a' }))).toEqual(
        getOption({ targetId: 'a' })
      )
    })
  })

  describe('getDependentCountMap', () => {
    it('get dependent count map', () => {
      expect(getDependentCountMap(getOption({ targetId: 'a' }))).toEqual({
        a: 1,
      })
    })
  })
})
