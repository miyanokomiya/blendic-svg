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

import { LabelState } from '/@/composables/modeStates/animationCanvas/labelMode/core'
import { usePanningState } from '/@/composables/modeStates/commons'

export function useDefaultState(): LabelState {
  return state
}

const state: LabelState = {
  getLabel: () => 'Default',
  handleEvent: async (ctx, event) => {
    switch (event.type) {
      case 'pointerdown':
        switch (event.data.options.button) {
          case 1:
            return usePanningState
        }
        return
      case 'keydown':
        switch (event.data.key) {
          case 'a':
            ctx.selectAllKeyframes()
            return
          case '!':
          case 'Home': {
            ctx.setViewport()
            return
          }
          default:
            return
        }
      default:
        return
    }
  },
}
