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

import type { GraphState } from '/@/composables/modeStates/animationCanvas/graphMode/core'
import { useDefaultState } from '/@/composables/modeStates/animationCanvas/graphMode/defaultState'
import { getSelectedStateByRectangle } from '/@/utils/keyframes'

export function useRectangleSelectingState(): GraphState {
  return state
}

const state: GraphState = {
  getLabel: () => 'RectangleSelecting',
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
        if (rect) {
          const lt = ctx.toFrameValue(rect, true)
          const rb = ctx.toFrameValue(
            { x: rect.x + rect.width, y: rect.y + rect.height },
            true
          )
          ctx.selectKeyframes(
            getSelectedStateByRectangle(
              ctx.getKeyframes(),
              [lt.x, rb.x],
              [lt.y, rb.y]
            ),
            event.data.options.shift
          )
        }
        return useDefaultState
      }
      case 'keydown':
        switch (event.data.key) {
          case 'Escape':
            return useDefaultState
        }
        return
    }
  },
}
