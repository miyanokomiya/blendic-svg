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

  describe('jumpStartFrame', () => {
    it('should jump 0', () => {
      const store = useAnimationFrameStore()
      store.setCurrentFrame(10)!.redo()
      expect(store.currentFrame.value).toBe(10)
      store.jumpStartFrame()!.redo()
      expect(store.currentFrame.value).toBe(0)
    })
  })

  describe('jumpEndFrame', () => {
    it('should jump 0', () => {
      const store = useAnimationFrameStore()
      store.setCurrentFrame(10)!.redo()
      expect(store.currentFrame.value).toBe(10)
      store.jumpEndFrame()!.redo()
      expect(store.currentFrame.value).toBe(60)
    })
  })

  describe('stepFrame', () => {
    it('should step frame', () => {
      const store = useAnimationFrameStore()
      store.stepFrame(1)!.redo()
      store.stepFrame(1)!.redo()
      store.stepFrame(1)!.redo()
      expect(store.currentFrame.value).toBe(3)
    })
  })

  describe('jumpNextKey', () => {
    it('should jump next keyframe', () => {
      const store = useAnimationFrameStore()
      store.setCurrentFrame(5)?.redo()
      const item = store.jumpNextKey(
        [1, 2, 5, 9, 10].map((frame) => getKeyframeBone({ frame }))
      )!

      expect(store.currentFrame.value).toBe(5)
      item.redo()
      expect(store.currentFrame.value).toBe(9)
      item.undo()
      expect(store.currentFrame.value).toBe(5)
    })

    it('should return undefined if next keyframe does not exist', () => {
      const store = useAnimationFrameStore()
      store.setCurrentFrame(10)?.redo()
      expect(store.jumpNextKey([getKeyframeBone({ frame: 10 })])).toBe(
        undefined
      )
      store.setCurrentFrame(11)?.redo()
      expect(store.jumpNextKey([getKeyframeBone({ frame: 10 })])).toBe(
        undefined
      )
    })
  })

  describe('jumpPrevKey', () => {
    it('should jump prev keyframe', () => {
      const store = useAnimationFrameStore()
      store.setCurrentFrame(5)?.redo()
      const item = store.jumpPrevKey(
        [1, 2, 5, 9, 10].map((frame) => getKeyframeBone({ frame }))
      )!

      expect(store.currentFrame.value).toBe(5)
      item.redo()
      expect(store.currentFrame.value).toBe(2)
      item.undo()
      expect(store.currentFrame.value).toBe(5)
    })

    it('should return undefined if prev keyframe does not exist', () => {
      const store = useAnimationFrameStore()
      store.setCurrentFrame(10)?.redo()
      expect(store.jumpPrevKey([getKeyframeBone({ frame: 10 })])).toBe(
        undefined
      )
      store.setCurrentFrame(9)?.redo()
      expect(store.jumpPrevKey([getKeyframeBone({ frame: 10 })])).toBe(
        undefined
      )
    })
  })
})
