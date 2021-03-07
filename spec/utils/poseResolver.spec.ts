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
  affineToTransform,
  IDENTITY_AFFINE,
  invertTransform,
  multiAffine,
  multiAffines,
} from 'okageo'
import {
  getBElement,
  getBone,
  getElementNode,
  getKeyframe,
  getTransform,
} from '/@/models'
import { poseToAffine } from '/@/utils/armatures'
import { mapReduce } from '/@/utils/commons'
import {
  bakeKeyframe,
  bakeKeyframes,
  getNativeDeformMatrix,
  getPoseDeformMatrix,
  getPosedElementMatrixMap,
} from '/@/utils/poseResolver'

describe('utils/poseResolver.ts', () => {
  describe('getPoseDeformMatrix', () => {
    it('return identy affine if matrixes are undefined', () => {
      expect(getPoseDeformMatrix()).toEqual(IDENTITY_AFFINE)
    })
    it('prevent inverting zero scaled matrix', () => {
      const a: AffineMatrix = [0, 0, 3, 4, 5, 6]
      const b: AffineMatrix = [10, 20, 30, 40, 50, 60]
      const c: AffineMatrix = [100, 200, 300, 400, 500, 600]
      const exp = [0, 0, 0, 0, expect.any(Number), expect.any(Number)]
      expect(getPoseDeformMatrix(a, b, c)).toEqual(exp)
      expect(getPoseDeformMatrix(b, c, a)).toEqual(exp)
      expect(getPoseDeformMatrix(c, a, b)).toEqual(
        [...Array(6)].map((_) => expect.any(Number))
      )
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

  describe('getPosedElementMatrixMap', () => {
    it('get matrix tree', () => {
      const map = getPosedElementMatrixMap(
        {
          bone_a: getBone({
            id: 'bone_a',
            transform: getTransform({ rotate: 45, origin: { x: 1, y: 2 } }),
          }),
          bone_b: getBone({
            id: 'bone_b',
            parentId: 'bone_a',
            transform: getTransform({ rotate: 45, origin: { x: 1, y: 2 } }),
          }),
          bone_c: getBone({
            id: 'bone_c',
            parentId: 'bone_b',
            transform: getTransform(),
          }),
          bone_d: getBone({
            id: 'bone_d',
            transform: getTransform(),
          }),
        },
        {
          elm_a: getBElement({ id: 'elm_a', boneId: 'bone_a' }),
          elm_b: getBElement({ id: 'elm_b', boneId: 'bone_b' }),
          elm_c: getBElement({ id: 'elm_c', boneId: 'bone_c' }),
          elm_d: getBElement({ id: 'elm_d', boneId: 'bone_d' }),
        },
        getElementNode({
          id: 'root',
          tag: 'svg',
          children: [
            getElementNode({
              id: 'elm_a',
              tag: 'g',
              attributs: { transform: 'matrix(1,2,3,4,5,6)' },
              children: [
                getElementNode({
                  id: 'elm_b',
                  tag: 'g',
                  attributs: { transform: 'rotate(10,29,39)' },
                  children: [],
                }),
              ],
            }),
            getElementNode({
              id: 'elm_c',
              tag: 'g',
              children: [],
            }),
            getElementNode({
              id: 'elm_d',
              tag: 'g',
              attributs: { transform: 'matrix(1,2,3,4,5,6)' },
              children: [],
            }),
          ],
        })
      )
      expect(
        JSON.stringify(mapReduce(map, affineToTransform), null, ' ')
      ).toMatchSnapshot()
    })
  })

  describe('bake', () => {
    const keyMap = {
      bone_a: [
        getKeyframe({
          id: 'a',
          boneId: 'bone_a',
          transform: getTransform({ rotate: 10 }),
          frame: 1,
        }),
        getKeyframe({
          id: 'a',
          boneId: 'bone_a',
          transform: getTransform({ rotate: 30 }),
          frame: 3,
        }),
      ],
    }
    const boneMap = {
      bone_a: getBone({ id: 'bone_a', parentId: 'bone_b' }),
      bone_b: getBone({ id: 'bone_b' }),
    }
    const elementMap = {
      elm_a: getBElement({ id: 'elm_a', boneId: 'bone_a' }),
      elm_b: getBElement({ id: 'elm_b', boneId: '' }),
    }
    const root = getElementNode({
      id: 'root',
      children: [
        getElementNode({ id: 'elm_a' }),
        getElementNode({ id: 'elm_b' }),
      ],
    })

    describe('bakeKeyframes', () => {
      it('bake poses from frame 0 to endFrame', () => {
        const res = bakeKeyframes(keyMap, boneMap, elementMap, root, 5)
        expect(Object.keys(res).sort()).toEqual(['0', '1', '2', '3', '4', '5'])
        expect(res[2]).toEqual({
          root: IDENTITY_AFFINE,
          elm_a: poseToAffine(getTransform({ rotate: 20 })),
          elm_b: IDENTITY_AFFINE,
        })
      })
    })

    describe('bakeKeyframe', () => {
      it('bake interpolated poses', () => {
        expect(bakeKeyframe(keyMap, boneMap, elementMap, root, 2)).toEqual({
          root: IDENTITY_AFFINE,
          elm_a: poseToAffine(getTransform({ rotate: 20 })),
          elm_b: IDENTITY_AFFINE,
        })
      })
      it('json snapshot', () => {
        expect(
          JSON.stringify(
            bakeKeyframe(keyMap, boneMap, elementMap, root, 2),
            null,
            ' '
          )
        ).toMatchSnapshot()
      })
    })
  })
})
