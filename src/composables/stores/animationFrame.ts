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

import { ref } from '@vue/reactivity'
import { computed } from '@vue/runtime-core'
import { HistoryItem } from '/@/composables/stores/history'
import { useValueStore } from '/@/composables/stores/valueStore'
import { PlayState } from '/@/models'
import { KeyframeBase } from '/@/models/keyframe'
import {
  findNextFrameWithKeyframe,
  findPrevFrameWithKeyframe,
  getSteppedFrame,
} from '/@/utils/animations'

export function useAnimationFrameStore() {
  const currentFrame = useValueStore('Frame', () => 0)
  const endFrame = useValueStore('End Frame', () => 60)

  const playing = ref<PlayState>('pause')

  function setPlaying(val: PlayState) {
    playing.value = val
  }

  function togglePlaying() {
    playing.value = playing.value === 'pause' ? 'play' : 'pause'
  }

  function jumpStartFrame(): HistoryItem | undefined {
    return currentFrame.setState(0)
  }

  function jumpEndFrame(): HistoryItem | undefined {
    return currentFrame.setState(endFrame.state.value)
  }

  function stepFrame(
    tickFrame: number,
    reverse = false,
    seriesKey?: string
  ): HistoryItem | undefined {
    return currentFrame.setState(
      getSteppedFrame(
        currentFrame.state.value,
        endFrame.state.value,
        tickFrame,
        reverse
      ),
      seriesKey
    )
  }

  function jumpNextKey(keyframes: KeyframeBase[]): HistoryItem | undefined {
    return currentFrame.setState(
      findNextFrameWithKeyframe(keyframes, currentFrame.state.value)
    )
  }

  function jumpPrevKey(keyframes: KeyframeBase[]): HistoryItem | undefined {
    return currentFrame.setState(
      findPrevFrameWithKeyframe(keyframes, currentFrame.state.value)
    )
  }

  return {
    currentFrame: currentFrame.state,
    setCurrentFrame: currentFrame.setState,
    endFrame: endFrame.state,
    setEndFrame: endFrame.setState,

    playing: computed(() => playing.value),
    setPlaying,
    togglePlaying,

    jumpStartFrame,
    jumpEndFrame,
    stepFrame,
    jumpNextKey,
    jumpPrevKey,
  }
}
