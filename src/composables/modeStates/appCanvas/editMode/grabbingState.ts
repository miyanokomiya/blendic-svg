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
import { EditState } from '/@/composables/modeStates/appCanvas/editMode/core'
import { useDefaultState } from '/@/composables/modeStates/appCanvas/editMode/defaultState'
import { getTransform } from '/@/models'
import { getSelectedBonesOrigin } from '/@/utils/armatures'
import { getGridSize } from '/@/utils/geometry'

export function useGrabbingState(): EditState {
  return state
}

const state: EditState = {
  getLabel: () => 'Grabbing',
  shouldRequestPointerLock: true,
  onStart: async (ctx) => {
    ctx.startEditMovement()
  },
  onEnd: async (ctx) => {
    ctx.setAxisGridInfo()
  },
  handleEvent: async (ctx, event) => {
    switch (event.type) {
      case 'pointermove': {
        const translate = ctx.snapTranslate(
          event.data.ctrl ? getGridSize(event.data.scale) : 0,
          sub(event.data.current, event.data.start)
        )
        ctx.setEditTransform(getTransform({ translate }))
        return
      }
      case 'pointerup': {
        if (event.data.options.button === 0) {
          ctx.completeEditTransform()
        }
        ctx.setEditMovement()
        return useDefaultState
      }
      case 'keydown':
        switch (event.data.key) {
          case 'Escape':
            ctx.setEditMovement()
            return useDefaultState
          case 'x':
            if (ctx.getAxisGridInfo().axis === 'x') {
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
            if (ctx.getAxisGridInfo().axis === 'y') {
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
        }
        return
    }
  },
}
