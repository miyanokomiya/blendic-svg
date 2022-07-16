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
  AnimationCanvasEvent,
  AnimationCanvasStateContext,
} from '/@/composables/modeStates/animationCanvas/core'
import type { ModeStateBase } from '/@/composables/modeStates/core'
import { IdMap } from '/@/models'
import { KeyframeBase } from '/@/models/keyframe'
import { SelectOptions } from '/@/composables/modes/types'

export interface GraphStateContext extends AnimationCanvasStateContext {
  getKeyframes: () => IdMap<KeyframeBase>
  getLastSelectedKeyframeId: () => string | undefined
  getSelectedKeyframes: () => IdMap<KeyframeBase>
  selectKeyframe: (id?: string, options?: SelectOptions) => void
  selectAllKeyframes: () => void
  deleteKeyframes: () => void
}

export interface GraphState
  extends ModeStateBase<GraphStateContext, AnimationCanvasEvent> {}
