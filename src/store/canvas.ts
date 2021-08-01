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

import { getInner, IRectangle, IVec2, rotate, sub } from 'okageo'
import { computed, reactive, ref, watch } from 'vue'
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
import {
  Bone,
  BoneSelectedState,
  getTransform,
  IdMap,
  toMap,
  Transform,
} from '/@/models'
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
import {
  addPoseTransform,
  editTransform,
  getTransformedBoneMap,
  posedTransform,
} from '/@/utils/armatures'
import { getBoneXRadian, snapAxisGrid, snapPlainGrid } from '/@/utils/geometry'

export type AxisGrid = 'x' | 'y'
export interface AxisGridInfo {
  axis: AxisGrid
  local: boolean
  vec: IVec2
  origin: IVec2
}

const historyStore = useHistoryStore()
const store = useStore()
const animationStore = useAnimationStore()
const elementStore = useElementStore()

const state = reactive({
  canvasMode: 'object' as CanvasMode,
  pastCanvasMode: 'edit' as CanvasMode,
})

const axisGridInfo = ref<AxisGridInfo>()
const lastSelectedBoneSpace = ref<{ radian: number; origin: IVec2 }>()

function initState() {
  state.canvasMode = 'object'
  state.pastCanvasMode = 'edit'
  axisGridInfo.value = undefined
  lastSelectedBoneSpace.value = undefined
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

const posedBoneMap = computed(() => {
  if (!store.lastSelectedArmature.value) return {}

  if (command.value) {
    const constraintMap = animationStore.currentInterpolatedConstraintMap.value

    return getTransformedBoneMap(
      toMap(
        store.lastSelectedArmature.value.bones.map((b) => {
          return {
            ...b,
            transform: addPoseTransform(
              animationStore.getCurrentSelfTransforms(b.id),
              getEditTransforms(b.id)
            ),
            constraints: b.constraints.map((b) => constraintMap[b.id]),
          }
        })
      )
    )
  } else {
    return animationStore.currentPosedBones.value
  }
})

const visibledBoneMap = computed(() => {
  if (!store.lastSelectedArmature.value) return {}
  if (state.canvasMode === 'edit') {
    return toMap(
      store.lastSelectedArmature.value.bones.map((b) => {
        return editTransform(
          b,
          getEditTransforms(b.id),
          store.state.selectedBones[b.id] || {}
        )
      })
    )
  } else {
    return Object.keys(posedBoneMap.value).reduce<IdMap<Bone>>((p, id) => {
      const b = posedBoneMap.value[id]
      p[id] = posedTransform(b, [b.transform])
      return p
    }, {})
  }
})

function saveLastSelectedBoneSpace() {
  const bone = posedBoneMap.value[store.state.lastSelectedBoneId]
  if (!bone || state.canvasMode !== 'pose') {
    lastSelectedBoneSpace.value = undefined
    return
  }

  lastSelectedBoneSpace.value = {
    origin: posedTransform(bone, [bone.transform]).head,
    radian: getBoneXRadian(bone),
  }
}

const axisGridLine = computed(() => axisGridInfo.value)

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
function toggleAxisGridInfo(axis: AxisGrid) {
  const unit = axis === 'x' ? { x: 1, y: 0 } : { x: 0, y: 1 }

  if (state.canvasMode === 'edit') {
    axisGridInfo.value = axisGridInfo.value
      ? undefined
      : {
          axis,
          local: false,
          vec: unit,
          origin: selectedBonesOrigin.value,
        }
  } else if (state.canvasMode === 'pose') {
    if (!lastSelectedBoneSpace.value) return
    if (!axisGridInfo.value || axisGridInfo.value.axis !== axis) {
      axisGridInfo.value = {
        axis,
        local: false,
        vec: unit,
        origin: lastSelectedBoneSpace.value.origin,
      }
    } else {
      axisGridInfo.value = axisGridInfo.value.local
        ? undefined
        : {
            axis,
            local: true,
            vec: rotate(unit, lastSelectedBoneSpace.value.radian),
            origin: lastSelectedBoneSpace.value.origin,
          }
    }
  } else {
    axisGridInfo.value = undefined
  }
}

watch(
  () => command.value,
  () => {
    axisGridInfo.value = undefined
  }
)
watch(
  () => [command.value, state.canvasMode, store.lastSelectedBone.value],
  () => {
    saveLastSelectedBoneSpace()
  }
)

function switchAxisGrid(val: AxisGrid) {
  toggleAxisGridInfo(val)
}
function snapScaleDiff(scaleDiff: IVec2): IVec2 {
  if (!axisGridLine.value) return scaleDiff
  return {
    x: axisGridLine.value.axis === 'y' ? 0 : scaleDiff.x,
    y: axisGridLine.value.axis === 'x' ? 0 : scaleDiff.y,
  }
}
function snapTranslate(size: number, translate: IVec2): IVec2 {
  if (!axisGridLine.value) return snapPlainGrid(size, 0, translate)
  return snapAxisGrid(size, axisGridLine.value.vec, translate)
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
    axisGridLine,

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

    posedBoneMap,
    visibledBoneMap,
    lastSelectedBoneSpace: computed(() => lastSelectedBoneSpace.value),
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
