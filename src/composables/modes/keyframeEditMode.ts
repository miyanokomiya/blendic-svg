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

Copyright (C) 2021, Tomoya Komiyama.
*/

import { PopupMenuItem, CommandExam } from '/@/composables/modes/types'
import { AnimationStore } from '/@/store/animation'
import {} from '/@/models/keyframe'
import {} from '/@/utils/keyframes'
import { IVec2 } from 'okageo'
import { AppSettings } from '/@/composables/settings'
import { pointToControl } from '/@/utils/graphCurves'
import { ActionStateContext } from '/@/composables/modeStates/animationCanvas/actionMode/core'
import { IndexStore } from '/@/store'
import { AnimationCanvasStateContext } from '/@/composables/modeStates/animationCanvas/core'
import { Rectangle } from 'okanvas'
import { GraphStateContext } from '/@/composables/modeStates/animationCanvas/graphMode/core'
import {
  ModeStateContextBase,
  useModeStateMachine,
} from '/@/composables/modeStates/core'
import { generateUuid } from '/@/utils/random'
import { useDefaultState as useActionDefaultState } from '/@/composables/modeStates/animationCanvas/actionMode/defaultState'
import { useDefaultState as useGraphDefaultState } from '/@/composables/modeStates/animationCanvas/graphMode/defaultState'
import { useDefaultState as useLabelDefaultState } from '/@/composables/modeStates/animationCanvas/labelMode/defaultState'
import { canvasToFrameValue } from '/@/utils/animations'

export type AnimationCanvasType = 'label' | 'action' | 'graph'

type Option = {
  indexStore: IndexStore
  animationStore: AnimationStore
  settings: AppSettings

  canvasType: AnimationCanvasType

  requestPointerLock: AnimationCanvasStateContext['requestPointerLock']
  exitPointerLock: AnimationCanvasStateContext['exitPointerLock']
  setViewport: (rect?: Rectangle) => void
  panView: AnimationCanvasStateContext['panView']
  startDragging: AnimationCanvasStateContext['startDragging']
  getCursorPoint: () => IVec2
  setRectangleDragging: AnimationCanvasStateContext['setRectangleDragging']
  getDraggedRectangle: AnimationCanvasStateContext['getDraggedRectangle']
  startEditMovement: () => void
  setPopupMenuList: (val?: { items: PopupMenuItem[]; point: IVec2 }) => void
  setCommandExams: (exams?: CommandExam[]) => void
}

export function useAnimationStateMachine(options: Option) {
  if (options.canvasType === 'graph') {
    return {
      sm: useModeStateMachine(
        createGraphContext(options),
        useGraphDefaultState
      ),
    }
  } else if (options.canvasType === 'label') {
    return {
      sm: useModeStateMachine(
        createGraphContext(options),
        useLabelDefaultState
      ),
    }
  } else {
    return {
      sm: useModeStateMachine(
        createActionContext(options),
        useActionDefaultState
      ),
    }
  }
}

function createActionContext(options: Option): ActionStateContext {
  return createAnimationContext(options)
}

function createGraphContext(options: Option): GraphStateContext {
  return {
    ...createAnimationContext(options),
    toCurveControl: (v) => pointToControl(v, options.settings.graphValueWidth),
    toFrameValue: (v, raw) =>
      canvasToFrameValue(v, options.settings.graphValueWidth, raw),
  }
}

function createAnimationContext(options: Option): AnimationCanvasStateContext {
  const { animationStore } = options

  return {
    ...createBaseContext(options),

    generateUuid: generateUuid,

    setViewport: options.setViewport,
    panView: options.panView,
    startDragging: options.startDragging,
    setRectangleDragging: options.setRectangleDragging,
    getDraggedRectangle: options.getDraggedRectangle,

    setPopupMenuList: options.setPopupMenuList,
    setCommandExams: options.setCommandExams,

    generateSeriesKey: () => `${Date.now()}`,
    startEditMovement: options.startEditMovement,
    getCursorPoint: options.getCursorPoint,
    getEditMovement: animationStore.getEditMovement,
    setEditMovement: animationStore.setEditMovement,
    completeEdit: animationStore.completeEdit,
    setCurrentFrame: animationStore.setCurrentFrame,
    getKeyframes: () => animationStore.visibledKeyframeMap.value,
    getLastSelectedKeyframeId: () =>
      animationStore.lastSelectedKeyframe.value?.id ?? '',
    getSelectedKeyframes: () => animationStore.selectedKeyframeMap.value,
    selectKeyframe: animationStore.selectKeyframe,
    selectKeyframes: animationStore.selectKeyframes,
    selectAllKeyframes: animationStore.selectAllKeyframes,
    deleteKeyframes: animationStore.execDeleteKeyframes,
    updateKeyframes: animationStore.execUpdateKeyframes,
    pasteKeyframes: animationStore.pasteKeyframes,
    setTmpKeyframes: animationStore.setTmpKeyframes,
  }
}

function createBaseContext(options: Option): ModeStateContextBase {
  return {
    requestPointerLock: options.requestPointerLock,
    exitPointerLock: options.exitPointerLock,
    getTimestamp: () => Date.now(),
  }
}
