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

import { useAnimationFrameStore } from '/@/composables/stores/animationFrame'
import { useHistoryStore } from '/@/composables/stores/history'
import { getKeyframeBone } from '/@/models/keyframe'

describe('src/composables/stores/animationFrame.ts', () => {
  describe('setPlaying', () => {
    it('should set playing state', () => {
      const store = useAnimationFrameStore()
      expect(store.playing.value).toBe('pause')
      store.setPlaying('play')
      expect(store.playing.value).toBe('play')
    })
  })

  describe('togglePlaying', () => {
    it('should toggle play <-> pause', () => {
      const store = useAnimationFrameStore()

      expect(store.playing.value).toBe('pause')
      store.togglePlaying()
      expect(store.playing.value).toBe('play')
      store.togglePlaying()
      expect(store.playing.value).toBe('pause')
    })
  })

  describe('createJumpStartFrameAction', () => {
    it('should jump 0', () => {
      const historyStore = useHistoryStore()
      const store = useAnimationFrameStore()
      historyStore.defineReducers(store.reducers)

      historyStore.dispatch(store.createUpdateCurrentFrameAction(10)!)
      expect(store.currentFrame.value).toBe(10)
      historyStore.dispatch(store.createJumpStartFrameAction()!)
      expect(store.currentFrame.value).toBe(0)
    })
  })

  describe('createJumpEndFrameAction', () => {
    it('should jump 0', () => {
      const historyStore = useHistoryStore()
      const store = useAnimationFrameStore()
      historyStore.defineReducers(store.reducers)

      historyStore.dispatch(store.createUpdateCurrentFrameAction(10)!)
      expect(store.currentFrame.value).toBe(10)
      historyStore.dispatch(store.createJumpEndFrameAction()!)
      expect(store.currentFrame.value).toBe(60)
    })
  })

  describe('createStepFrameAction', () => {
    it('should step frame', () => {
      const historyStore = useHistoryStore()
      const store = useAnimationFrameStore()
      historyStore.defineReducers(store.reducers)

      historyStore.dispatch(store.createStepFrameAction(1)!)
      historyStore.dispatch(store.createStepFrameAction(1)!)
      historyStore.dispatch(store.createStepFrameAction(1)!)
      expect(store.currentFrame.value).toBe(3)
    })
  })

  describe('createJumpNextKeyAction', () => {
    it('should jump next keyframe', () => {
      const historyStore = useHistoryStore()
      const store = useAnimationFrameStore()
      historyStore.defineReducers(store.reducers)

      historyStore.dispatch(store.createUpdateCurrentFrameAction(5)!)
      expect(store.currentFrame.value).toBe(5)

      historyStore.dispatch(
        store.createJumpNextKeyAction(
          [1, 2, 5, 9, 10].map((frame) => getKeyframeBone({ frame }))
        )!
      )
      expect(store.currentFrame.value).toBe(9)

      historyStore.undo()
      expect(store.currentFrame.value).toBe(5)

      historyStore.redo()
      expect(store.currentFrame.value).toBe(9)
    })

    it('should return undefined if next keyframe does not exist', () => {
      const historyStore = useHistoryStore()
      const store = useAnimationFrameStore()
      historyStore.defineReducers(store.reducers)

      historyStore.dispatch(store.createUpdateCurrentFrameAction(10)!)
      expect(
        store.createJumpNextKeyAction([getKeyframeBone({ frame: 10 })])
      ).toBe(undefined)
      historyStore.dispatch(store.createUpdateCurrentFrameAction(11)!)
      expect(
        store.createJumpNextKeyAction([getKeyframeBone({ frame: 10 })])
      ).toBe(undefined)
    })
  })

  describe('createJumpPrevKeyAction', () => {
    it('should jump prev keyframe', () => {
      const historyStore = useHistoryStore()
      const store = useAnimationFrameStore()
      historyStore.defineReducers(store.reducers)

      historyStore.dispatch(store.createUpdateCurrentFrameAction(5)!)

      historyStore.dispatch(
        store.createJumpPrevKeyAction(
          [1, 2, 5, 9, 10].map((frame) => getKeyframeBone({ frame }))
        )!
      )
      expect(store.currentFrame.value).toBe(2)

      historyStore.undo()
      expect(store.currentFrame.value).toBe(5)

      historyStore.redo()
      expect(store.currentFrame.value).toBe(2)
    })

    it('should return undefined if prev keyframe does not exist', () => {
      const historyStore = useHistoryStore()
      const store = useAnimationFrameStore()
      historyStore.defineReducers(store.reducers)

      historyStore.dispatch(store.createUpdateCurrentFrameAction(10)!)
      expect(
        store.createJumpPrevKeyAction([getKeyframeBone({ frame: 10 })])
      ).toBe(undefined)

      historyStore.dispatch(store.createUpdateCurrentFrameAction(9)!)
      expect(
        store.createJumpPrevKeyAction([getKeyframeBone({ frame: 10 })])
      ).toBe(undefined)
    })
  })
})
