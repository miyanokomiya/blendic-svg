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
  getAction,
  getArmature,
  getBone,
  getKeyframe,
  getTransform,
  toMap,
} from '/@/models'
import {
  cleanActions,
  getNeighborKeyframes,
  interpolateKeyframeTransform,
  mergeKeyframesWithDropped,
  slideKeyframesTo,
  sortKeyframeMap,
  findNextFrameWithKeyframe,
  findPrevFrameWithKeyframe,
} from '/@/utils/animations'

describe('utils/animations.ts', () => {
  describe('sortKeyframeMap', () => {
    it('get sorted keyframes map', () => {
      expect(
        sortKeyframeMap({
          a: [
            getKeyframe({ frame: 2 }),
            getKeyframe({ frame: 3 }),
            getKeyframe({ frame: 1 }),
          ],
        })
      ).toEqual({
        a: [
          getKeyframe({ frame: 1 }),
          getKeyframe({ frame: 2 }),
          getKeyframe({ frame: 3 }),
        ],
      })
    })
  })

  describe('getNeighborKeyframes', () => {
    it('get empty if list is empty', () => {
      expect(getNeighborKeyframes([], 3)).toEqual([])
    })
    it('get the keyframe if it has the frame', () => {
      expect(
        getNeighborKeyframes(
          [
            getKeyframe({ frame: 1 }),
            getKeyframe({ frame: 3 }),
            getKeyframe({ frame: 4 }),
          ],
          3
        )
      ).toEqual([getKeyframe({ frame: 3 })])
    })
    it('get the first keyframe if no one is smaller', () => {
      expect(
        getNeighborKeyframes(
          [
            getKeyframe({ frame: 4 }),
            getKeyframe({ frame: 5 }),
            getKeyframe({ frame: 6 }),
          ],
          3
        )
      ).toEqual([getKeyframe({ frame: 4 })])
    })
    it('get the last keyframe if no one is bigger', () => {
      expect(
        getNeighborKeyframes(
          [
            getKeyframe({ frame: 0 }),
            getKeyframe({ frame: 1 }),
            getKeyframe({ frame: 2 }),
          ],
          3
        )
      ).toEqual([getKeyframe({ frame: 2 })])
    })
    it('get the neighbor keyframes if they are exist', () => {
      expect(
        getNeighborKeyframes(
          [
            getKeyframe({ frame: 0 }),
            getKeyframe({ frame: 1 }),
            getKeyframe({ frame: 2 }),
            getKeyframe({ frame: 4 }),
          ],
          3
        )
      ).toEqual([getKeyframe({ frame: 2 }), getKeyframe({ frame: 4 })])
    })
  })

  describe('interpolateKeyframeTransform', () => {
    it('get unit transform if no keyframe exists', () => {
      const ret = interpolateKeyframeTransform([], 1)
      expect(ret).toEqual(getTransform())
    })
    it('get the same transform if one keyframe exists', () => {
      const ret = interpolateKeyframeTransform(
        [
          getKeyframe({
            transform: getTransform({ rotate: 20 }),
          }),
        ],
        1
      )
      expect(ret).toEqual(getTransform({ rotate: 20 }))
    })
    it('get interpolated transform if two keyframe exist', () => {
      const ret = interpolateKeyframeTransform(
        [
          getKeyframe({
            frame: 10,
            transform: getTransform({ rotate: 20 }),
          }),
          getKeyframe({
            frame: 20,
            transform: getTransform({ rotate: 30 }),
          }),
        ],
        12
      )
      expect(ret.rotate).toBeCloseTo(22)
    })
    it('custom curve func', () => {
      const ret = interpolateKeyframeTransform(
        [
          getKeyframe({
            frame: 10,
            transform: getTransform({ rotate: 20 }),
          }),
          getKeyframe({
            frame: 20,
            transform: getTransform({ rotate: 30 }),
          }),
        ],
        12,
        (x: number) => Math.pow(x, 2)
      )
      expect(ret.rotate).toBeCloseTo(20.4)
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
            getKeyframe({ id: '1', frame: 1 }),
            getKeyframe({ id: '2', frame: 2 }),
            getKeyframe({ id: '4', frame: 4 }),
          ],
          10
        )
      ).toEqual([
        getKeyframe({ id: '1', frame: 10 }),
        getKeyframe({ id: '2', frame: 11 }),
        getKeyframe({ id: '4', frame: 13 }),
      ])
    })
  })

  describe('mergeKeyframesWithDropped', () => {
    it('merge keyframes by the same frame and boneId', () => {
      const ret = mergeKeyframesWithDropped(
        [
          getKeyframe({ id: 'src_1_a', frame: 1, boneId: 'a' }),
          getKeyframe({ id: 'src_1_b', frame: 1, boneId: 'b' }),
          getKeyframe({ id: 'src_1_d', frame: 1, boneId: 'd' }),
          getKeyframe({ id: 'src_2_a', frame: 2, boneId: 'a' }),
        ],
        [
          getKeyframe({ id: 'ove_1_a', frame: 1, boneId: 'a' }),
          getKeyframe({ id: 'ove_2_b', frame: 2, boneId: 'b' }),
          getKeyframe({ id: 'ove_1_c', frame: 1, boneId: 'c' }),
          getKeyframe({ id: 'ove_3_c', frame: 3, boneId: 'c' }),
        ]
      )
      expect(toMap(ret.merged)).toEqual({
        src_1_b: getKeyframe({ id: 'src_1_b', frame: 1, boneId: 'b' }),
        src_1_d: getKeyframe({ id: 'src_1_d', frame: 1, boneId: 'd' }),
        src_2_a: getKeyframe({ id: 'src_2_a', frame: 2, boneId: 'a' }),
        ove_1_a: getKeyframe({ id: 'ove_1_a', frame: 1, boneId: 'a' }),
        ove_2_b: getKeyframe({ id: 'ove_2_b', frame: 2, boneId: 'b' }),
        ove_1_c: getKeyframe({ id: 'ove_1_c', frame: 1, boneId: 'c' }),
        ove_3_c: getKeyframe({ id: 'ove_3_c', frame: 3, boneId: 'c' }),
      })
      expect(toMap(ret.dropped)).toEqual({
        src_1_a: getKeyframe({ id: 'src_1_a', frame: 1, boneId: 'a' }),
      })
    })
    it('override keyframes by the same id', () => {
      const ret = mergeKeyframesWithDropped(
        [
          getKeyframe({ id: 'src_a', frame: 1, boneId: 'a' }),
          getKeyframe({ id: 'src_b', frame: 1, boneId: 'b' }),
        ],
        [getKeyframe({ id: 'src_b', frame: 10, boneId: 'bb' })]
      )
      expect(toMap(ret.merged)).toEqual({
        src_a: getKeyframe({ id: 'src_a', frame: 1, boneId: 'a' }),
        src_b: getKeyframe({ id: 'src_b', frame: 10, boneId: 'bb' }),
      })
      expect(toMap(ret.dropped)).toEqual({
        src_b: getKeyframe({ id: 'src_b', frame: 1, boneId: 'b' }),
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
                getKeyframe({ id: 'key_1', boneId: 'bone_1', frame: 1 }),
                getKeyframe({ id: 'key_2', boneId: 'bone_2', frame: 1 }),
                getKeyframe({ id: 'key_2', boneId: 'bone_2', frame: 2 }),
                getKeyframe({ id: 'key_4', boneId: 'bone_4', frame: 1 }),
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
            getKeyframe({ id: 'key_2', boneId: 'bone_2', frame: 1 }),
            getKeyframe({ id: 'key_2', boneId: 'bone_2', frame: 2 }),
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
            getKeyframe({ id: '1', frame: 0 }),
            getKeyframe({ id: '10', frame: 10 }),
            getKeyframe({ id: '20', frame: 20 }),
            getKeyframe({ id: '21', frame: 21 }),
          ],
          10
        )
      ).toBe(20)
    })
    it('return the same frame if any next frame is exists', () => {
      expect(
        findNextFrameWithKeyframe(
          [
            getKeyframe({ id: '1', frame: 0 }),
            getKeyframe({ id: '10', frame: 10 }),
            getKeyframe({ id: '20', frame: 20 }),
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
            getKeyframe({ id: '1', frame: 0 }),
            getKeyframe({ id: '10', frame: 10 }),
            getKeyframe({ id: '20', frame: 20 }),
          ],
          15
        )
      ).toBe(10)
    })
    it('return the same frame if any prev frame is exists', () => {
      expect(
        findPrevFrameWithKeyframe(
          [
            getKeyframe({ id: '10', frame: 10 }),
            getKeyframe({ id: '20', frame: 20 }),
          ],
          5
        )
      ).toBe(5)
    })
  })
})
