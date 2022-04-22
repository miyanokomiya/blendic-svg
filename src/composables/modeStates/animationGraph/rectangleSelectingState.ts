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
import { mapFilter, mapReduce } from '/@/utils/commons'
import { getIsRectHitRectFn } from '/@/utils/geometry'
import { getGraphNodeRect } from '/@/utils/helpers'

export function useRectangleSelectingState(): AnimationGraphState {
  return {
    getLabel: () => 'RectangleSelectingState',
    onStart: async (ctx) => {
      ctx.startDragging()
      ctx.setRectangleDragging(true)
    },
    onEnd: async (ctx) => {
      ctx.setRectangleDragging()
    },
    handleEvent: async (ctx, event) => {
      switch (event.type) {
        case 'pointerup': {
          const rect = ctx.getDraggedRectangle()
          console.log(rect)
          if (rect) {
            const checkFn = getIsRectHitRectFn(rect)
            ctx.selectNodes(
              mapReduce(
                mapFilter(ctx.getNodeMap(), (node) =>
                  checkFn(getGraphNodeRect(ctx.getGraphNodeModule, node))
                ),
                () => true
              ),
              event.data.options
            )
          }
          return useDefaultState
        }
        case 'keydown':
          switch (event.data.key) {
            case 'escape':
              return useDefaultState
          }
          return
      }
    },
  }
}
