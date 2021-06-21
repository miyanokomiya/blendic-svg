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
  ElementNode,
  getBElement,
  getBone,
  getElementNode,
  getGraphObject,
  getTransform,
} from '/@/models'
import {
  getKeyframeBone,
  getKeyframeConstraint,
  getKeyframePoint,
} from '/@/models/keyframe'
import {
  addPoseTransform,
  boneToAffine,
  subPoseTransform,
} from '/@/utils/armatures'
import { mapReduce } from '/@/utils/commons'
import { getConstraint } from '/@/utils/constraints'
import {
  bakeKeyframe,
  bakeKeyframes,
  getClonedElementsTree,
  getGraphResolvedElementTree,
  getInterpolatedBoneMap,
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
              attributes: { transform: 'matrix(1,2,3,4,5,6)' },
              children: [
                getElementNode({
                  id: 'elm_b',
                  tag: 'g',
                  attributes: { transform: 'rotate(10,29,39)' },
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
              attributes: { transform: 'matrix(1,2,3,4,5,6)' },
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
        getKeyframeBone({
          id: 'a',
          targetId: 'bone_a',
          frame: 1,
          points: {
            rotate: getKeyframePoint({ value: 10 }),
          },
        }),
        getKeyframeBone({
          id: 'a',
          targetId: 'bone_a',
          frame: 3,
          points: {
            rotate: getKeyframePoint({ value: 30 }),
          },
        }),
      ],
    }
    const boneMap = {
      bone_a: getBone({ id: 'bone_a', parentId: 'bone_b' }),
      bone_b: getBone({ id: 'bone_b' }),
    }
    const elementMap = {
      root: getBElement({ id: 'root', viewBoxBoneId: 'bone_a' }),
      elm_a: getBElement({ id: 'elm_a', boneId: 'bone_a' }),
      elm_b: getBElement({ id: 'elm_b', boneId: '' }),
    }
    const root = getElementNode({
      id: 'root',
      attributes: { viewBox: '1 2 3 4' },
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
          root: { viewBox: '1 2 3 4' },
          elm_a: {
            transform: affineToTransform(
              boneToAffine(getBone({ transform: getTransform({ rotate: 20 }) }))
            ),
          },
          elm_b: {},
        })
      })
    })

    describe('addPoseTransform', () => {
      it('should add two transforms', () => {
        expect(
          addPoseTransform(
            getTransform({
              translate: { x: 1, y: 2 },
              scale: { x: 3, y: 4 },
              rotate: 5,
            }),
            getTransform({
              translate: { x: 10, y: 20 },
              scale: { x: 30, y: 40 },
              rotate: 50,
            })
          )
        ).toEqual(
          getTransform({
            translate: { x: 11, y: 22 },
            scale: { x: 33, y: 44 },
            rotate: 55,
          })
        )
      })
    })

    describe('subPoseTransform', () => {
      it('should sub two transforms', () => {
        expect(
          subPoseTransform(
            getTransform({
              translate: { x: 10, y: 20 },
              scale: { x: 30, y: 40 },
              rotate: 50,
            }),
            getTransform({
              translate: { x: 1, y: 2 },
              scale: { x: 3, y: 4 },
              rotate: 5,
            })
          )
        ).toEqual(
          getTransform({
            translate: { x: 9, y: 18 },
            scale: { x: 27, y: 36 },
            rotate: 45,
          })
        )
      })
    })

    describe('getInterpolatedBoneMap', () => {
      it('should get interpolated bones', () => {
        const keyframeMapByTargetId = {
          a: [
            getKeyframeBone({
              frame: 0,
              points: { rotate: getKeyframePoint({ value: 0 }) },
            }),
            getKeyframeBone({
              frame: 10,
              points: { rotate: getKeyframePoint({ value: 100 }) },
            }),
          ],
          con: [
            getKeyframeConstraint({
              frame: 0,
              points: { influence: getKeyframePoint({ value: 0 }) },
            }),
            getKeyframeConstraint({
              frame: 10,
              points: { influence: getKeyframePoint({ value: 1 }) },
            }),
          ],
        }
        const boneMap = {
          a: getBone({
            id: 'a',
            constraints: [getConstraint({ id: 'con', type: 'IK' })],
          }),
        }
        const ret = getInterpolatedBoneMap(keyframeMapByTargetId, boneMap, 2)
        expect(ret.a.transform.rotate).toBe(20)
        expect(ret.a.constraints[0].option.influence).toBe(0.2)
      })
    })

    describe('bakeKeyframe', () => {
      it('bake interpolated poses', () => {
        expect(bakeKeyframe(keyMap, boneMap, elementMap, root, 2)).toEqual({
          root: { viewBox: '1 2 3 4' },
          elm_a: {
            transform: affineToTransform(
              boneToAffine(getBone({ transform: getTransform({ rotate: 20 }) }))
            ),
          },
          elm_b: {},
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

  describe('getGraphResolvedElementTree', () => {
    it('should resolve transformations of graph objects', () => {
      const ret = getGraphResolvedElementTree(
        {
          a: getGraphObject({
            elementId: 'a',
            transform: getTransform({ translate: { x: 1, y: 2 } }),
          }),
        },
        getElementNode({ id: 'a' })
      )
      expect(ret.attributes).toEqual({
        transform: 'matrix(1,0,0,1,1,2)',
      })
    })
    it('should resolve recursively', () => {
      const ret = getGraphResolvedElementTree(
        {
          a: getGraphObject({
            elementId: 'a',
            transform: getTransform({ translate: { x: 1, y: 2 } }),
          }),
          b: getGraphObject({
            elementId: 'b',
            transform: getTransform({ translate: { x: 10, y: 20 } }),
          }),
        },
        getElementNode({ id: 'a', children: [getElementNode({ id: 'b' })] })
      )
      expect(ret.attributes.transform).toBe('matrix(1,0,0,1,1,2)')
      expect((ret.children[0] as ElementNode).attributes.transform).toBe(
        'matrix(1,0,0,1,10,20)'
      )
    })
  })

  describe('getClonedElementsTree', () => {
    it('should clone target elements', () => {
      const ret = getClonedElementsTree(
        {
          b: getGraphObject({
            id: 'b',
            elementId: 'a',
            clone: true,
          }),
        },
        getElementNode({ id: 'a', tag: 'rect' })
      )
      expect(ret).toEqual({
        id: 'blendic_group_a',
        tag: 'g',
        attributes: { 'data-blendic-use-id': 'a' },
        children: [
          {
            id: '',
            tag: 'template',
            attributes: {},
            children: [
              {
                id: 'a',
                tag: 'rect',
                attributes: {},
                children: [],
              },
            ],
          },
          {
            id: 'origin_a',
            tag: 'use',
            attributes: { href: '#a' },
            children: [],
          },
          {
            id: 'clone_b',
            tag: 'use',
            attributes: { href: '#a' },
            children: [],
          },
        ],
      })
    })
  })
})
