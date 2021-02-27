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

import {
  AffineMatrix,
  IDENTITY_AFFINE,
  invertTransform,
  multiAffine,
  multiAffines,
} from 'okageo'
import { getBone, getTransform } from '/@/models'
import {
  getNativeDeformMatrix,
  getPoseDeformMatrix,
  resolveRelativePose,
  TransformCache,
} from '/@/utils/poseResolver'

describe('utils/poseResolver.ts', () => {
  describe('resolveRelativePose', () => {
    const boneMap = {
      a: getBone({ id: 'a', transform: getTransform({ rotate: 1 }) }),
      relative_root: getBone({
        id: 'relative_root',
        parentId: 'a',
        transform: getTransform({ rotate: 10 }),
      }),
      b: getBone({
        id: 'b',
        parentId: 'relative_root',
        transform: getTransform({ rotate: 100 }),
      }),
      target: getBone({
        id: 'target',
        parentId: 'b',
        transform: getTransform({ rotate: 1000 }),
      }),
    }

    it('resolve relative pose the target bone based at relative root', () => {
      expect(resolveRelativePose(boneMap, 'relative_root', 'target')).toEqual(
        getTransform({
          rotate: 1100,
        })
      )
    })
    it('save cache', () => {
      const cache: TransformCache = {}
      resolveRelativePose(boneMap, 'relative_root', 'target', cache)
      expect(cache).toEqual({
        relative_root: {
          target: getTransform({
            rotate: 1100,
          }),
        },
      })
    })
    it('use cache', () => {
      const cache: TransformCache = {
        relative_root: { target: getTransform({ rotate: -1100 }) },
      }
      resolveRelativePose(boneMap, 'relative_root', 'target', cache)
      expect(cache).toEqual({
        relative_root: {
          target: getTransform({
            rotate: -1100,
          }),
        },
      })
    })
  })

  describe('getPoseDeformMatrix', () => {
    it('return identy affine if matrixes are undefined', () => {
      expect(getPoseDeformMatrix()).toEqual(IDENTITY_AFFINE)
    })
    it('return multi affine matrix: b^-1 * a', () => {
      const a: AffineMatrix = [1, 2, 3, 4, 5, 6]
      const b: AffineMatrix = [10, 20, 30, 40, 50, 60]
      const c: AffineMatrix = [100, 200, 300, 400, 500, 600]
      expect(getPoseDeformMatrix(a, b, c)).toEqual(
        multiAffines([invertTransform(c), invertTransform(a), b])
      )
    })
  })

  describe('getNativeDeformMatrix', () => {
    it('return identy affine if matrixes are undefined', () => {
      expect(getPoseDeformMatrix()).toEqual(IDENTITY_AFFINE)
    })
    it('return multi affine matrix: a * b', () => {
      const a: AffineMatrix = [1, 2, 3, 4, 5, 6]
      const b: AffineMatrix = [10, 20, 30, 40, 50, 60]
      expect(getNativeDeformMatrix(a, b)).toEqual(multiAffine(a, b))
    })
  })
})
