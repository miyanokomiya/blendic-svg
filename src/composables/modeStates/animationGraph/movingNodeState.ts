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

import { getDistance } from 'okageo'
import type { AnimationGraphState } from '/@/composables/modeStates/animationGraph/core'
import { useDefaultState } from '/@/composables/modeStates/animationGraph/defaultState'
import {
  getEditedNodeMap,
  getGridRoundedEditMovement,
} from '/@/composables/modeStates/animationGraph/utils'

export function useMovingNodeState(options: {
  nodeId: string
}): AnimationGraphState {
  let startedAt = 0

  return {
    getLabel: () => 'MovingNode',
    onStart: (ctx) => {
      ctx.startEditMovement()
      ctx.startDragging()
      startedAt = ctx.getTimestamp()
      return Promise.resolve()
    },
    handleEvent: async (ctx, event) => {
      switch (event.type) {
        case 'pointerdrag':
          if (ctx.getTimestamp() - startedAt > 100) {
            ctx.setEditMovement(getGridRoundedEditMovement(event.data))
          }
          return
        case 'pointerup': {
          if (event.data.options.button === 0) {
            const editMovement = ctx.getEditMovement()
            if (
              editMovement &&
              getDistance(editMovement.start, editMovement.current) > 0
            ) {
              ctx.updateNodes(
                getEditedNodeMap(
                  ctx.getSelectedNodeMap(),
                  options.nodeId,
                  editMovement
                )
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
