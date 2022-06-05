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

import { EditState } from '/@/composables/modeStates/appCanvas/editMode/core'
import { usePanningState } from '/@/composables/modeStates/commons'

export function useDefaultState(): EditState {
  return state
}

const state: EditState = {
  getLabel: () => 'DefaultState',
  handleEvent: async (_ctx, event) => {
    switch (event.type) {
      case 'pointerdown':
        switch (event.data.options.button) {
          case 1:
            return usePanningState
        }
        return
    }
  },
}
