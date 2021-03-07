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
} from '/@/utils/constraints/limitRotation'

describe('utils/limitRotation.ts', () => {
  describe('apply', () => {
    describe('world space', () => {
      const boneMap = {
        a: getBone({
          transform: getTransform({ rotate: 180 }),
        }),
      }
      it('limit rotation max', () => {
        expect(
          apply(
            'a',
            getOption({
              min: 0,
              max: 90,
              influence: 0.5,
            }),
            {},
            boneMap
          )
        ).toEqual({
          a: getBone({
            transform: getTransform({ rotate: 135 }),
          }),
        })
      })
      it('limit rotation min', () => {
        expect(
          apply(
            'a',
            getOption({
              min: 360,
              max: 600,
              influence: 0.5,
            }),
            {},
            boneMap
          )
        ).toEqual({
          a: getBone({
            transform: getTransform({ rotate: 270 }),
          }),
        })
      })
    })
    describe('local space', () => {
      const localMap = {
        a: getBone({
          parentId: 'b',
          transform: getTransform({ rotate: 0 }),
        }),
      }
      const boneMap = {
        a: getBone({
          parentId: 'b',
          transform: getTransform({ rotate: 180 }),
        }),
        b: getBone({
          transform: getTransform({ rotate: 180 }),
        }),
      }
      it('limit locally', () => {
        expect(
          apply(
            'a',
            getOption({
              min: 90,
              max: 90,
              influence: 0.5,
              spaceType: 'local',
            }),
            localMap,
            boneMap
          )
        ).toEqual({
          ...boneMap,
          a: getBone({
            parentId: 'b',
            transform: getTransform({ rotate: 225 }),
          }),
        })
      })
    })
  })

  describe('immigrate', () => {
    it('immigrate identically', () => {
      expect(immigrate({ a: 'aa', b: 'bb' }, getOption())).toEqual(getOption())
    })
  })

  describe('getDependentCountMap', () => {
    it('get empty map', () => {
      expect(getDependentCountMap(getOption())).toEqual({})
    })
  })
})
