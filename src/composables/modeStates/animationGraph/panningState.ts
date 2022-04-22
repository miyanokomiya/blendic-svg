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

import type { AnimationGraphState } from '/@/composables/modeStates/animationGraph/core'

export function usePanningState(): AnimationGraphState {
  return {
    getLabel: () => 'PanningState',
    shouldRequestPointerLock: true,
    onStart: async () => {},
    onEnd: async () => {},
    handleEvent: async (getCtx, event) => {
      const ctx = getCtx()

      switch (event.type) {
        case 'pointermove':
          ctx.panView(event.data)
          return
        case 'pointerup':
          return { type: 'break' }
      }
    },
  }
}
