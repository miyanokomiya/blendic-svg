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
  EditState,
  EditStateContext,
} from '/@/composables/modeStates/appCanvas/editMode/core'
import { useDefaultState } from '/@/composables/modeStates/appCanvas/editMode/defaultState'
import { getTransform } from '/@/models'
import { getSelectedBonesOrigin } from '/@/utils/armatures'
import { isOppositeSide, snapScale } from '/@/utils/geometry'

export function useScalingState(): EditState {
  return state
}

const state: EditState = {
  getLabel: () => 'Scaling',
  shouldRequestPointerLock: true,
  onStart: async (ctx) => {
    ctx.setEditTransform(getTransform(), 'scale')
  },
  onEnd: async (ctx) => {
    ctx.setAxisGridInfo()
    ctx.setEditTransform()
  },
  handleEvent: async (ctx, event) => {
    switch (event.type) {
      case 'pointermove': {
        const origin = getSelectedBonesOrigin(
          ctx.getBones(),
          ctx.getSelectedBones()
        )
        const opposite = isOppositeSide(
          origin,
          event.data.start,
          event.data.current
        )
        const scale = multi(
          multi({ x: 1, y: 1 }, opposite ? -1 : 1),
          getDistance(event.data.current, origin) /
            getDistance(event.data.start, origin)
        )
        const gridScale = event.data.ctrl ? snapScale(scale) : scale
        const snappedScale = snapScaleDiff(ctx, gridScale)
        ctx.setEditTransform(
          getTransform({ scale: snappedScale, origin }),
          'scale'
        )
        return
      }
      case 'pointerup': {
        if (event.data.options.button === 0) {
          ctx.completeEditTransform()
        }
        return useDefaultState
      }
      case 'keydown':
        switch (event.data.key) {
          case 'Escape':
            return useDefaultState
          case 'x':
            if (ctx.getAxisGridInfo()?.axis === 'x') {
              ctx.setAxisGridInfo()
            } else {
              ctx.setAxisGridInfo({
                axis: 'x',
                local: false,
                vec: { x: 1, y: 0 },
                origin: getSelectedBonesOrigin(
                  ctx.getBones(),
                  ctx.getSelectedBones()
                ),
              })
            }
            return
          case 'y':
            if (ctx.getAxisGridInfo()?.axis === 'y') {
              ctx.setAxisGridInfo()
            } else {
              ctx.setAxisGridInfo({
                axis: 'y',
                local: false,
                vec: { x: 0, y: 1 },
                origin: getSelectedBonesOrigin(
                  ctx.getBones(),
                  ctx.getSelectedBones()
                ),
              })
            }
            return
          default:
            return
        }
      default:
        return
    }
  },
}

function snapScaleDiff(
  ctx: Pick<EditStateContext, 'getAxisGridInfo'>,
  scaleDiff: IVec2
): IVec2 {
  const axisGridLine = ctx.getAxisGridInfo()
  if (!axisGridLine) return scaleDiff
  return {
    x: axisGridLine.axis === 'y' ? 1 : scaleDiff.x,
    y: axisGridLine.axis === 'x' ? 1 : scaleDiff.y,
  }
}
