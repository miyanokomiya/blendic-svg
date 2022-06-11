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

import { WeightState } from '/@/composables/modeStates/appCanvas/weightMode/core'
import { usePickingBoneState } from '/@/composables/modeStates/appCanvas/pickingBoneState'
import { usePanningState } from '/@/composables/modeStates/commons'

export function useDefaultState(): WeightState {
  return state
}

const state: WeightState = {
  getLabel: () => 'Default',
  onStart: async (ctx) => {
    ctx.setCommandExams()
  },
  handleEvent: async (ctx, event) => {
    switch (event.type) {
      case 'pointerdown':
        switch (event.data.options.button) {
          case 0:
            switch (event.target.type) {
              case 'empty':
                ctx.selectElement()
                return
              case 'element':
                ctx.selectElement(event.target.id, event.data.options)
                return
              default:
                return
            }
          case 1:
            return usePanningState
          default:
            return
        }
      case 'state':
        switch (event.data.name) {
          case 'pick-bone':
            return () => usePickingBoneState(event.data.options as any)
          default:
            return
        }
      default:
        return
    }
  },
}
