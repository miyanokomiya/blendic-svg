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

import { AnimationCanvasState } from '/@/composables/modeStates/animationCanvas/core'
import { usePanningState } from '/@/composables/modeStates/commons'
import { curveItems } from '/@/utils/keyframes/core'
import { batchUpdatePoints } from '/@/utils/keyframes'
import { extractMap } from '/@/utils/commons'
import { IVec2 } from 'okageo'

type Options = { point: IVec2 }

export function useChangingCurveTypeState(
  options: Options
): AnimationCanvasState {
  return {
    getLabel: () => 'ChangingCurveType',
    onStart: async (ctx) => {
      ctx.setPopupMenuList({
        items: curveItems.map((item) => ({
          label: item.label,
          key: item.name,
        })),
        point: options.point,
      })
    },
    onEnd: async (ctx) => {
      ctx.setPopupMenuList()
    },
    handleEvent: async (ctx, event) => {
      switch (event.type) {
        case 'pointerdown':
          switch (event.data.options.button) {
            case 1:
              return usePanningState
          }
          return { type: 'break' }
        case 'keydown':
          switch (event.data.key) {
            case 'Escape':
              return { type: 'break' }
          }
          return
        case 'popupmenu': {
          const selectedState = ctx.getSelectedKeyframes()
          ctx.updateKeyframes(
            batchUpdatePoints(
              extractMap(ctx.getKeyframes(), selectedState),
              selectedState,
              (p) => ({
                ...p,
                curve: { ...p.curve, name: event.data.key as any },
              })
            )
          )
          return { type: 'break' }
        }
      }
    },
  }
}
