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

import { IVec2 } from 'okageo'
import {
  EditState,
  EditStateContext,
} from '/@/composables/modeStates/appCanvas/editMode/core'
import { useDefaultState } from '/@/composables/modeStates/appCanvas/editMode/defaultState'
import { usePanningState } from '/@/composables/modeStates/commons'

type Options = { point: IVec2 }

export function useDeletingState(options: Options): EditState {
  return {
    getLabel: () => 'Deleting',
    onStart: async (ctx) => {
      setupPopupMenuList(ctx, options)
    },
    onEnd: async (ctx) => {
      ctx.setPopupMenuList()
    },
    handleEvent: async (ctx, event) => {
      switch (event.type) {
        case 'pointerdown':
          switch (event.data.options.button) {
            case 1:
              return usePanningState
            default:
              return useDefaultState
          }
        case 'keydown':
          switch (event.data.key) {
            case 'Escape':
              return useDefaultState
            default:
              return
          }
        case 'popupmenu':
          switch (event.data.key) {
            case 'delete':
              ctx.deleteBones()
              return useDefaultState
            case 'dissolve':
              ctx.dissolveBones()
              return useDefaultState
            default:
              return
          }
      }
    },
  }
}

function setupPopupMenuList(ctx: EditStateContext, options: Options) {
  ctx.setPopupMenuList({
    items: [
      { label: 'Dissolve', key: 'dissolve' },
      { label: 'Delete', key: 'delete' },
    ],
    point: options.point,
  })
}
