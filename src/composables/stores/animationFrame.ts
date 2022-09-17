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

import { ref, computed } from 'vue'
import { useValueStore } from '/@/composables/stores/valueStore'
import { PlayState } from '/@/models'
import { KeyframeBase } from '/@/models/keyframe'
import {
  findNextFrameWithKeyframe,
  findPrevFrameWithKeyframe,
  getSteppedFrame,
} from '/@/utils/animations'
import * as okahistory from 'okahistory'

export function useAnimationFrameStore(
  initialCurrentFrame = 0,
  initialEndFrame = 60
) {
  const currentFrame = useValueStore('Frame', () => initialCurrentFrame)
  const endFrame = useValueStore('End Frame', () => initialEndFrame)

  const playing = ref<PlayState>('pause')

  function restore(initialCurrentFrame = 0, initialEndFrame = 60) {
    currentFrame.restore(initialCurrentFrame)
    endFrame.restore(initialEndFrame)
  }

  function setPlaying(val: PlayState) {
    playing.value = val
  }

  function togglePlaying() {
    playing.value = playing.value === 'pause' ? 'play' : 'pause'
  }

  function createJumpStartFrameAction(): okahistory.Action<number> | undefined {
    return currentFrame.createUpdateAction(0)
  }

  function createJumpEndFrameAction(): okahistory.Action<number> | undefined {
    return currentFrame.createUpdateAction(endFrame.state.value)
  }

  function createStepFrameAction(
    tickFrame: number,
    reverse = false,
    seriesKey?: string
  ): okahistory.Action<number> | undefined {
    return currentFrame.createUpdateAction(
      getSteppedFrame(
        currentFrame.state.value,
        endFrame.state.value,
        tickFrame,
        reverse
      ),
      seriesKey
    )
  }

  function createJumpNextKeyAction(
    keyframes: KeyframeBase[]
  ): okahistory.Action<number> | undefined {
    return currentFrame.createUpdateAction(
      findNextFrameWithKeyframe(keyframes, currentFrame.state.value)
    )
  }

  function createJumpPrevKeyAction(
    keyframes: KeyframeBase[]
  ): okahistory.Action<number> | undefined {
    return currentFrame.createUpdateAction(
      findPrevFrameWithKeyframe(keyframes, currentFrame.state.value)
    )
  }

  return {
    currentFrame: currentFrame.state,
    endFrame: endFrame.state,

    restore,

    createUpdateCurrentFrameAction: currentFrame.createUpdateAction,
    createUpdateEndFrameAction: endFrame.createUpdateAction,

    playing: computed(() => playing.value),
    setPlaying,
    togglePlaying,

    createJumpStartFrameAction,
    createJumpEndFrameAction,
    createStepFrameAction,
    createJumpNextKeyAction,
    createJumpPrevKeyAction,

    reducers: {
      ...currentFrame.reducers,
      ...endFrame.reducers,
    },
  }
}
