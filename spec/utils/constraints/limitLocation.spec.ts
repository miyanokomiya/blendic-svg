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

import { add, sub } from 'okageo'
import { assertBoneGeometry } from 'spec/tools'
import { getTransform, getBone } from '/@/models'
import { toBoneSpaceFn } from '/@/utils/armatures'
import {
  apply,
  getDependentCountMap,
  getOption,
  immigrate,
} from '/@/utils/constraints/limitLocation'

const useAll = {
  useMinX: true,
  useMaxX: true,
  useMinY: true,
  useMaxY: true,
}

describe('src/utils/constraints/limitLocation.ts', () => {
  describe('apply', () => {
    it('do nothing if target is connected', () => {
      const boneMap = {
        a: getBone({
          head: { x: 1, y: 2 },
          connected: true,
          transform: getTransform({ translate: { x: 10, y: 20 } }),
        }),
      }
      expect(apply('a', getOption(useAll), {}, boneMap)).toEqual(boneMap)
    })

    describe('use options', () => {
      it('not use min', () => {
        const boneMap = {
          a: getBone({
            head: { x: 1, y: 2 },
            tail: { x: 1, y: 3 },
            transform: getTransform({ translate: { x: 10, y: 20 } }),
          }),
        }
        const ret = apply(
          'a',
          getOption({
            minX: 100,
            maxX: 500,
            minY: 100,
            maxY: 500,
            useMaxX: true,
            useMaxY: true,
          }),
          {},
          boneMap
        )
        assertBoneGeometry(ret.a, boneMap.a)
      })
      it('not use max', () => {
        const boneMap = {
          a: getBone({
            head: { x: 1, y: 2 },
            tail: { x: 1, y: 3 },
            transform: getTransform({ translate: { x: 10, y: 20 } }),
          }),
        }
        expect(
          apply(
            'a',
            getOption({
              minX: 0,
              maxX: 1,
              minY: 0,
              maxY: 1,
              useMinX: true,
              useMinY: true,
            }),
            {},
            boneMap
          )
        ).toEqual(boneMap)
      })
    })

    describe('world space', () => {
      const boneMap = {
        a: getBone({
          head: { x: 1, y: 2 },
          tail: { x: 1, y: 3 },
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
              ...useAll,
            }),
            {},
            boneMap
          )
        ).toEqual({
          a: getBone({
            head: { x: 1, y: 2 },
            tail: { x: 1, y: 3 },
            transform: getTransform({
              translate: { x: 7, y: 15 + (22 - 15) / 2 - 2 },
            }),
          }),
        })
      })
      it('limit location min', () => {
        const ret = apply(
          'a',
          getOption({
            minX: 20,
            maxX: 100,
            minY: 30,
            maxY: 100,
            influence: 0.5,
            ...useAll,
          }),
          {},
          boneMap
        )
        assertBoneGeometry(
          ret.a,
          getBone({
            head: { x: 1, y: 2 },
            tail: { x: 1, y: 3 },
            transform: getTransform({
              translate: toBoneSpaceFn(boneMap.a).toLocal({ x: 14.5, y: 24 }),
            }),
          })
        )
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
          tail: { x: 1, y: 3 },
          transform: getTransform({ translate: { x: 10, y: 20 } }),
        }),
        b: getBone({
          tail: { x: 0, y: 1 },
          transform: getTransform({ translate: { x: 100, y: 200 } }),
        }),
      }
      it('limit locally', () => {
        const ret = apply(
          'a',
          getOption({
            maxX: 3,
            maxY: 5,
            influence: 0.5,
            spaceType: 'local',
            ...useAll,
          }),
          localMap,
          boneMap
        )
        assertBoneGeometry(
          ret.a,
          getBone({
            head: { x: 1, y: 2 },
            tail: { x: 1, y: 3 },
            transform: getTransform({
              translate: add(
                toBoneSpaceFn(boneMap.a).toLocal({ x: 100, y: 200 }),
                { x: 3.5, y: 5.5 }
              ),
            }),
          })
        )
      })
      it('limit locally and extend parent transform', () => {
        const map = {
          ...boneMap,
          b: {
            ...boneMap.b,
            transform: {
              ...boneMap.b.transform,
              rotate: 180,
            },
          },
        }
        const ret = apply(
          'a',
          getOption({
            maxX: 3,
            maxY: 5,
            spaceType: 'local',
            ...useAll,
          }),
          localMap,
          map
        )
        assertBoneGeometry(
          ret.a,
          getBone({
            head: { x: 1, y: 2 },
            tail: { x: 1, y: 3 },
            transform: getTransform({
              translate: sub(
                toBoneSpaceFn(boneMap.a).toLocal({ x: 100, y: 200 }),
                { x: 3, y: 5 }
              ),
            }),
          })
        )
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
