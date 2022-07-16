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
import {
  AnimationCanvasEvent,
  AnimationCanvasGroupState,
  AnimationCanvasGroupStateContext,
} from '/@/composables/modeStates/animationCanvas/core'
import { useDefaultState } from '/@/composables/modeStates/animationCanvas/actionMode/defaultState'
import { GraphStateContext } from '/@/composables/modeStates/animationCanvas/graphMode/core'
import { useActionGroupState } from '/@/composables/modeStates/animationCanvas/actionGroupState'

export function useGraphGroupState(): AnimationCanvasGroupState {
  return useGroupState<
    AnimationCanvasGroupStateContext,
    GraphStateContext,
    AnimationCanvasEvent
  >(
    () => state,
    useDefaultState,
    (ctx) => ctx.getGraphContext()
  )
}

const state: AnimationCanvasGroupState = {
  getLabel: () => 'Graph',
  handleEvent: async (ctx, e) => {
    switch (e.type) {
      case 'state':
        switch (e.data.name) {
          case 'action':
            return useActionGroupState
          default:
            return
        }
      case 'keydown':
        switch (e.data.key) {
          case 'Tab':
            ctx.toggleMode()
            return
          default:
            return
        }
    }
  },
}
