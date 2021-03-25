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

import { getInner, IRectangle, IVec2, sub } from 'okageo'
import { computed, reactive, watch } from 'vue'
import { BoneEditMode, useBoneEditMode } from '../composables/armatureEditMode'
import { BonePoseMode, useBonePoseMode } from '../composables/armaturePoseMode'
import { ObjectMode, useObjectMode } from '../composables/objectMode'
import { useWeightPaintMode } from '../composables/weightPaintMode'
import { HistoryItem, useHistoryStore } from './history'
import {
  CanvasMode,
  EditMode,
  EditMovement,
  getTransform,
  PopupMenuItem,
  Transform,
} from '/@/models'

export type AxisGrid = '' | 'x' | 'y'

const historyStore = useHistoryStore()
const state = reactive({
  canvasMode: 'object' as CanvasMode,
  pastCanvasMode: 'edit' as CanvasMode,
  axisGrid: '' as AxisGrid,
})

function initState() {
  state.canvasMode = 'object'
  state.pastCanvasMode = 'edit'
  state.axisGrid = ''
}

const canvasEditMode = computed(():
  | BoneEditMode
  | ObjectMode
  | BonePoseMode => {
  if (state.canvasMode === 'edit') {
    return useBoneEditMode(useCanvasStore())
  } else if (state.canvasMode === 'pose') {
    return useBonePoseMode(useCanvasStore())
  } else if (state.canvasMode === 'weight') {
    return useWeightPaintMode()
  } else {
    return useObjectMode()
  }
})
watch(canvasEditMode, (_to, from) => {
  if (from) from.end()
})

const command = computed((): EditMode => canvasEditMode.value.command.value)

const availableCommandList = computed(
  () => canvasEditMode.value.availableCommandList.value
)

const popupMenuList = computed<PopupMenuItem[]>(() => {
  return canvasEditMode.value.popupMenuList.value
})

function toggleCanvasMode() {
  if (state.canvasMode === 'edit') {
    setCanvasMode(state.pastCanvasMode)
  } else {
    setCanvasMode('edit')
  }
}
function ctrlToggleCanvasMode() {
  if (state.canvasMode === 'edit') {
    if (state.pastCanvasMode === 'object') {
      setCanvasMode('pose')
    } else {
      setCanvasMode('object')
    }
  } else if (state.canvasMode === 'object') {
    setCanvasMode('pose')
  } else {
    setCanvasMode('object')
  }
}
function setCanvasMode(canvasMode: CanvasMode) {
  const item = getChangeCanvasModeItem(canvasMode)
  historyStore.push(item)
  item.redo()
}
function setAxisGrid(val: AxisGrid) {
  state.axisGrid = val
}
function switchAxisGrid(val: AxisGrid) {
  state.axisGrid = state.axisGrid === val ? '' : val
}
function snapScale(scale: IVec2): IVec2 {
  return {
    x: state.axisGrid === 'y' ? 1 : scale.x,
    y: state.axisGrid === 'x' ? 1 : scale.y,
  }
}
function snapTranslate(translate: IVec2): IVec2 {
  return {
    x: state.axisGrid === 'y' ? 0 : translate.x,
    y: state.axisGrid === 'x' ? 0 : translate.y,
  }
}
function isOppositeSide(origin: IVec2, from: IVec2, current: IVec2): boolean {
  return getInner(sub(from, origin), sub(current, origin)) < 0
}

function getEditTransforms(id: string): Transform {
  return canvasEditMode.value.getEditTransforms(id)
}

function getEditPoseTransforms(id: string): Transform {
  if (state.canvasMode !== 'pose') return getTransform()
  return canvasEditMode.value.getEditTransforms(id)
}

function symmetrizeBones() {
  if (state.canvasMode !== 'edit') return
  ;(canvasEditMode.value as BoneEditMode).symmetrize()
}

export function useCanvasStore() {
  return {
    initState,
    state,
    command,
    toggleCanvasMode,
    ctrlToggleCanvasMode,
    setCanvasMode,
    setAxisGrid,
    switchAxisGrid,
    snapScale,
    snapTranslate,
    isOppositeSide,
    getEditTransforms,
    getEditPoseTransforms,
    mousemove: (arg: EditMovement) => canvasEditMode.value.mousemove(arg),
    clickAny: () => canvasEditMode.value.clickAny(),
    clickEmpty: () => canvasEditMode.value.clickEmpty(),
    cancel: () => canvasEditMode.value.cancel(),
    setEditMode: (mode: EditMode) => canvasEditMode.value.setEditMode(mode),
    execDelete: () => canvasEditMode.value.execDelete(),
    execAdd: () => canvasEditMode.value.execAdd(),
    insert: () => canvasEditMode.value.insert(),
    select: (id: string, selectedState: { [key: string]: boolean }) =>
      canvasEditMode.value.select(id, selectedState),
    shiftSelect: (id: string, selectedState: { [key: string]: boolean }) =>
      canvasEditMode.value.shiftSelect(id, selectedState),
    rectSelect: (rect: IRectangle, shift = false) =>
      canvasEditMode.value.rectSelect(rect, shift),
    selectAll: () => canvasEditMode.value.selectAll(),
    clip: () => canvasEditMode.value.clip(),
    paste: () => canvasEditMode.value.paste(),
    duplicate: () => canvasEditMode.value.duplicate(),
    availableCommandList,
    symmetrizeBones,
    popupMenuList,
  }
}
export type CanvasStore = ReturnType<typeof useCanvasStore>

function getChangeCanvasModeItem(canvasMode: CanvasMode): HistoryItem {
  const currentMode = state.canvasMode
  const currentPastMode = state.pastCanvasMode
  const redo = () => {
    state.pastCanvasMode = state.canvasMode
    state.canvasMode = canvasMode
  }
  return {
    name: 'Change Mode',
    undo: () => {
      state.canvasMode = currentMode
      state.pastCanvasMode = currentPastMode
    },
    redo,
  }
}
