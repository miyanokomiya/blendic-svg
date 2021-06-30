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
import {
  BoneEditMode,
  useBoneEditMode,
} from '/@/composables/modes/armatureEditMode'
import {
  BonePoseMode,
  useBonePoseMode,
} from '/@/composables/modes/armaturePoseMode'
import { ObjectMode, useObjectMode } from '/@/composables/modes/objectMode'
import { useWeightPaintMode } from '/@/composables/modes/weightPaintMode'
import { useHistoryStore } from './history'
import { BoneSelectedState, getTransform, Transform } from '/@/models'
import {
  CanvasMode,
  EditMode,
  EditMovement,
  SelectOptions,
} from '/@/composables/modes/types'
import { HistoryItem } from '/@/composables/stores/history'
import { useStore } from '/@/store'
import { useAnimationStore } from '/@/store/animation'
import { useElementStore } from '/@/store/element'

export type AxisGrid = '' | 'x' | 'y'

const historyStore = useHistoryStore()
const store = useStore()
const animationStore = useAnimationStore()
const elementStore = useElementStore()

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

const canvasEditMode = computed(
  (): BoneEditMode | ObjectMode | BonePoseMode => {
    if (state.canvasMode === 'edit') {
      return useBoneEditMode(store, useCanvasStore())
    } else if (state.canvasMode === 'pose') {
      return useBonePoseMode(store, useCanvasStore())
    } else if (state.canvasMode === 'weight') {
      return useWeightPaintMode(useElementStore())
    } else {
      return useObjectMode()
    }
  }
)
watch(canvasEditMode, (_to, from) => {
  if (from) from.end()
})

const selectedBonesOrigin = computed(() => {
  if (state.canvasMode === 'edit') {
    return store.selectedBonesOrigin.value
  } else {
    return animationStore.selectedPosedBoneOrigin.value
  }
})

const command = computed((): EditMode => canvasEditMode.value.command.value)

const availableCommandList = computed(
  () => canvasEditMode.value.availableCommandList.value
)

const popupMenuList = computed(() => {
  return canvasEditMode.value.popupMenuList.value
})

const toolMenuGroupList = computed(() => {
  return canvasEditMode.value.toolMenuGroupList.value
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

watch(
  () => command.value,
  () => {
    setAxisGrid('')
  }
)

function switchAxisGrid(val: AxisGrid) {
  state.axisGrid = state.axisGrid === val ? '' : val
}
function snapScaleDiff(scaleDiff: IVec2): IVec2 {
  return {
    x: state.axisGrid === 'y' ? 0 : scaleDiff.x,
    y: state.axisGrid === 'x' ? 0 : scaleDiff.y,
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

const axisGridEnabled = computed<boolean>(() => {
  return ['grab', 'scale'].includes(command.value)
})

function changeCanvasMode(canvasMode: CanvasMode) {
  if (canvasMode === 'weight') {
    if (elementStore.lastSelectedActor.value) {
      setCanvasMode(canvasMode)
    }
  } else {
    if (store.lastSelectedArmature.value) {
      setCanvasMode(canvasMode)
    } else {
      setCanvasMode('object')
    }
  }
}

function execIfBoneSelected(
  fn: () => void,
  needLock: boolean
): { needLock: boolean } {
  if (store.lastSelectedBone.value) {
    fn()
    return { needLock }
  } else {
    return { needLock: false }
  }
}

function editKeyDown(
  key: string,
  options: { shift?: boolean; ctrl?: boolean }
): { needLock: boolean } {
  switch (key) {
    case 'Escape':
      canvasEditMode.value.cancel
      return { needLock: false }
    case 'Tab':
      if (store.lastSelectedArmature.value) {
        // Ctrl + Tab cannot be controlled by JS
        if (options.shift) {
          ctrlToggleCanvasMode()
        } else {
          toggleCanvasMode()
        }
      }
      return { needLock: false }
    case 'g':
      return execIfBoneSelected(
        () => canvasEditMode.value.setEditMode('grab'),
        true
      )
    case 'r':
      return execIfBoneSelected(
        () => canvasEditMode.value.setEditMode('rotate'),
        true
      )
    case 's':
      return execIfBoneSelected(
        () => canvasEditMode.value.setEditMode('scale'),
        true
      )
    case 'e':
      return execIfBoneSelected(
        () => canvasEditMode.value.setEditMode('extrude'),
        true
      )
    case 'x':
      if (axisGridEnabled.value) {
        switchAxisGrid(key)
      } else {
        canvasEditMode.value.setEditMode('delete')
      }
      return { needLock: false }
    case 'y':
      if (axisGridEnabled.value) {
        switchAxisGrid(key)
      }
      return { needLock: false }
    case 'a':
      canvasEditMode.value.selectAll()
      return { needLock: false }
    case 'i':
      canvasEditMode.value.insert()
      return { needLock: false }
    case 'A':
      canvasEditMode.value.execAdd()
      return { needLock: false }
    case 'D':
      if (canvasEditMode.value.duplicate()) {
        return { needLock: true }
      } else {
        return { needLock: false }
      }
    case 'c':
      if (options.ctrl) {
        canvasEditMode.value.clip()
      }
      return { needLock: false }
    case 'v':
      if (options.ctrl) {
        canvasEditMode.value.paste()
      }
      return { needLock: false }
    default:
      return { needLock: false }
  }
}

export function useCanvasStore() {
  return {
    initState,
    state,
    command,
    selectedBonesOrigin,
    changeCanvasMode,
    snapScaleDiff,
    snapTranslate,
    isOppositeSide,
    getEditTransforms,
    getEditPoseTransforms,
    mousemove: (arg: EditMovement) => canvasEditMode.value.mousemove(arg),
    clickAny: () => canvasEditMode.value.clickAny(),
    clickEmpty: () => canvasEditMode.value.clickEmpty(),
    cancel: () => canvasEditMode.value.cancel(),
    setEditMode: (mode: EditMode) => canvasEditMode.value.setEditMode(mode),
    editKeyDown,
    select: (
      id: string,
      selectedState: BoneSelectedState,
      options?: SelectOptions
    ) => canvasEditMode.value.select(id, selectedState, options),
    rectSelect: (rect: IRectangle, options: SelectOptions) =>
      canvasEditMode.value.rectSelect(rect, options),
    selectAll: () => canvasEditMode.value.selectAll(),
    availableCommandList,
    popupMenuList,
    toolMenuGroupList,
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
