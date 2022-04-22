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
import { PopupMenuItem } from '/@/composables/modes/types'
import type { AnimationGraphState } from '/@/composables/modeStates/animationGraph/core'
import { useDefaultState } from '/@/composables/modeStates/animationGraph/defaultState'
import { usePanningState } from '/@/composables/modeStates/animationGraph/panningState'

export function useAddingNewNodeState(options: {
  point: IVec2
}): AnimationGraphState {
  return {
    getLabel: () => 'AddingNewNodeState',
    onStart: async (getCtx) => {
      const ctx = getCtx()
      const items: PopupMenuItem[] = ctx
        .getNodeItemList()
        .map(({ label, children }) => ({
          label,
          children: children.map(({ label, type }) => ({
            label,
            key: type as string,
          })),
        }))
      ctx.setPopupMenuList({ point: options.point, items })
    },
    onEnd: async (getCtx) => {
      getCtx().setPopupMenuList()
    },
    handleEvent: async (getCtx, event) => {
      const ctx = getCtx()

      switch (event.type) {
        case 'pointerdown':
          switch (event.data.options.button) {
            case 1:
              return {
                getState: usePanningState,
                type: 'stack-resume',
              }
          }
          return
        case 'pointerup':
          if (event.data.options.button !== 1) {
            return useDefaultState
          }
          break
        case 'keydown':
          switch (event.data.key) {
            case 'Escape':
              return useDefaultState
          }
          return
        case 'popupmenu': {
          const key = event.data.key
          ctx.addNode(key, { position: options.point })
          return useDefaultState
        }
      }
    },
  }
}
