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
  frameWidth,
  getAction,
  getArmature,
  getBone,
  getTransform,
  toMap,
} from '/@/models'
import {
  getKeyframeBone,
  getKeyframeConstraint,
  getKeyframePoint,
} from '/@/models/keyframe'
import {
  cleanActions,
  mergeKeyframesWithDropped,
  slideKeyframesTo,
  sortKeyframeMap,
  findNextFrameWithKeyframe,
  findPrevFrameWithKeyframe,
  getAfterKeyframe,
  getLastFrame,
  canvasToFrameValue,
  canvasToValue,
  canvasToNearestFrame,
  canvasToFrame,
  frameToCanvas,
  getSteppedFrame,
  pastePoseMap,
  getEditedConstraint,
  getEditedKeyframeConstraint,
} from '/@/utils/animations'
import { getConstraint } from '/@/utils/constraints'

describe('utils/animations.ts', () => {
  describe('canvasToNearestFrame', () => {
    it('get nearest frame(integer) from value in canvas space', () => {
      expect(canvasToNearestFrame(100 * frameWidth + 1)).toBe(100)
    })
  })

  describe('canvasToFrame', () => {
    it('convert a value from canvas space to frame space ', () => {
      expect(canvasToFrame(100 * frameWidth + 1)).toBe(100 + 1 / frameWidth)
    })
  })

  describe('frameToCanvas', () => {
    it('convert a value from frame space to canvas space ', () => {
      expect(frameToCanvas(100 + 1 / frameWidth)).toBe(100 * frameWidth + 1)
    })
  })

  describe('canvasToValue', () => {
    it('get value from value in canvas space', () => {
      expect(canvasToValue(100, 10)).toBe(10)
    })
  })

  describe('canvasToFrameValue', () => {
    it('get frame and value from point in canvas space', () => {
      expect(
        canvasToFrameValue({ x: 100 * frameWidth + 1, y: 200 }, 10)
      ).toEqual({
        x: 100,
        y: 20,
      })
    })
  })

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
    it('merge keyframes by the same frame and targetId', () => {
      const ret = mergeKeyframesWithDropped(
        [
          getKeyframeBone({ id: 'src_1_a', frame: 1, targetId: 'a' }),
          getKeyframeBone({ id: 'src_1_b', frame: 1, targetId: 'b' }),
          getKeyframeBone({ id: 'src_1_d', frame: 1, targetId: 'd' }),
          getKeyframeBone({ id: 'src_2_a', frame: 2, targetId: 'a' }),
        ],
        [
          getKeyframeBone({ id: 'ove_1_a', frame: 1, targetId: 'a' }),
          getKeyframeBone({ id: 'ove_2_b', frame: 2, targetId: 'b' }),
          getKeyframeBone({ id: 'ove_1_c', frame: 1, targetId: 'c' }),
          getKeyframeBone({ id: 'ove_3_c', frame: 3, targetId: 'c' }),
        ]
      )
      expect(toMap(ret.merged)).toEqual({
        src_1_b: getKeyframeBone({ id: 'src_1_b', frame: 1, targetId: 'b' }),
        src_1_d: getKeyframeBone({ id: 'src_1_d', frame: 1, targetId: 'd' }),
        src_2_a: getKeyframeBone({ id: 'src_2_a', frame: 2, targetId: 'a' }),
        ove_1_a: getKeyframeBone({ id: 'ove_1_a', frame: 1, targetId: 'a' }),
        ove_2_b: getKeyframeBone({ id: 'ove_2_b', frame: 2, targetId: 'b' }),
        ove_1_c: getKeyframeBone({ id: 'ove_1_c', frame: 1, targetId: 'c' }),
        ove_3_c: getKeyframeBone({ id: 'ove_3_c', frame: 3, targetId: 'c' }),
      })
      expect(toMap(ret.dropped)).toEqual({
        src_1_a: getKeyframeBone({ id: 'src_1_a', frame: 1, targetId: 'a' }),
      })
    })
    it('override keyframes by the same id', () => {
      const ret = mergeKeyframesWithDropped(
        [
          getKeyframeBone({ id: 'src_a', frame: 1, targetId: 'a' }),
          getKeyframeBone({ id: 'src_b', frame: 1, targetId: 'b' }),
        ],
        [getKeyframeBone({ id: 'src_b', frame: 10, targetId: 'bb' })]
      )
      expect(toMap(ret.merged)).toEqual({
        src_a: getKeyframeBone({ id: 'src_a', frame: 1, targetId: 'a' }),
        src_b: getKeyframeBone({ id: 'src_b', frame: 10, targetId: 'bb' }),
      })
      expect(toMap(ret.dropped)).toEqual({
        src_b: getKeyframeBone({ id: 'src_b', frame: 1, targetId: 'b' }),
      })
    })
    describe('mergeDeep: true', () => {
      it('merge props by the same frame and targetId', () => {
        const ret = mergeKeyframesWithDropped(
          [
            getKeyframeBone({
              id: 'src_1_a',
              frame: 1,
              targetId: 'a',
              points: {
                translateX: getKeyframePoint({ value: 1 }),
                translateY: getKeyframePoint({ value: 2 }),
              },
            }),
          ],
          [
            getKeyframeBone({
              id: 'ove_1_c',
              frame: 1,
              targetId: 'a',
              points: {
                translateX: getKeyframePoint({ value: 10 }),
                rotate: getKeyframePoint({ value: 20 }),
              },
            }),
          ],
          true
        )
        expect(toMap(ret.merged)).toEqual({
          ove_1_c: getKeyframeBone({
            id: 'ove_1_c',
            frame: 1,
            targetId: 'a',
            points: {
              translateX: getKeyframePoint({ value: 10 }),
              translateY: getKeyframePoint({ value: 2 }),
              rotate: getKeyframePoint({ value: 20 }),
            },
          }),
        })
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
                getKeyframeBone({ id: 'key_1', targetId: 'bone_1', frame: 1 }),
                getKeyframeBone({ id: 'key_2', targetId: 'bone_2', frame: 1 }),
                getKeyframeBone({ id: 'key_3', targetId: 'bone_2', frame: 2 }),
                getKeyframeBone({ id: 'key_4', targetId: 'bone_4', frame: 1 }),
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
            getKeyframeBone({ id: 'key_2', targetId: 'bone_2', frame: 1 }),
            getKeyframeBone({ id: 'key_3', targetId: 'bone_2', frame: 2 }),
          ],
        }),
      ])
    })
    it('drop keyframes of unexisted constraints', () => {
      const action = getAction({
        id: 'act_1',
        armatureId: 'arm_1',
        keyframes: [
          getKeyframeConstraint({ id: 'key_1', targetId: 'con_1', frame: 1 }),
          getKeyframeConstraint({ id: 'key_2', targetId: 'con_2', frame: 1 }),
          getKeyframeConstraint({ id: 'key_3', targetId: 'con_2', frame: 2 }),
          getKeyframeConstraint({ id: 'key_4', targetId: 'con_4', frame: 1 }),
        ],
      })
      expect(
        cleanActions(
          [action],
          [
            getArmature({
              id: 'arm_1',
              bones: [
                getBone({
                  id: 'bone',
                  constraints: [getConstraint({ type: 'IK', id: 'con_2' })],
                }),
              ],
            }),
          ]
        )
      ).toEqual([
        getAction({
          id: 'act_1',
          armatureId: 'arm_1',
          keyframes: [
            getKeyframeConstraint({ id: 'key_2', targetId: 'con_2', frame: 1 }),
            getKeyframeConstraint({ id: 'key_3', targetId: 'con_2', frame: 2 }),
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

  describe('getSteppedFrame', () => {
    it('step forward if reverse is false', () => {
      expect(getSteppedFrame(5, 10, 2)).toBe(7)
      expect(getSteppedFrame(8, 10, 2)).toBe(10)
      expect(getSteppedFrame(9, 10, 2)).toBe(1)
    })
    it('step backward if reverse is true', () => {
      expect(getSteppedFrame(5, 10, 2, true)).toBe(3)
      expect(getSteppedFrame(2, 10, 2, true)).toBe(0)
      expect(getSteppedFrame(1, 10, 2, true)).toBe(9)
    })
  })

  describe('pastePoseMap', () => {
    it('should override current pose', () => {
      const ret = pastePoseMap(
        {
          a: getTransform({ rotate: 10 }),
        },
        () => getTransform({ rotate: 100 })
      )
      expect(ret.a).toEqual(getTransform({ rotate: -90 }))
    })
    it('should drop items if those transform are not exist', () => {
      const ret = pastePoseMap(
        {
          a: getTransform({ rotate: 10 }),
        },
        () => undefined
      )
      expect(ret.a).toEqual(undefined)
    })
  })

  describe('getEditedConstraint', () => {
    it('should return identity if not edited', () => {
      expect(getEditedConstraint(getConstraint({ type: 'IK' }))).toEqual(
        getConstraint({ type: 'IK' })
      )
    })
    it('should return edited constraint', () => {
      const ret = getEditedConstraint(getConstraint({ type: 'IK' }), {
        influence: 0.2,
      })
      expect(ret.option.influence).toBe(0.2)
    })
  })

  describe('getEditedKeyframeConstraint', () => {
    it('should return identity if not edited', () => {
      expect(getEditedKeyframeConstraint(getKeyframeConstraint())).toEqual(
        getKeyframeConstraint()
      )
    })
    it('should return edited keyframe constraint', () => {
      const ret = getEditedKeyframeConstraint(
        getKeyframeConstraint({
          points: { influence: getKeyframePoint({ value: 0 }) },
        }),
        {
          influence: 0.2,
        }
      )
      expect(ret.points.influence?.value).toBe(0.2)
    })
  })
})
