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

describe('utils/copyRotation.ts', () => {
  describe('apply', () => {
    const parent = getBone({
      id: 'parent',
      transform: getTransform({ rotate: 10 }),
    })
    const boneMap = {
      a: getBone({
        id: 'a',
        transform: getTransform({ rotate: 180 }),
      }),
      b: getBone({
        id: 'b',
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
        expect(
          apply(
            'b',
            getOption({
              targetId: 'a',
              influence: 0.5,
            }),
            localMap,
            boneMap
          )
        ).toEqual({
          a: getBone({
            id: 'a',
            transform: getTransform({ rotate: 180 }),
          }),
          b: getBone({
            id: 'b',
            transform: getTransform({ rotate: 180 }),
            parentId: 'parent',
          }),
          parent,
        })
      })
    })
    describe('target: world, owner: local', () => {
      it('copy rotation', () => {
        expect(
          apply(
            'b',
            getOption({
              targetId: 'a',
              influence: 0.5,
              ownerSpaceType: 'local',
            }),
            localMap,
            boneMap
          )
        ).toEqual({
          a: getBone({
            id: 'a',
            transform: getTransform({ rotate: 180 }),
          }),
          b: getBone({
            id: 'b',
            transform: getTransform({ rotate: 190 }),
            parentId: 'parent',
          }),
          parent,
        })
      })
      it('inheritRotation: false', () => {
        expect(
          apply(
            'b',
            getOption({
              targetId: 'a',
              influence: 0.5,
            }),
            localMap,
            { ...boneMap, b: { ...boneMap.b, inheritRotation: false } }
          )
        ).toEqual({
          a: getBone({
            id: 'a',
            transform: getTransform({ rotate: 180 }),
          }),
          b: getBone({
            id: 'b',
            transform: getTransform({ rotate: 180 }),
            parentId: 'parent',
            inheritRotation: false,
          }),
          parent,
        })
      })
    })
    describe('target: local, owner: world', () => {
      it('copy rotation', () => {
        expect(
          apply(
            'b',
            getOption({
              targetId: 'a',
              influence: 0.5,
              targetSpaceType: 'local',
            }),
            localMap,
            boneMap
          )
        ).toEqual({
          a: getBone({
            id: 'a',
            transform: getTransform({ rotate: 180 }),
          }),
          b: getBone({
            id: 'b',
            transform: getTransform({ rotate: 90 }),
            parentId: 'parent',
          }),
          parent,
        })
      })
    })
    describe('target: local, owner: local', () => {
      it('copy rotation', () => {
        expect(
          apply(
            'b',
            getOption({
              targetId: 'a',
              influence: 0.5,
              targetSpaceType: 'local',
              ownerSpaceType: 'local',
            }),
            localMap,
            boneMap
          )
        ).toEqual({
          a: getBone({
            id: 'a',
            transform: getTransform({ rotate: 180 }),
          }),
          b: getBone({
            id: 'b',
            transform: getTransform({ rotate: 100 }),
            parentId: 'parent',
          }),
          parent,
        })
      })
    })
  })

  describe('immigrate', () => {
    it('immigrate identically', () => {
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
