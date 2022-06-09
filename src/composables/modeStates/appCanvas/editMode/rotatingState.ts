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
import { EditState } from '/@/composables/modeStates/appCanvas/editMode/core'
import { useDefaultState } from '/@/composables/modeStates/appCanvas/editMode/defaultState'
import { getTransform } from '/@/models'
import { getSelectedBonesOrigin } from '/@/utils/armatures'
import { snapRotate } from '/@/utils/geometry'

export function useRotatingState(): EditState {
  return state
}

const state: EditState = {
  getLabel: () => 'Rotating',
  shouldRequestPointerLock: true,
  onStart: async (ctx) => {
    ctx.setEditTransform(getTransform(), 'rotate')
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
        const rotate =
          ((getRadian(event.data.current, origin) -
            getRadian(event.data.start, origin)) /
            Math.PI) *
          180
        const snappedRotate = event.data.ctrl ? snapRotate(rotate) : rotate
        ctx.setEditTransform(
          getTransform({ rotate: snappedRotate, origin }),
          'rotate'
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
          default:
            return
        }
      default:
        return
    }
  },
}
