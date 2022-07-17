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

import { IVec2, sub } from 'okageo'
import { GraphState } from '/@/composables/modeStates/animationCanvas/graphMode/core'
import { useDefaultState } from '/@/composables/modeStates/animationCanvas/graphMode/defaultState'
import { CurveSelectedState } from '/@/models/keyframe'
import { moveCurveControlsMap } from '/@/utils/graphCurves'

type Options = {
  id: string
  key: string
  controls: CurveSelectedState
}

export function useMovingBezierState(options: Options): GraphState {
  let seriesKey = ''
  let prevPoint: IVec2

  return {
    getLabel: () => 'MovingBezier',
    onStart: async (ctx) => {
      seriesKey = ctx.generateSeriesKey()
      ctx.startDragging()
    },
    handleEvent: async (ctx, event) => {
      switch (event.type) {
        case 'pointerdrag': {
          const updatedMap = moveCurveControlsMap(
            ctx.getKeyframes(),
            { [options.id]: { [options.key]: options.controls } },
            ctx.toCurveControl(
              sub(event.data.current, prevPoint ?? event.data.start)
            )
          )
          ctx.updateKeyframes(updatedMap, seriesKey)
          prevPoint = event.data.current
          return
        }
        case 'pointerup': {
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
}
