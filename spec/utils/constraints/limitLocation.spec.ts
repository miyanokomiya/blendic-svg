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
} from '/@/utils/constraints/limitLocation'

describe('utils/limitLocation.ts', () => {
  describe('apply', () => {
    describe('world space', () => {
      const boneMap = {
        a: getBone({
          head: { x: 1, y: 2 },
          transform: getTransform({ translate: { x: 10, y: 20 } }),
        }),
      }
      it('limit location max', () => {
        expect(
          apply(
            'a',
            getOption({
              minX: 0,
              maxX: 5,
              minY: 0,
              maxY: 15,
              influence: 0.5,
            }),
            {},
            boneMap
          )
        ).toEqual({
          a: getBone({
            head: { x: 1, y: 2 },
            transform: getTransform({
              translate: { x: 7, y: 15 + (22 - 15) / 2 - 2 },
            }),
          }),
        })
      })
      it('limit location min', () => {
        expect(
          apply(
            'a',
            getOption({
              minX: 20,
              maxX: 100,
              minY: 30,
              maxY: 100,
              influence: 0.5,
            }),
            {},
            boneMap
          )
        ).toEqual({
          a: getBone({
            head: { x: 1, y: 2 },
            transform: getTransform({
              translate: { x: 14.5, y: 24 },
            }),
          }),
        })
      })
    })
    describe('local space', () => {
      const localMap = {
        a: getBone({
          parentId: 'b',
          transform: getTransform({ translate: { x: 4, y: 6 } }),
        }),
      }
      const boneMap = {
        a: getBone({
          parentId: 'b',
          head: { x: 1, y: 2 },
          transform: getTransform({ translate: { x: 10, y: 20 } }),
        }),
        b: getBone({
          transform: getTransform({ translate: { x: 100, y: 200 } }),
        }),
      }
      it('limit locally', () => {
        expect(
          apply(
            'a',
            getOption({
              maxX: 3,
              maxY: 5,
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
            head: { x: 1, y: 2 },
            transform: getTransform({ translate: { x: 103.5, y: 205.5 } }),
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
