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
import { EditMovement } from '/@/composables/modes/types'
import { ActionStateContext } from '/@/composables/modeStates/animationCanvas/actionMode/core'
import { GraphStateContext } from '/@/composables/modeStates/animationCanvas/graphMode/core'
import { CanvasStateContext } from '/@/composables/modeStates/commons'
import type {
  ModeStateBase,
  ModeStateContextBase,
  ModeStateEvent,
  ModeStateEventBase,
} from '/@/composables/modeStates/core'
import { IdMap } from '/@/models'
import { KeyframeBase, KeyframeSelectedState } from '/@/models/keyframe'

export interface AnimationCanvasStateContext extends CanvasStateContext {
  generateSeriesKey: () => string
  startEditMovement: () => void
  getCursorPoint: () => IVec2
  getEditMovement: () => EditMovement | undefined
  setEditMovement: (val?: EditMovement) => void
  completeEdit: () => void
  setCurrentFrame: (val: number, seriesKey?: string) => void
  getKeyframes: () => IdMap<KeyframeBase>
  getLastSelectedKeyframeId: () => string | undefined
  getSelectedKeyframes: () => IdMap<KeyframeSelectedState>
  selectKeyframe: (
    keyframeId: string,
    selectedState?: KeyframeSelectedState,
    shift?: boolean
  ) => void
  selectAllKeyframes: () => void
  deleteKeyframes: () => void
  updateKeyframes: (keyframes: IdMap<KeyframeBase>, seriesKey?: string) => void
}

export interface AnimationCanvasState
  extends ModeStateBase<AnimationCanvasStateContext, AnimationCanvasEvent> {}

export interface AnimationCanvasGroupStateContext extends ModeStateContextBase {
  getActionContext: () => ActionStateContext
  getGraphContext: () => GraphStateContext
  toggleMode: (ctrl?: boolean) => void
}

export interface AnimationCanvasGroupState
  extends ModeStateBase<
    AnimationCanvasGroupStateContext,
    AnimationCanvasEvent
  > {}

export type AnimationCanvasEvent = ModeStateEvent | ChangeSelectionEvent

interface ChangeSelectionEvent extends ModeStateEventBase {
  type: 'selection'
}
