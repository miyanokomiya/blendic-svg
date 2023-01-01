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

Copyright (C) 2022, Tomoya Komiyama.
*/

import { useGroupState } from '/@/composables/modeStates/core'
import { useDefaultState } from '/@/composables/modeStates/appCanvas/poseMode/defaultState'
import {
  AppCanvasEvent,
  AppCanvasGroupState,
  AppCanvasGroupStateContext,
} from '/@/composables/modeStates/appCanvas/core'
import { PoseStateContext } from '/@/composables/modeStates/appCanvas/poseMode/core'
import { useEditGroupState } from '/@/composables/modeStates/appCanvas/editGroupState'
import { useWeightGroupState } from '/@/composables/modeStates/appCanvas/weightGroupState'

export function usePoseGroupState(): AppCanvasGroupState {
  return useGroupState<
    AppCanvasGroupStateContext,
    PoseStateContext,
    AppCanvasEvent
  >(
    () => state,
    useDefaultState,
    (ctx) => ctx.getPoseContext()
  )
}

const state: AppCanvasGroupState = {
  getLabel: () => 'Pose',
  handleEvent: async (ctx, e) => {
    switch (e.type) {
      case 'state':
        switch (e.data.name) {
          case 'edit':
            return useEditGroupState
          case 'weight':
            return useWeightGroupState
          default:
            return
        }
      case 'keydown':
        switch (e.data.key) {
          case 'Tab':
            // Note: Ctrl + Tab cannot be controlled by JS
            ctx.toggleMode(e.data.shift)
            return
          default:
            return
        }
    }
  },
}
