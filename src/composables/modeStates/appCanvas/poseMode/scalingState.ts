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

import { getDistance, multi } from 'okageo'
import { PoseState } from '/@/composables/modeStates/appCanvas/poseMode/core'
import { useDefaultState } from '/@/composables/modeStates/appCanvas/poseMode/defaultState'
import {
  getDefaultEditTransform,
  handleToggleAxisGrid,
} from '/@/composables/modeStates/appCanvas/poseMode/utils'
import { getPosedBoneHeadsOrigin } from '/@/utils/armatures'
import { mapFilter, mapReduce } from '/@/utils/commons'
import { isOppositeSide, snapScale } from '/@/utils/geometry'

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
        const boneMap = ctx.getBones()
        const selectedBoneMap = ctx.getSelectedBones()
        const origin = getPosedBoneHeadsOrigin(selectedBoneMap)
        const opposite = isOppositeSide(
          origin,
          event.data.start,
          event.data.current
        )
        const scaleDiff = multi(
          multi({ x: 1, y: 1 }, opposite ? -1 : 1),
          getDistance(event.data.current, origin) /
            getDistance(event.data.start, origin) -
            1
        )
        const gridScale = event.data.ctrl ? snapScale(scaleDiff) : scaleDiff
        const snappedScale = ctx.snapScaleDiff(gridScale)

        const targetIds = mapFilter(
          selectedBoneMap,
          (_, id) => boneMap[id] && !boneMap[id].connected
        )
        const t = getDefaultEditTransform({ scale: snappedScale })
        ctx.setEditTransforms(
          mapReduce(targetIds, () => t),
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
            handleToggleAxisGrid(ctx, 'x')
            return
          }
          case 'y': {
            handleToggleAxisGrid(ctx, 'y')
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
