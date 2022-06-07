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

import {
  PoseState,
  PoseStateContext,
} from '/@/composables/modeStates/appCanvas/poseMode/core'
import { usePanningState } from '/@/composables/modeStates/commons'

export function useDefaultState(): PoseState {
  return state
}

const state: PoseState = {
  getLabel: () => 'Default',
  onStart: async (ctx) => {
    onChangeSelection(ctx)
  },
  handleEvent: async (ctx, event) => {
    switch (event.type) {
      case 'pointerdown':
        switch (event.data.options.button) {
          case 0:
            switch (event.target.type) {
              case 'empty':
                ctx.selectBone()
                onChangeSelection(ctx)
                return
              case 'bone-body':
              case 'bone-head':
              case 'bone-tail':
                ctx.selectBone(
                  event.target.id,
                  { head: true, tail: true },
                  event.data.options
                )
                onChangeSelection(ctx)
                return
              default:
                return
            }
          case 1:
            return usePanningState
          default:
            return
        }
      case 'keydown':
        switch (event.data.key) {
          case 'a':
            ctx.selectAllBones()
            onChangeSelection(ctx)
            return
          case 'g':
            if (ctx.getLastSelectedBoneId()) {
              // return useGrabbingState
            }
            return
          case 'r':
            if (ctx.getLastSelectedBoneId()) {
              // return useRotatingState
            }
            return
          case 's':
            if (ctx.getLastSelectedBoneId()) {
              // return useScalingState
            }
            return
          default:
            return
        }
      default:
        return
    }
  },
}

function onChangeSelection(ctx: PoseStateContext) {
  ctx.setCommandExams([])
  ctx.setToolMenuGroups([])
}
