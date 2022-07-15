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
  ObjectState,
  ObjectStateContext,
} from '/@/composables/modeStates/appCanvas/objectMode/core'
import { usePanningState } from '/@/composables/modeStates/commons'
import { PointerDownEvent } from '/@/composables/modeStates/core'

export function useDefaultState(): ObjectState {
  return state
}

const state: ObjectState = {
  getLabel: () => 'Default',
  onStart: async (ctx) => {
    updateCommandExams(ctx)
  },
  handleEvent: async (ctx, event) => {
    switch (event.type) {
      case 'pointerdown':
        switch (event.data.options.button) {
          case 0:
            switch (event.target.type) {
              case 'armature-body':
                return onDownArmature(ctx, event)
              default:
                return onDownEmpty(ctx)
            }
          case 1:
            return usePanningState
        }
        return
      case 'keydown':
        switch (event.data.key) {
          case 'A': {
            ctx.addArmature()
            return
          }
          case 'a':
            ctx.selectAllArmatures()
            return
          case 'x':
            if (Object.keys(ctx.getArmatures()).length > 1) {
              ctx.deleteArmatures()
            }
            return
          case '!':
          case 'Home': {
            ctx.setViewport()
            return
          }
          default:
            return
        }
      case 'selection':
        updateCommandExams(ctx)
        return
      default:
        return
    }
  },
}

function onDownEmpty(ctx: ObjectStateContext): void {
  ctx.selectArmature()
  updateCommandExams(ctx)
}

function onDownArmature(
  ctx: ObjectStateContext,
  event: PointerDownEvent
): void {
  const id = event.target.id
  if (id) {
    ctx.selectArmature(id)
    updateCommandExams(ctx)
  }
}

function updateCommandExams(ctx: ObjectStateContext) {
  if (ctx.getLastSelectedArmaturesId()) {
    ctx.setCommandExams([
      { command: 'a', title: 'All Select' },
      { command: 'A', title: 'Add Armature' },
      ...(Object.keys(ctx.getArmatures()).length > 1
        ? [{ command: 'x', title: 'Delete Armature' }]
        : []),
    ])
  } else {
    ctx.setCommandExams([{ command: 'A', title: 'Add Armature' }])
  }
}
