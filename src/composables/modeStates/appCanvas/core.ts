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

import { EditStateContext } from '/@/composables/modeStates/appCanvas/editMode/core'
import { ObjectStateContext } from '/@/composables/modeStates/appCanvas/objectMode/core'
import { PoseStateContext } from '/@/composables/modeStates/appCanvas/poseMode/core'
import { WeightStateContext } from '/@/composables/modeStates/appCanvas/weightMode/core'
import { CanvasStateContext } from '/@/composables/modeStates/commons'
import type {
  ModeStateBase,
  ModeStateContextBase,
  ModeStateEvent,
  ModeStateEventBase,
} from '/@/composables/modeStates/core'

export interface AppCanvasStateContext extends CanvasStateContext {
  pickBone: (id?: string) => void
}

export interface AppCanvasState
  extends ModeStateBase<AppCanvasStateContext, AppCanvasEvent> {}

export interface AppCanvasGroupStateContext extends ModeStateContextBase {
  getObjectContext: () => ObjectStateContext
  getEditContext: () => EditStateContext
  getPoseContext: () => PoseStateContext
  getWeightContext: () => WeightStateContext
  toggleMode: (ctrl?: boolean) => void
}

export interface AppCanvasGroupState
  extends ModeStateBase<AppCanvasGroupStateContext, AppCanvasEvent> {}

export type AppCanvasEvent =
  | ModeStateEvent
  | ChangeSelectionEvent
  | PickBoneEvent

interface ChangeSelectionEvent extends ModeStateEventBase {
  type: 'selection'
}

interface PickBoneEvent extends ModeStateEventBase {
  type: 'pick-bone'
}
