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

import { AnimationCanvasState } from '/@/composables/modeStates/animationCanvas/core'
import { canvasToNearestFrame } from '/@/utils/animations'

export function useMovingFrameState(): AnimationCanvasState {
  let seriesKey = ''

  return {
    getLabel: () => 'MovingFrame',
    onStart: async (ctx) => {
      ctx.startDragging()
      seriesKey = ctx.generateSeriesKey()
    },
    handleEvent: async (ctx, event) => {
      switch (event.type) {
        case 'pointerdrag':
          ctx.setCurrentFrame(
            canvasToNearestFrame(event.data.current.x),
            seriesKey
          )
          return
        case 'pointerup': {
          ctx.setCurrentFrame(
            canvasToNearestFrame(event.data.point.x),
            seriesKey
          )
          return { type: 'break' }
        }
        case 'keydown':
          switch (event.data.key) {
            case 'Escape':
              return { type: 'break' }
          }
          return
      }
    },
  }
}
