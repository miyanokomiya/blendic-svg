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

import { getDistance, IVec2, multi } from 'okageo'
import {
  PoseState,
  PoseStateContext,
} from '/@/composables/modeStates/appCanvas/poseMode/core'
import { useDefaultState } from '/@/composables/modeStates/appCanvas/poseMode/defaultState'
import {
  getDefaultEditTransform,
  handleToggleAxisGridLocal,
} from '/@/composables/modeStates/appCanvas/poseMode/utils'
import { getPosedBoneHeadsOrigin } from '/@/utils/armatures'
import { mapReduce } from '/@/utils/commons'
import { snapScale } from '/@/utils/geometry'

export function useScalingState(): PoseState {
  return state
}

const state: PoseState = {
  getLabel: () => 'Scaling',
  shouldRequestPointerLock: true,
  onStart: async (ctx) => {
    ctx.setEditTransforms({}, 'scale')
    ctx.setCommandExams([
      { command: 'x', title: 'On Axis X' },
      { command: 'y', title: 'On Axis Y' },
    ])
  },
  onEnd: async (ctx) => {
    ctx.setAxisGridInfo()
    ctx.setEditTransforms()
    ctx.setCommandExams()
  },
  handleEvent: async (ctx, event) => {
    switch (event.type) {
      case 'pointermove': {
        const selectedBoneMap = ctx.getSelectedBones()
        const origin = getPosedBoneHeadsOrigin(selectedBoneMap)
        const scaleDiff = multi(
          { x: 1, y: 1 },
          getDistance(event.data.current, origin) /
            getDistance(event.data.start, origin) -
            1
        )
        const gridScale = event.data.ctrl ? snapScale(scaleDiff) : scaleDiff
        const snappedScale = snapScaleDiff(ctx, gridScale)

        const t = getDefaultEditTransform({ scale: snappedScale })
        ctx.setEditTransforms(
          mapReduce(selectedBoneMap, () => t),
          'scale'
        )
        return
      }
      case 'pointerup': {
        if (event.data.options.button === 0) {
          ctx.completeEditTransforms()
        }
        return useDefaultState
      }
      case 'keydown':
        switch (event.data.key) {
          case 'Escape':
            return useDefaultState
          case 'x': {
            handleToggleAxisGridLocal(ctx, 'x')
            return
          }
          case 'y': {
            handleToggleAxisGridLocal(ctx, 'y')
            return
          }
          default:
            return
        }
      default:
        return
    }
  },
}

function snapScaleDiff(
  ctx: Pick<PoseStateContext, 'getAxisGridInfo'>,
  scaleDiff: IVec2
): IVec2 {
  const axisGridLine = ctx.getAxisGridInfo()
  if (!axisGridLine) return scaleDiff
  return {
    x: axisGridLine.axis === 'y' ? 0 : scaleDiff.x,
    y: axisGridLine.axis === 'x' ? 0 : scaleDiff.y,
  }
}
