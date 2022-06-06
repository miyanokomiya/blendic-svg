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
  EditState,
  EditStateContext,
} from '/@/composables/modeStates/appCanvas/editMode/core'
import { usePanningState } from '/@/composables/modeStates/commons'
import { BoneSelectedState } from '/@/models'

export function useDefaultState(): EditState {
  return state
}

const state: EditState = {
  getLabel: () => 'Default',
  handleEvent: async (ctx, event) => {
    switch (event.type) {
      case 'pointerdown':
        switch (event.data.options.button) {
          case 0:
            switch (event.target.type) {
              case 'empty':
                ctx.selectBone()
                updateCommandExams(ctx)
                return
              case 'bone-body':
              case 'bone-head':
              case 'bone-tail':
                ctx.selectBone(
                  event.target.id,
                  getBoneSelectedState(event.target.type),
                  event.data.options
                )
                updateCommandExams(ctx)
                return
            }
            return
          case 1:
            return usePanningState
        }
        return
      case 'keydown':
        switch (event.data.key) {
          case 'a':
            ctx.selectAllBones()
            updateCommandExams(ctx)
            return
          case 'A':
            ctx.addBone()
            updateCommandExams(ctx)
            return
        }
    }
  },
}

function updateCommandExams(ctx: EditStateContext) {
  ctx.setCommandExams([])
}

function getBoneSelectedState(type: string): BoneSelectedState {
  switch (type) {
    case 'bone-head':
      return { head: true }
    case 'bone-tail':
      return { tail: true }
    default:
      return { head: true, tail: true }
  }
}
