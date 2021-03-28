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

import { reactive, computed, ref } from 'vue'
import { getDistance, getRadian, IRectangle, IVec2, multi, sub } from 'okageo'
import {
  Transform,
  getTransform,
  BoneSelectedState,
  IdMap,
} from '/@/models/index'
import {
  EditMode,
  CanvasEditModeBase,
  EditMovement,
  PopupMenuItem,
} from '/@/composables/modes/types'
import { useStore } from '/@/store/index'
import { CanvasStore } from '/@/store/canvas'
import { useAnimationStore } from '/@/store/animation'
import { mapReduce } from '/@/utils/commons'
import {
  convolutePoseTransforms,
  getTransformedBoneMap,
  invertPoseTransform,
  selectBoneInRect,
} from '/@/utils/armatures'
import {
  applyTransformToVec,
  getContinuousRadDiff,
  snapGrid,
  snapRotate,
  snapScale,
} from '/@/utils/geometry'
import { getCtrlOrMetaStr } from '/@/utils/devices'

interface State {
  command: EditMode
  editMovement: EditMovement | undefined
  clipboard: IdMap<Transform>
  currentRad: number
  currentTotalRad: number
}

export interface BonePoseMode extends CanvasEditModeBase {}

export function useBonePoseMode(canvasStore: CanvasStore): BonePoseMode {
  const state = reactive<State>({
    command: '',
    editMovement: undefined,
    clipboard: {},

    // to rotate continously
    currentRad: 0,
    currentTotalRad: 0,
  })

  const store = useStore()
  const animationStore = useAnimationStore()
  const lastSelectedBoneId = computed(() => store.lastSelectedBone.value?.id)

  const target = computed(() => store.lastSelectedArmature.value)
  const isAnySelected = computed(() => !!lastSelectedBoneId.value)

  function cancel() {
    state.command = ''
    state.editMovement = undefined
    state.currentRad = 0
    state.currentTotalRad = 0
  }

  function clickAny() {
    if (state.command) {
      completeEdit()
    }
  }

  function clickEmpty() {
    if (state.command) {
      completeEdit()
    } else {
      store.selectBone()
    }
  }

  function setEditMode(mode: EditMode) {
    if (!target.value) return

    cancel()

    if (isAnySelected.value) {
      state.command = mode
    }
  }

  function convertToPosedSpace(vec: IVec2, boneId: string): IVec2 {
    const bone = animationStore.currentPosedBones.value[boneId]
    const parent = animationStore.currentPosedBones.value[bone.parentId]
    if (parent) {
      return applyTransformToVec(vec, invertPoseTransform(parent.transform))
    } else {
      return vec
    }
  }

  function rotateDirection(boneId: string) {
    const scale = animationStore.currentPosedBones.value[boneId].transform.scale
    return Math.sign(scale.x * scale.y)
  }

  const editTransforms = computed(() => {
    const editMovement = state.editMovement
    if (!editMovement) return {}

    if (state.command === 'rotate') {
      const origin = animationStore.selectedPosedBoneOrigin.value
      const rad =
        getRadian(editMovement.current, origin) -
        getRadian(editMovement.start, origin)

      const continuousRad =
        state.currentTotalRad + getContinuousRadDiff(state.currentRad, rad)
      const rotate = (continuousRad / Math.PI) * 180

      state.currentRad = rad
      state.currentTotalRad = continuousRad

      const snappedRotate = editMovement.ctrl ? snapRotate(rotate) : rotate

      return Object.keys(animationStore.selectedBones.value).reduce<
        IdMap<Transform>
      >((map, id) => {
        map[id] = getTransform({ rotate: snappedRotate * rotateDirection(id) })
        return map
      }, {})
    } else if (state.command === 'scale') {
      const origin = animationStore.selectedPosedBoneOrigin.value
      const isOppositeSide = canvasStore.isOppositeSide(
        origin,
        editMovement.start,
        editMovement.current
      )
      const scale = multi(
        multi({ x: 1, y: 1 }, isOppositeSide ? -1 : 1),
        getDistance(editMovement.current, origin) /
          getDistance(editMovement.start, origin)
      )
      const gridScale = editMovement.ctrl ? snapScale(scale) : scale
      const snappedScale = canvasStore.snapScale(gridScale)

      return Object.keys(animationStore.selectedBones.value).reduce<
        IdMap<Transform>
      >((map, id) => {
        map[id] = getTransform({ scale: snappedScale })
        return map
      }, {})
    } else if (state.command === 'grab') {
      const translate = sub(editMovement.current, editMovement.start)

      const gridTranslate = editMovement.ctrl
        ? snapGrid(editMovement.scale, translate)
        : translate
      const snappedTranslate = canvasStore.snapTranslate(gridTranslate)

      return Object.keys(animationStore.selectedBones.value).reduce<
        IdMap<Transform>
      >((map, id) => {
        if (!animationStore.selectedBones.value[id].connected) {
          map[id] = getTransform({
            translate: convertToPosedSpace(snappedTranslate, id),
          })
        }
        return map
      }, {})
    } else {
      return {}
    }
  })

  function completeEdit() {
    if (!target.value) return

    animationStore.applyEditedTransforms(editTransforms.value)
    state.editMovement = undefined
    state.command = ''
    state.currentRad = 0
    state.currentTotalRad = 0
  }

  function select(id: string, selectedState: BoneSelectedState) {
    if (state.command) {
      completeEdit()
      return
    }
    store.selectBone(id, selectedState, false, true)
  }

  function shiftSelect(id: string, selectedState: BoneSelectedState) {
    if (state.command) {
      completeEdit()
      return
    }
    store.selectBone(id, selectedState, true, true)
  }

  function rectSelect(rect: IRectangle, shift = false) {
    // FIXME: it may be performance issue someday to resolve poses here
    const boneMap = getTransformedBoneMap(
      mapReduce(store.boneMap.value, (b) => {
        return {
          ...b,
          transform: convolutePoseTransforms([
            animationStore.getCurrentSelfTransforms(b.id),
            getEditTransforms(b.id),
          ]),
        }
      })
    )
    const stateMap = selectBoneInRect(rect, boneMap)
    store.selectBones(stateMap, shift)
  }

  function selectAll() {
    if (state.command) {
      cancel()
      return
    }
    store.selectAllBone()
  }

  function mousemove(arg: EditMovement) {
    if (state.command) {
      state.editMovement = arg
    }
  }

  function clip() {
    state.clipboard = mapReduce(animationStore.selectedAllBones.value, (b) =>
      animationStore.getCurrentSelfTransforms(b.id)
    )
  }

  function paste() {
    if (Object.keys(state.clipboard).length === 0) return
    animationStore.pastePoses(state.clipboard)
  }

  const availableCommandList = computed(() => {
    const ctrl = { command: getCtrlOrMetaStr(), title: 'Snap' }

    if (state.command === 'grab') {
      return [
        { command: 'x', title: 'On Axis X' },
        { command: 'y', title: 'On Axis Y' },
        ctrl,
      ]
    } else if (state.command === 'rotate') {
      return [ctrl]
    } else if (isAnySelected.value) {
      return [
        { command: 'i', title: 'Insert Keyframe' },
        { command: 'g', title: 'Grab' },
        { command: 'r', title: 'Rotate' },
        { command: 'a', title: 'All Select' },
        { command: `${getCtrlOrMetaStr()} + c`, title: 'Clip' },
        { command: `${getCtrlOrMetaStr()} + v`, title: 'Paste' },
      ]
    } else {
      return [
        { command: 'a', title: 'All Select' },
        { command: `${getCtrlOrMetaStr()} + v`, title: 'Paste' },
      ]
    }
  })

  function getEditTransforms(id: string) {
    return editTransforms.value[id] ?? getTransform()
  }

  function insert() {
    cancel()
    state.command = 'insert'
  }

  const lastSelectedPopupItem = ref<string>()

  function execInsert(
    useTranslate: boolean,
    useRotate: boolean,
    useScale: boolean
  ) {
    animationStore.execInsertKeyframe({
      useTranslate,
      useRotate,
      useScale,
    })
    state.command = ''
  }

  const popupMenuListSrc = computed<PopupMenuItem[]>(() => {
    return [
      {
        label: 'All Transforms',
        exec: () => execInsert(true, true, true),
      },
      {
        label: 'Location',
        exec: () => execInsert(true, false, false),
      },
      {
        label: 'Rotation',
        exec: () => execInsert(false, true, false),
      },
      {
        label: 'Scale',
        exec: () => execInsert(false, false, true),
      },
      {
        label: 'Location & Rotation',
        exec: () => execInsert(true, true, false),
      },
      {
        label: 'Location & Scale',
        exec: () => execInsert(true, false, true),
      },
      {
        label: 'Rotation & Scale',
        exec: () => execInsert(false, true, true),
      },
    ]
  })

  const popupMenuList = computed<PopupMenuItem[]>(() => {
    if (state.command === 'insert') {
      return popupMenuListSrc.value.map((item) => ({
        ...item,
        exec: () => {
          lastSelectedPopupItem.value = item.label
          item.exec()
        },
        focus: item.label === lastSelectedPopupItem.value,
      }))
    } else {
      return []
    }
  })

  return {
    command: computed(() => state.command),
    getEditTransforms,
    end: () => cancel(),
    cancel,
    setEditMode,
    select,
    shiftSelect,
    rectSelect,
    selectAll,
    mousemove,
    clickAny,
    clickEmpty,
    execDelete: () => {},
    execAdd: () => {},
    insert,
    clip,
    paste,
    duplicate: () => {},
    availableCommandList,
    popupMenuList,
  }
}
