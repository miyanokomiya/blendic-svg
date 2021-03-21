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
} from '/@/utils/constraints/limitScale'

const useAll = {
  useMinX: true,
  useMaxX: true,
  useMinY: true,
  useMaxY: true,
}

describe('utils/limitScale.ts', () => {
  describe('apply', () => {
    describe('use options', () => {
      it('not use min', () => {
        const boneMap = {
          a: getBone({
            transform: getTransform({ scale: { x: 10, y: 20 } }),
          }),
        }
        expect(
          apply(
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
        ).toEqual(boneMap)
      })
      it('not use max', () => {
        const boneMap = {
          a: getBone({
            transform: getTransform({ scale: { x: 10, y: 20 } }),
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
          transform: getTransform({ scale: { x: 10, y: 20 } }),
        }),
      }
      it('limit scale max', () => {
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
            transform: getTransform({
              scale: { x: 7.5, y: 17.5 },
            }),
          }),
        })
      })
      it('limit scale min', () => {
        expect(
          apply(
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
        ).toEqual({
          a: getBone({
            transform: getTransform({
              scale: { x: 15, y: 25 },
            }),
          }),
        })
      })
    })
    describe('local space', () => {
      const localMap = {
        a: getBone({
          parentId: 'b',
          transform: getTransform({ scale: { x: 4, y: 6 } }),
        }),
      }
      const boneMap = {
        a: getBone({
          parentId: 'b',
          transform: getTransform({ scale: { x: 10, y: 20 } }),
        }),
        b: getBone({
          transform: getTransform({ scale: { x: 100, y: 200 } }),
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
              ...useAll,
            }),
            localMap,
            boneMap
          )
        ).toEqual({
          ...boneMap,
          a: getBone({
            parentId: 'b',
            transform: getTransform({ scale: { x: 350, y: 5.5 * 200 } }),
          }),
        })
      })
      it('ignore parent scale if inherit scale is false', () => {
        expect(
          apply(
            'a',
            getOption({
              maxX: 3,
              maxY: 5,
              influence: 0.5,
              spaceType: 'local',
              ...useAll,
            }),
            localMap,
            { ...boneMap, a: { ...boneMap.a, inheritScale: false } }
          )
        ).toEqual({
          ...boneMap,
          a: getBone({
            parentId: 'b',
            inheritScale: false,
            transform: getTransform({ scale: { x: 3.5, y: 5.5 } }),
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
