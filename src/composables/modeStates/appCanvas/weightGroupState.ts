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
import { useObjectGroupState } from '/@/composables/modeStates/appCanvas/objectGroupState'
import { useDefaultState } from '/@/composables/modeStates/appCanvas/weightMode/defaultState'
import {
  AppCanvasEvent,
  AppCanvasGroupState,
  AppCanvasGroupStateContext,
} from '/@/composables/modeStates/appCanvas/core'
import { WeightStateContext } from '/@/composables/modeStates/appCanvas/weightMode/core'
import { useEditGroupState } from '/@/composables/modeStates/appCanvas/editGroupState'
import { usePoseGroupState } from '/@/composables/modeStates/appCanvas/poseGroupState'

export function useWeightGroupState(): AppCanvasGroupState {
  return useGroupState<
    AppCanvasGroupStateContext,
    WeightStateContext,
    AppCanvasEvent
  >(
    () => state,
    useDefaultState,
    (ctx) => ctx.getWeightContext()
  )
}

const state: AppCanvasGroupState = {
  getLabel: () => 'Weight',
  handleEvent: async (ctx, e) => {
    switch (e.type) {
      case 'state':
        switch (e.data.name) {
          case 'object':
            return useObjectGroupState
          case 'edit':
            return useEditGroupState
          case 'pose':
            return usePoseGroupState
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
