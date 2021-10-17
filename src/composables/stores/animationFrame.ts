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
import { useValueStore } from '/@/composables/stores/valueStore'
import { PlayState } from '/@/models'
import { KeyframeBase } from '/@/models/keyframe'
import {
  findNextFrameWithKeyframe,
  findPrevFrameWithKeyframe,
  getSteppedFrame,
} from '/@/utils/animations'
import * as okahistory from 'okahistory'

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
