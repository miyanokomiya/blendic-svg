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

import { getAction } from '/@/models'
import { getKeyframeBone, getKeyframePoint } from '/@/models/keyframe'
import * as indexStore from '/@/store'
import { createStore } from '/@/store/animation'
import { useHistoryStore } from '/@/store/history'

describe('src/store/animation.ts', () => {
  function prepare() {
    const historyStore = useHistoryStore()
    const store = indexStore.createStore(useHistoryStore())
    store.createDefaultEntities()
    store.selectAllBones()
    const target = createStore(historyStore, store)

    return { target, store }
  }

  describe('initState', () => {
    it('should init state', () => {
      const { target } = prepare()
      const action = getAction({
        id: 'ac',
        keyframes: ['k_0'],
      })
      const keyframe = getKeyframeBone({ id: 'k_0' })
      target.initState([action], [keyframe], [])
      expect(target.actions.value.map((a) => a.id)).toEqual(['ac'])
      expect(target.keyframes.value.map((k) => k.id)).toEqual([])
      target.selectAction('ac')
      expect(target.keyframes.value.map((k) => k.id)).toEqual(['k_0'])
    })
  })

  describe('selectAction', () => {
    it('should select an action and clear keyframes selecte state', () => {
      const { target } = prepare()
      target.addAction('ac_0')
      target.addAction('ac_1')
      target.execInsertKeyframe({ rotate: true })
      expect(target.selectedAction.value?.id).toBe('ac_1')
      expect(target.selectedKeyframeMap.value).not.toEqual({})
      target.selectAction('ac_0')
      expect(target.selectedAction.value?.id).toBe('ac_0')
      expect(target.selectedKeyframeMap.value).toEqual({})
    })
  })

  describe('addAction', () => {
    it('should add new action having a ref to current armature', () => {
      const { target, store } = prepare()
      target.addAction()
      expect(target.selectedAction.value?.armatureId).toBe(
        store.lastSelectedArmatureId.value
      )
      expect(target.actions.value).toHaveLength(1)
      target.addAction()
      expect(target.actions.value).toHaveLength(2)
    })
  })

  describe('deleteAction', () => {
    it('should delete an action and beloging keyframes', () => {
      const { target } = prepare()
      expect(target.actions.value).toHaveLength(0)
      target.addAction()
      target.execInsertKeyframe({ rotate: true })
      target.deleteAction()
      expect(target.exportState().actions).toHaveLength(0)
      expect(target.selectedAction.value).toBe(undefined)
      expect(target.exportState().keyframes).toHaveLength(0)
      expect(target.selectedKeyframeMap.value).toEqual({})
    })
  })

  describe('selectKeyframe', () => {
    it('should select an keyframe', () => {
      const { target } = prepare()
      target.addAction()
      target.execInsertKeyframe({ rotate: true, scaleX: true })
      const keyframe0 = target.keyframes.value[0]
      expect(target.selectedKeyframeMap.value).toEqual({
        [keyframe0.id]: { props: { rotate: true, scaleX: true } },
      })

      target.selectKeyframe(keyframe0.id, { props: { rotate: true } })
      expect(target.selectedKeyframeMap.value).toEqual({
        [keyframe0.id]: { props: { rotate: true } },
      })
      target.selectKeyframe(keyframe0.id, { props: { scaleY: true } }, true)
      expect(target.selectedKeyframeMap.value).toEqual({
        [keyframe0.id]: { props: { rotate: true, scaleY: true } },
      })
    })
  })

  describe('execInsertKeyframe', () => {
    it('should insert keyframes for selected bones and select the keyframes', () => {
      const { target, store } = prepare()
      target.addAction()

      target.execInsertKeyframe({ rotate: true, scaleX: true })
      const keyframe0 = target.keyframes.value[0]
      expect(keyframe0.targetId).toBe(store.lastSelectedBoneId.value)
      expect(target.selectedAction.value?.keyframes).toEqual([keyframe0.id])
      expect(target.selectedKeyframeMap.value).toEqual({
        [keyframe0.id]: { props: { rotate: true, scaleX: true } },
      })

      target.execInsertKeyframe({ scaleY: true })
      const keyframe1 = target.keyframes.value[0]
      expect(keyframe1.targetId).toBe(store.lastSelectedBoneId.value)
      expect(target.selectedAction.value?.keyframes).toEqual([keyframe1.id])
      expect(target.selectedKeyframeMap.value).toEqual({
        [keyframe1.id]: { props: { scaleY: true } },
      })
    })
  })

  describe('execDeleteKeyframes', () => {
    it('should delete keyframes', () => {
      const { target } = prepare()
      target.addAction()
      target.execInsertKeyframe({ rotate: true, scaleX: true })
      target.execDeleteKeyframes()
      expect(target.selectedAction.value?.keyframes).toHaveLength(0)
      expect(target.keyframes.value).toHaveLength(0)
      expect(target.selectedKeyframeMap.value).toEqual({})
    })
  })

  describe('execDeleteTargetKeyframe', () => {
    it('should delete the keyframe', () => {
      const { target } = prepare()
      target.addAction()
      target.execInsertKeyframe({ rotate: true, scaleX: true })
      expect(target.selectedAction.value?.keyframes).toHaveLength(1)
      expect(target.keyframes.value).toHaveLength(1)

      const keyframe = target.keyframes.value[0]
      target.execDeleteTargetKeyframe(keyframe.targetId, 'rotate')
      expect(target.keyframes.value[0].points).not.toHaveProperty('rotate')
      expect(target.keyframes.value[0].points).toHaveProperty('scaleX')
      expect(target.selectedAction.value?.keyframes).toHaveLength(1)
      expect(target.keyframes.value).toHaveLength(1)
    })
  })

  describe('upsertKeyframes', () => {
    it('should duplicate keyframes', () => {
      const { target } = prepare()
      target.addAction()
      target.execInsertKeyframe({ rotate: true, scaleX: true })
      expect(target.selectedAction.value?.keyframes).toHaveLength(1)
      expect(target.keyframes.value).toHaveLength(1)

      const keyframes = target.keyframes.value

      target.upsertKeyframes(
        [{ ...keyframes[0], id: 'dup' }],
        [{ ...keyframes[0], frame: 10 }]
      )
      expect(target.keyframes.value).toHaveLength(2)
      expect(target.selectedKeyframeMap.value).toEqual({
        [keyframes[0].id]: { props: { rotate: true, scaleX: true } },
      })
    })

    it('should merge duplicated keyframes having the same frame and a target', () => {
      const { target } = prepare()
      target.addAction()
      target.execInsertKeyframe({ rotate: true, scaleX: true })
      const keyframes = target.keyframes.value

      expect(target.selectedAction.value?.keyframes).toEqual([keyframes[0].id])
      expect(target.keyframes.value).toHaveLength(1)
      expect(target.selectedKeyframeMap.value).toEqual({
        [keyframes[0].id]: { props: { rotate: true, scaleX: true } },
      })

      target.upsertKeyframes(
        [
          getKeyframeBone({
            frame: 0,
            targetId: keyframes[0].targetId,
            id: 'dup',
            points: {
              scaleX: getKeyframePoint({ value: 1 }),
              scaleY: getKeyframePoint(),
            },
          }),
        ],
        keyframes
      )
      expect(target.keyframes.value).toEqual([
        getKeyframeBone({
          frame: 0,
          targetId: keyframes[0].targetId,
          id: 'dup',
          points: {
            scaleX: getKeyframePoint({ value: 1 }),
            scaleY: getKeyframePoint(),
            rotate: getKeyframePoint(),
          },
        }),
      ])
      expect(target.selectedKeyframeMap.value).toEqual({
        ['dup']: { props: { rotate: true, scaleX: true } },
      })
    })

    it('should update duplicated keyframes that have existed already', () => {
      const { target } = prepare()
      target.addAction()
      target.execInsertKeyframe({ rotate: true, scaleX: true })
      expect(target.selectedAction.value?.keyframes).toHaveLength(1)
      expect(target.keyframes.value).toHaveLength(1)

      const keyframes = target.keyframes.value

      target.upsertKeyframes(
        [
          getKeyframeBone({
            frame: 0,
            targetId: keyframes[0].targetId,
            id: 'dup',
            points: {
              scaleX: getKeyframePoint({ value: 1 }),
              scaleY: getKeyframePoint(),
            },
          }),
        ],
        [
          {
            ...keyframes[0],
            frame: 10,
            points: {
              rotate: getKeyframePoint({ value: 1 }),
            },
          },
        ]
      )
      expect(target.keyframes.value).toEqual([
        getKeyframeBone({
          frame: 10,
          targetId: keyframes[0].targetId,
          id: keyframes[0].id,
          points: {
            rotate: getKeyframePoint({ value: 1 }),
          },
        }),
        getKeyframeBone({
          frame: 0,
          targetId: keyframes[0].targetId,
          id: 'dup',
          points: {
            scaleX: getKeyframePoint({ value: 1 }),
            scaleY: getKeyframePoint(),
          },
        }),
      ])
      expect(target.selectedKeyframeMap.value).toEqual({
        [keyframes[0].id]: { props: { rotate: true } },
      })
    })
  })
})
