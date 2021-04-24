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

import { makeAccessors } from '/@/composables/commons'
import {
  getDeleteKeyframesItem,
  getDeleteTargetKeyframeItem,
  getInsertKeyframeItem,
  getUpdateKeyframeItem,
} from '/@/composables/stores/animation'
import { getTransform } from '/@/models'
import { getKeyframeBone, getKeyframePoint } from '/@/models/keyframe'

describe('src/utils/animation.ts', () => {
  describe('getInsertKeyframeItem', () => {
    it('should return history item to do', () => {
      const currentKeyframes = { value: [] }
      const editTransforms = { value: { a: getTransform() } }
      const item = getInsertKeyframeItem(
        makeAccessors(currentKeyframes),
        makeAccessors(editTransforms),
        [
          getKeyframeBone({
            id: 'key_a',
            targetId: 'a',
            points: {
              translateX: getKeyframePoint(),
            },
          }),
        ]
      )

      expect(currentKeyframes.value).toEqual([])
      expect(editTransforms.value).toEqual({ a: getTransform() })

      item.redo()
      expect(currentKeyframes.value).toEqual([
        getKeyframeBone({
          id: 'key_a',
          targetId: 'a',
          points: {
            translateX: getKeyframePoint(),
          },
        }),
      ])
      expect(editTransforms.value).toEqual({})

      item.undo()
      expect(currentKeyframes.value).toEqual([])
      expect(editTransforms.value).toEqual({ a: getTransform() })
    })

    it('should drop edit target transform props', () => {
      const currentKeyframes = { value: [] }
      const editTransforms = {
        value: {
          a: getTransform({
            translate: { x: 10, y: 0 },
          }),
          b: getTransform({
            translate: { x: 0, y: 10 },
          }),
        },
      }
      getInsertKeyframeItem(
        makeAccessors(currentKeyframes),
        makeAccessors(editTransforms),
        [
          getKeyframeBone({
            targetId: 'a',
            points: {
              translateX: getKeyframePoint(),
            },
          }),
        ]
      ).redo()

      expect(editTransforms.value).toEqual({
        b: getTransform({
          translate: { x: 0, y: 10 },
        }),
      })
    })
  })

  describe('getDeleteKeyframesItem', () => {
    it('should return history item to delete keyframe props', () => {
      const currentKeyframes = {
        value: [
          getKeyframeBone({
            id: 'a',
            points: {
              translateX: getKeyframePoint(),
              rotate: getKeyframePoint(),
            },
          }),
        ],
      }
      const item = getDeleteKeyframesItem(makeAccessors(currentKeyframes), {
        a: { props: { rotate: true } },
      })

      expect(currentKeyframes.value).toEqual([
        getKeyframeBone({
          id: 'a',
          points: {
            translateX: getKeyframePoint(),
            rotate: getKeyframePoint(),
          },
        }),
      ])

      item.redo()
      expect(currentKeyframes.value).toEqual([
        getKeyframeBone({
          id: 'a',
          points: { translateX: getKeyframePoint() },
        }),
      ])

      item.undo()
      expect(currentKeyframes.value).toEqual([
        getKeyframeBone({
          id: 'a',
          points: {
            translateX: getKeyframePoint(),
            rotate: getKeyframePoint(),
          },
        }),
      ])
    })
    it('should drop keyframes if its have no points', () => {
      const currentKeyframes = {
        value: [
          getKeyframeBone({
            id: 'a',
            points: {
              rotate: getKeyframePoint(),
            },
          }),
        ],
      }
      getDeleteKeyframesItem(makeAccessors(currentKeyframes), {
        a: { props: { rotate: true } },
      }).redo()

      expect(currentKeyframes.value).toEqual([])
    })
  })

  describe('getDeleteTargetKeyframeItem', () => {
    it('should return history item to delete target keyframe prop', () => {
      const props = {
        id: 'a',
        targetId: 'target',
        frame: 1,
      }
      const currentKeyframes = {
        value: [
          getKeyframeBone({
            ...props,
            points: {
              translateX: getKeyframePoint(),
              rotate: getKeyframePoint(),
            },
          }),
        ],
      }
      const item = getDeleteTargetKeyframeItem(
        makeAccessors(currentKeyframes),
        'target',
        1,
        'rotate'
      )!

      expect(currentKeyframes.value).toEqual([
        getKeyframeBone({
          ...props,
          points: {
            translateX: getKeyframePoint(),
            rotate: getKeyframePoint(),
          },
        }),
      ])

      item.redo()
      expect(currentKeyframes.value).toEqual([
        getKeyframeBone({
          ...props,
          points: { translateX: getKeyframePoint() },
        }),
      ])

      item.undo()
      expect(currentKeyframes.value).toEqual([
        getKeyframeBone({
          ...props,
          points: {
            translateX: getKeyframePoint(),
            rotate: getKeyframePoint(),
          },
        }),
      ])
    })
    it('should return identities of keyframes expect for the target', () => {
      const currentKeyframes = {
        value: [
          getKeyframeBone({
            id: 'a',
            targetId: 'target',
            frame: 1,
            points: {
              rotate: getKeyframePoint(),
            },
          }),
          getKeyframeBone({
            id: 'b',
            targetId: 'target_1',
            frame: 1,
            points: {
              rotate: getKeyframePoint(),
            },
          }),
          getKeyframeBone({
            id: 'c',
            targetId: 'target',
            frame: 2,
            points: {
              rotate: getKeyframePoint(),
            },
          }),
        ],
      }
      getDeleteTargetKeyframeItem(
        makeAccessors(currentKeyframes),
        'target',
        1,
        'rotate'
      )!.redo()

      expect(currentKeyframes.value).toEqual([
        getKeyframeBone({
          id: 'b',
          targetId: 'target_1',
          frame: 1,
          points: {
            rotate: getKeyframePoint(),
          },
        }),
        getKeyframeBone({
          id: 'c',
          targetId: 'target',
          frame: 2,
          points: {
            rotate: getKeyframePoint(),
          },
        }),
      ])
    })
    it('should return undefined if target does not exist', () => {
      const currentKeyframes = {
        value: [
          getKeyframeBone({
            id: 'a',
            targetId: 'target',
            frame: 1,
            points: {
              translateX: getKeyframePoint(),
              rotate: getKeyframePoint(),
            },
          }),
        ],
      }
      const item = getDeleteTargetKeyframeItem(
        makeAccessors(currentKeyframes),
        'unknown',
        1,
        'rotate'
      )
      expect(item).toBe(undefined)
    })
    it('should drop target keyframe if it has no points', () => {
      const currentKeyframes = {
        value: [
          getKeyframeBone({
            id: 'a',
            targetId: 'target',
            frame: 1,
            points: {
              rotate: getKeyframePoint(),
            },
          }),
        ],
      }
      getDeleteTargetKeyframeItem(
        makeAccessors(currentKeyframes),
        'target',
        1,
        'rotate'
      )!.redo()
      expect(currentKeyframes.value).toEqual([])
    })
  })

  describe('getUpdateKeyframeItem', () => {
    it('should return history item to update keyframes', () => {
      const currentKeyframes = {
        value: [
          getKeyframeBone({ id: 'a', frame: 1 }),
          getKeyframeBone({ id: 'b', frame: 5 }),
        ],
      }
      const item = getUpdateKeyframeItem(makeAccessors(currentKeyframes), {
        a: getKeyframeBone({ id: 'a', frame: 10 }),
      })

      expect(currentKeyframes.value).toEqual([
        getKeyframeBone({ id: 'a', frame: 1 }),
        getKeyframeBone({ id: 'b', frame: 5 }),
      ])

      item.redo()
      expect(currentKeyframes.value).toEqual([
        getKeyframeBone({ id: 'b', frame: 5 }),
        getKeyframeBone({ id: 'a', frame: 10 }),
      ])

      item.undo()
      expect(currentKeyframes.value).toEqual([
        getKeyframeBone({ id: 'a', frame: 1 }),
        getKeyframeBone({ id: 'b', frame: 5 }),
      ])
    })
  })
})
