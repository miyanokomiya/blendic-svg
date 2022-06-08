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

import { IVec2 } from 'okageo'
import {
  PoseState,
  PoseStateContext,
} from '/@/composables/modeStates/appCanvas/poseMode/core'
import { useDefaultState } from '/@/composables/modeStates/appCanvas/poseMode/defaultState'
import { usePanningState } from '/@/composables/modeStates/commons'

type Options = { point: IVec2 }

export function useInsertingState(options: Options): PoseState {
  return {
    getLabel: () => 'Deleting',
    onStart: async (ctx) => {
      setupPopupMenuList(ctx, options)
    },
    onEnd: async (ctx) => {
      ctx.setPopupMenuList()
    },
    handleEvent: async (ctx, event) => {
      switch (event.type) {
        case 'pointerdown':
          switch (event.data.options.button) {
            case 1:
              return {
                getState: usePanningState,
                type: 'stack-resume',
              }
            default:
              return useDefaultState
          }
        case 'keydown':
          switch (event.data.key) {
            case 'Escape':
              return useDefaultState
            default:
              return
          }
        case 'popupmenu':
          switch (event.data.key) {
            case 'location':
              ctx.insertKeyframe({ translateX: true, translateY: true })
              return useDefaultState
            case 'rotation':
              ctx.insertKeyframe({ rotate: true })
              return useDefaultState
            case 'scale':
              ctx.insertKeyframe({ scaleX: true, scaleY: true })
              return useDefaultState
            case 'location-rotation':
              ctx.insertKeyframe({
                translateX: true,
                translateY: true,
                rotate: true,
              })
              return useDefaultState
            case 'location-scale':
              ctx.insertKeyframe({
                translateX: true,
                translateY: true,
                scaleX: true,
                scaleY: true,
              })
              break
            case 'rotation-scale':
              ctx.insertKeyframe({ rotate: true, scaleX: true, scaleY: true })
              return useDefaultState
            case 'all':
              ctx.insertKeyframe({
                translateX: true,
                translateY: true,
                rotate: true,
                scaleX: true,
                scaleY: true,
              })
              return useDefaultState
            default:
              return
          }
      }
    },
  }
}

function setupPopupMenuList(ctx: PoseStateContext, options: Options) {
  ctx.setPopupMenuList({
    items: [
      { label: 'Location', key: 'location' },
      { label: 'Rotation', key: 'rotation' },
      { label: 'Scale', key: 'scale' },
      { label: 'Location & Rotation', key: 'location-rotation' },
      { label: 'Location & Scale', key: 'location-scale' },
      { label: 'Rotation & Scale', key: 'rotation-scale' },
      { label: 'All Transforms', key: 'all' },
    ],
    point: options.point,
  })
}
