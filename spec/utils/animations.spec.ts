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

import { getAction, getArmature, getBone, toMap } from '/@/models'
import { getKeyframeBone, getKeyframePoint } from '/@/models/keyframe'
import {
  cleanActions,
  mergeKeyframesWithDropped,
  slideKeyframesTo,
  sortKeyframeMap,
  findNextFrameWithKeyframe,
  findPrevFrameWithKeyframe,
  getAfterKeyframe,
  isSameKeyframeStatus,
  getSameRangeFrameMapByBoneId,
  getLastFrame,
} from '/@/utils/animations'

describe('utils/animations.ts', () => {
  describe('sortKeyframeMap', () => {
    it('get sorted keyframes map', () => {
      expect(
        sortKeyframeMap({
          a: [
            getKeyframeBone({ frame: 2 }),
            getKeyframeBone({ frame: 3 }),
            getKeyframeBone({ frame: 1 }),
          ],
        })
      ).toEqual({
        a: [
          getKeyframeBone({ frame: 1 }),
          getKeyframeBone({ frame: 2 }),
          getKeyframeBone({ frame: 3 }),
        ],
      })
    })
  })

  describe('getAfterKeyframe', () => {
    it('get undefined if no after keyframe', () => {
      expect(getAfterKeyframe([getKeyframeBone({ frame: 1 })], 1)).toBe(
        undefined
      )
    })
    it('get the after keyframe', () => {
      expect(
        getAfterKeyframe(
          [
            getKeyframeBone({ frame: 1 }),
            getKeyframeBone({ frame: 3 }),
            getKeyframeBone({ frame: 4 }),
          ],
          1
        )
      ).toEqual(getKeyframeBone({ frame: 3 }))
    })
  })

  describe('isSameKeyframeStatus', () => {
    it('return false if different transform', () => {
      expect(
        isSameKeyframeStatus(
          getKeyframeBone(),
          getKeyframeBone({ rotate: getKeyframePoint({ value: 10 }) })
        )
      ).toBe(false)
    })
    it('return true if same transform', () => {
      expect(
        isSameKeyframeStatus(
          getKeyframeBone({ rotate: getKeyframePoint({ value: 10 }) }),
          getKeyframeBone({ rotate: getKeyframePoint({ value: 10 }) })
        )
      ).toBe(true)
    })
  })

  describe('slideKeyframesTo', () => {
    it('do nothing if empty', () => {
      expect(slideKeyframesTo([], 10)).toEqual([])
    })
    it('slide keyframes to the frame', () => {
      expect(
        slideKeyframesTo(
          [
            getKeyframeBone({ id: '1', frame: 1 }),
            getKeyframeBone({ id: '2', frame: 2 }),
            getKeyframeBone({ id: '4', frame: 4 }),
          ],
          10
        )
      ).toEqual([
        getKeyframeBone({ id: '1', frame: 10 }),
        getKeyframeBone({ id: '2', frame: 11 }),
        getKeyframeBone({ id: '4', frame: 13 }),
      ])
    })
  })

  describe('mergeKeyframesWithDropped', () => {
    it('merge keyframes by the same frame and boneId', () => {
      const ret = mergeKeyframesWithDropped(
        [
          getKeyframeBone({ id: 'src_1_a', frame: 1, boneId: 'a' }),
          getKeyframeBone({ id: 'src_1_b', frame: 1, boneId: 'b' }),
          getKeyframeBone({ id: 'src_1_d', frame: 1, boneId: 'd' }),
          getKeyframeBone({ id: 'src_2_a', frame: 2, boneId: 'a' }),
        ],
        [
          getKeyframeBone({ id: 'ove_1_a', frame: 1, boneId: 'a' }),
          getKeyframeBone({ id: 'ove_2_b', frame: 2, boneId: 'b' }),
          getKeyframeBone({ id: 'ove_1_c', frame: 1, boneId: 'c' }),
          getKeyframeBone({ id: 'ove_3_c', frame: 3, boneId: 'c' }),
        ]
      )
      expect(toMap(ret.merged)).toEqual({
        src_1_b: getKeyframeBone({ id: 'src_1_b', frame: 1, boneId: 'b' }),
        src_1_d: getKeyframeBone({ id: 'src_1_d', frame: 1, boneId: 'd' }),
        src_2_a: getKeyframeBone({ id: 'src_2_a', frame: 2, boneId: 'a' }),
        ove_1_a: getKeyframeBone({ id: 'ove_1_a', frame: 1, boneId: 'a' }),
        ove_2_b: getKeyframeBone({ id: 'ove_2_b', frame: 2, boneId: 'b' }),
        ove_1_c: getKeyframeBone({ id: 'ove_1_c', frame: 1, boneId: 'c' }),
        ove_3_c: getKeyframeBone({ id: 'ove_3_c', frame: 3, boneId: 'c' }),
      })
      expect(toMap(ret.dropped)).toEqual({
        src_1_a: getKeyframeBone({ id: 'src_1_a', frame: 1, boneId: 'a' }),
      })
    })
    it('override keyframes by the same id', () => {
      const ret = mergeKeyframesWithDropped(
        [
          getKeyframeBone({ id: 'src_a', frame: 1, boneId: 'a' }),
          getKeyframeBone({ id: 'src_b', frame: 1, boneId: 'b' }),
        ],
        [getKeyframeBone({ id: 'src_b', frame: 10, boneId: 'bb' })]
      )
      expect(toMap(ret.merged)).toEqual({
        src_a: getKeyframeBone({ id: 'src_a', frame: 1, boneId: 'a' }),
        src_b: getKeyframeBone({ id: 'src_b', frame: 10, boneId: 'bb' }),
      })
      expect(toMap(ret.dropped)).toEqual({
        src_b: getKeyframeBone({ id: 'src_b', frame: 1, boneId: 'b' }),
      })
    })
  })

  describe('cleanActions', () => {
    it('drop actions of unexisted armatures', () => {
      expect(
        cleanActions(
          [
            getAction({ id: 'act_1', armatureId: 'arm_1' }),
            getAction({ id: 'act_2', armatureId: 'arm_2' }),
          ],
          [getArmature({ id: 'arm_2' })]
        )
      ).toEqual([getAction({ id: 'act_2', armatureId: 'arm_2' })])
    })
    it('drop keyframes of unexisted bones', () => {
      expect(
        cleanActions(
          [
            getAction({
              id: 'act_1',
              armatureId: 'arm_1',
              keyframes: [
                getKeyframeBone({ id: 'key_1', boneId: 'bone_1', frame: 1 }),
                getKeyframeBone({ id: 'key_2', boneId: 'bone_2', frame: 1 }),
                getKeyframeBone({ id: 'key_2', boneId: 'bone_2', frame: 2 }),
                getKeyframeBone({ id: 'key_4', boneId: 'bone_4', frame: 1 }),
              ],
            }),
          ],
          [
            getArmature({
              id: 'arm_1',
              bones: [getBone({ id: 'bone_2' }), getBone({ id: 'bone_3' })],
            }),
          ]
        )
      ).toEqual([
        getAction({
          id: 'act_1',
          armatureId: 'arm_1',
          keyframes: [
            getKeyframeBone({ id: 'key_2', boneId: 'bone_2', frame: 1 }),
            getKeyframeBone({ id: 'key_2', boneId: 'bone_2', frame: 2 }),
          ],
        }),
      ])
    })
  })

  describe('findNextFrameWithKeyframe', () => {
    it('find next frame with some keyframes', () => {
      expect(
        findNextFrameWithKeyframe(
          [
            getKeyframeBone({ id: '1', frame: 0 }),
            getKeyframeBone({ id: '10', frame: 10 }),
            getKeyframeBone({ id: '20', frame: 20 }),
            getKeyframeBone({ id: '21', frame: 21 }),
          ],
          10
        )
      ).toBe(20)
    })
    it('return the same frame if any next frame is exists', () => {
      expect(
        findNextFrameWithKeyframe(
          [
            getKeyframeBone({ id: '1', frame: 0 }),
            getKeyframeBone({ id: '10', frame: 10 }),
            getKeyframeBone({ id: '20', frame: 20 }),
          ],
          30
        )
      ).toBe(30)
    })
  })

  describe('findPrevFrameWithKeyframe', () => {
    it('find prev frame with some keyframes', () => {
      expect(
        findPrevFrameWithKeyframe(
          [
            getKeyframeBone({ id: '1', frame: 0 }),
            getKeyframeBone({ id: '10', frame: 10 }),
            getKeyframeBone({ id: '20', frame: 20 }),
          ],
          15
        )
      ).toBe(10)
    })
    it('return the same frame if any prev frame is exists', () => {
      expect(
        findPrevFrameWithKeyframe(
          [
            getKeyframeBone({ id: '10', frame: 10 }),
            getKeyframeBone({ id: '20', frame: 20 }),
          ],
          5
        )
      ).toBe(5)
    })
  })

  describe('getSameRangeFrameMapByBoneId', () => {
    it('get same range frame map by bone id', () => {
      const t1 = getKeyframePoint({ value: 0 })
      const t2 = getKeyframePoint({ value: 45 })
      const res = getSameRangeFrameMapByBoneId({
        a: [
          getKeyframeBone({ frame: 0, rotate: t1 }),
          getKeyframeBone({ frame: 3, rotate: t1 }),
          getKeyframeBone({ frame: 5, rotate: t2 }),
          getKeyframeBone({ frame: 6, rotate: t1 }),
          getKeyframeBone({ frame: 7, rotate: t1 }),
        ],
        b: [getKeyframeBone({ frame: 0, rotate: t1 })],
        c: [],
      })
      expect(res.a).toEqual({
        0: 3,
        3: 0,
        5: 0,
        6: 1,
        7: 0,
      })
      expect(res.b).toEqual({
        0: 0,
      })
      expect(res.c).toEqual({})
    })
  })

  describe('getLastFrame', () => {
    it('get last frame', () => {
      expect(
        getLastFrame([
          getKeyframeBone({ frame: 6 }),
          getKeyframeBone({ frame: 10 }),
          getKeyframeBone({ frame: 3 }),
          getKeyframeBone({ frame: 4 }),
        ])
      ).toBe(10)
    })
  })
})
