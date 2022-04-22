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

import type { AnimationGraphState } from '/@/composables/modeStates/animationGraph/core'
import { useDefaultState } from '/@/composables/modeStates/animationGraph/defaultState'
import {
  getEditedNodeMap,
  getGridRoundedEditMovement,
} from '/@/composables/modeStates/animationGraph/utils'

export function useGrabbingNodeState(): AnimationGraphState {
  return {
    getLabel: () => 'GrabbingNodeState',
    shouldRequestPointerLock: true,
    onStart: async (ctx) => {
      ctx.startEditMovement()
    },
    handleEvent: async (ctx, event) => {
      switch (event.type) {
        case 'pointermove':
          ctx.setEditMovement(getGridRoundedEditMovement(event.data))
          return
        case 'pointerup': {
          if (event.data.options.button === 0) {
            const editMovement = ctx.getEditMovement()
            const nodeId = ctx.getLastSelectedNodeId()
            if (editMovement && nodeId) {
              ctx.updateNodes(
                getEditedNodeMap(ctx.getSelectedNodeMap(), nodeId, editMovement)
              )
            }
          }
          ctx.setEditMovement()
          return useDefaultState
        }
        case 'keydown':
          switch (event.data.key) {
            case 'Escape':
              ctx.setEditMovement()
              return useDefaultState
          }
          return
      }
    },
  }
}
