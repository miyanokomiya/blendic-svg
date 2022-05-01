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
import type { AnimationGraphState } from '/@/composables/modeStates/animationGraph/core'

export function useEdgeCutting(options: { point: IVec2 }): AnimationGraphState {
  return {
    ...state,
    onStart: async (ctx) => {
      ctx.setEdgeCutter({ from: options.point, to: options.point })
      ctx.startDragging()
    },
    onEnd: async (ctx) => {
      ctx.setEdgeCutter(undefined)
    },
  }
}

const state: AnimationGraphState = {
  getLabel: () => 'EdgeCutting',
  handleEvent: async (ctx, event) => {
    switch (event.type) {
      case 'pointerdrag': {
        const current = ctx.getEdgeCutter()
        if (current) {
          ctx.setEdgeCutter({ ...current, to: event.data.current })
          return
        } else {
          return { type: 'break' }
        }
      }
      case 'pointerup':
        return { type: 'break' }
    }
  },
}
