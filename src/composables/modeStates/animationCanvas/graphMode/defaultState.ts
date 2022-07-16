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
  GraphState,
  GraphStateContext,
} from '/@/composables/modeStates/animationCanvas/graphMode/core'
import { usePanningState } from '/@/composables/modeStates/commons'
import { useMovingFrameState } from '/@/composables/modeStates/animationCanvas/movingFrameState'
import { useChangingCurveTypeState } from '/@/composables/modeStates/animationCanvas/changingCurveTypeState'
import { getAllSelectedState } from '/@/utils/keyframes'

export function useDefaultState(): GraphState {
  return state
}

const state: GraphState = {
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
              case 'keyframe-body': {
                const id = event.target.id
                ctx.selectKeyframe(
                  id,
                  getAllSelectedState(ctx.getKeyframes()[id]),
                  event.data.options.shift
                )
                return
              }
              case 'keyframe-prop': {
                const key = event.target.data!.key
                ctx.selectKeyframe(
                  event.target.id,
                  { props: { [key]: true } },
                  event.data.options.shift
                )
                return
              }
              case 'frame-control':
                return useMovingFrameState
              default:
                return ctx.selectKeyframe('')
            }
          case 1:
            return usePanningState
        }
        return
      case 'keydown':
        switch (event.data.key) {
          case 'a':
            ctx.selectAllKeyframes()
            return
          case 'x':
            if (ctx.getLastSelectedKeyframeId()) {
              ctx.deleteKeyframes()
            }
            return
          case 't':
            if (ctx.getLastSelectedKeyframeId()) {
              const point = event.point
              return point
                ? () => useChangingCurveTypeState({ point })
                : undefined
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

function updateCommandExams(ctx: GraphStateContext) {
  ctx.setCommandExams([
    { command: 'a', title: 'All Select' },
    ...(ctx.getLastSelectedKeyframeId()
      ? [
          { command: 'g', title: 'Grab' },
          { command: 't', title: 'Interpolation' },
          { command: 'x', title: 'Delete' },
          { command: 'x', title: 'Duplicate' },
        ]
      : []),
    { command: 'Space', title: 'Play/Stop' },
  ])
}
