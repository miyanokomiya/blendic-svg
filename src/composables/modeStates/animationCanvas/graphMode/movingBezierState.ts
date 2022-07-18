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

import { sub } from 'okageo'
import { GraphState } from '/@/composables/modeStates/animationCanvas/graphMode/core'
import { useDefaultState } from '/@/composables/modeStates/animationCanvas/graphMode/defaultState'
import { CurveSelectedState } from '/@/models/keyframe'
import { mapReduce } from '/@/utils/commons'
import { getCtrlOrMetaStr } from '/@/utils/devices'
import { moveCurveControlsMap } from '/@/utils/graphCurves'

type Options = {
  id: string
  key: string
  controls: CurveSelectedState
}

export function useMovingBezierState(options: Options): GraphState {
  return {
    getLabel: () => 'MovingBezier',
    onStart: async (ctx) => {
      ctx.startDragging()
      ctx.setCommandExams([
        { command: 'Shift', title: 'Synchronize' },
        { command: getCtrlOrMetaStr(), title: 'Symmetrize' },
      ])
    },
    handleEvent: async (ctx, event) => {
      switch (event.type) {
        case 'pointerdrag': {
          const updatedMap = moveCurveControlsMap(
            ctx.getKeyframes(),
            event.data.shift
              ? mapReduce(ctx.getSelectedKeyframes(), ({ props }) =>
                  mapReduce(props, () => options.controls)
                )
              : { [options.id]: { [options.key]: options.controls } },
            ctx.toCurveControl(sub(event.data.current, event.data.start)),
            event.data.ctrl
          )
          ctx.setTmpKeyframes(updatedMap)
          return
        }
        case 'pointerup': {
          ctx.completeEdit()
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
