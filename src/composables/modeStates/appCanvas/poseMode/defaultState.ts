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
import { useGrabbingState } from '/@/composables/modeStates/appCanvas/poseMode/grabbingState'
import { useInsertingState } from '/@/composables/modeStates/appCanvas/poseMode/insertingState'
import { useRotatingState } from '/@/composables/modeStates/appCanvas/poseMode/rotatingState'
import { useScalingState } from '/@/composables/modeStates/appCanvas/poseMode/scalingState'
import { usePanningState } from '/@/composables/modeStates/commons'
import { getCtrlOrMetaStr } from '/@/utils/devices'

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
                  event.data.options,
                  true
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
              return useGrabbingState
            }
            return
          case 'r':
            if (ctx.getLastSelectedBoneId()) {
              return useRotatingState
            }
            return
          case 's':
            if (ctx.getLastSelectedBoneId()) {
              return useScalingState
            }
            return
          case 'i': {
            const point = event.point
            if (ctx.getLastSelectedBoneId() && point) {
              return () => useInsertingState({ point })
            }
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

function onChangeSelection(ctx: PoseStateContext) {
  if (ctx.getLastSelectedBoneId()) {
    ctx.setCommandExams([
      { command: 'i', title: 'Insert Keyframe' },
      { command: 'g', title: 'Grab' },
      { command: 'r', title: 'Rotate' },
      { command: 's', title: 'Scale' },
      { command: 'a', title: 'All Select' },
      { command: `${getCtrlOrMetaStr()} + c`, title: 'Clip' },
      { command: `${getCtrlOrMetaStr()} + v`, title: 'Paste' },
    ])
  } else {
    ctx.setCommandExams([
      { command: 'a', title: 'All Select' },
      { command: `${getCtrlOrMetaStr()} + v`, title: 'Paste' },
    ])
  }

  ctx.setToolMenuGroups([])
}
