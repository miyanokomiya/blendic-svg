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
import { useDefaultState } from '/@/composables/modeStates/appCanvas/weightMode/defaultState'
import { usePanningState } from '/@/composables/modeStates/commons'

export function usePickingBoneState(): WeightState {
  return state
}

const state: WeightState = {
  getLabel: () => 'PickingBone',
  onStart: async (ctx) => {
    ctx.setCommandExams([{ title: 'Pick a bone' }])
  },
  handleEvent: async (ctx, event) => {
    switch (event.type) {
      case 'pointerdown':
        switch (event.data.options.button) {
          case 0:
            switch (event.target.type) {
              case 'bone-body':
              case 'bone-head':
              case 'bone-tail':
                ctx.pickBone(event.target.id)
                return useDefaultState
              default:
                ctx.pickBone()
                return useDefaultState
            }
          case 1:
            return { getState: usePanningState, type: 'stack-resume' }
          default:
            return
        }
      case 'keydown':
        switch (event.data.key) {
          case 'Escape':
            ctx.pickBone()
            return useDefaultState
          default:
            return
        }
      case 'state':
        ctx.pickBone()
        return
      default:
        return
    }
  },
}
