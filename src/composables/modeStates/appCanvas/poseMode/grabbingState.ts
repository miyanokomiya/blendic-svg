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
import {
  PoseState,
  PoseStateContext,
} from '/@/composables/modeStates/appCanvas/poseMode/core'
import { useDefaultState } from '/@/composables/modeStates/appCanvas/poseMode/defaultState'
import { mapFilter, mapReduce } from '/@/utils/commons'
import { getGridSize, snapAxisGrid, snapPlainGrid } from '/@/utils/geometry'
import {
  convertToPosedSpace,
  getDefaultEditTransform,
  handleToggleAxisGrid,
} from '/@/composables/modeStates/appCanvas/poseMode/utils'

export function useGrabbingState(): PoseState {
  return state
}

const state: PoseState = {
  getLabel: () => 'Grabbing',
  shouldRequestPointerLock: true,
  onStart: async (ctx) => {
    ctx.setEditTransforms({}, 'grab')
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
        const translate = snapTranslate(
          ctx,
          event.data.ctrl ? getGridSize(event.data.scale) : 0,
          sub(event.data.current, event.data.start)
        )
        const boneMap = ctx.getBones()
        const selectedBoneMap = ctx.getSelectedBones()
        const targetIds = mapFilter(
          selectedBoneMap,
          (_, id) => boneMap[id] && !boneMap[id].connected
        )
        ctx.setEditTransforms(
          mapReduce(targetIds, (_, id) =>
            getDefaultEditTransform({
              translate: convertToPosedSpace(translate, boneMap, id),
            })
          ),
          'grab'
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

function snapTranslate(
  ctx: Pick<PoseStateContext, 'getAxisGridInfo'>,
  size: number,
  translate: IVec2
): IVec2 {
  const axisGridLine = ctx.getAxisGridInfo()
  if (!axisGridLine) return snapPlainGrid(size, 0, translate)
  return snapAxisGrid(size, axisGridLine.vec, translate)
}
