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

import {
  AppCanvasEvent,
  AppCanvasStateContext,
} from '/@/composables/modeStates/appCanvas/core'
import type { ModeStateBase } from '/@/composables/modeStates/core'
import { SelectOptions } from '/@/composables/modes/types'

export interface WeightStateContext extends AppCanvasStateContext {
  selectElement: (id?: string, options?: SelectOptions) => void
}

export interface WeightState
  extends ModeStateBase<WeightStateContext, AppCanvasEvent> {}
