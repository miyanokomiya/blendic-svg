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

import { getRadian } from 'okageo'
import { PoseState } from '/@/composables/modeStates/appCanvas/poseMode/core'
import { useDefaultState } from '/@/composables/modeStates/appCanvas/poseMode/defaultState'
import { getDefaultEditTransform } from '/@/composables/modeStates/appCanvas/poseMode/utils'
import { Bone } from '/@/models'
import { getPosedBoneHeadsOrigin } from '/@/utils/armatures'
import { mapReduce } from '/@/utils/commons'
import { getContinuousRadDiff, snapRotate } from '/@/utils/geometry'

export function useRotatingState(): PoseState {
  let currentRad = 0
  let currentTotalRad = 0

  return {
    getLabel: () => 'Rotating',
    shouldRequestPointerLock: true,
    onStart: async (ctx) => {
      ctx.setEditTransforms({}, 'rotate')
    },
    onEnd: async (ctx) => {
      ctx.setAxisGridInfo()
      ctx.setEditTransforms()
    },
    handleEvent: async (ctx, event) => {
      switch (event.type) {
        case 'pointermove': {
          const selectedBoneMap = ctx.getSelectedBones()
          const origin = getPosedBoneHeadsOrigin(selectedBoneMap)
          const rad =
            getRadian(event.data.current, origin) -
            getRadian(event.data.start, origin)

          const continuousRad =
            currentTotalRad + getContinuousRadDiff(currentRad, rad)
          const rotate = (continuousRad / Math.PI) * 180

          currentRad = rad
          currentTotalRad = continuousRad

          const snappedRotate = event.data.ctrl ? snapRotate(rotate) : rotate

          ctx.setEditTransforms(
            mapReduce(selectedBoneMap, (b) =>
              getDefaultEditTransform({
                rotate: snappedRotate * rotateDirection(b),
              })
            ),
            'rotate'
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
            default:
              return
          }
        default:
          return
      }
    },
  }
}

function rotateDirection(bone: Bone) {
  const scale = bone.transform.scale
  return Math.sign(scale.x * scale.y)
}
