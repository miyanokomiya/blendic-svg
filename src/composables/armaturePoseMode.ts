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

import { reactive, computed } from 'vue'
import { getDistance, getRadian, IVec2, multi, rotate, sub } from 'okageo'
import {
  Transform,
  getTransform,
  BoneSelectedState,
  EditMode,
  IdMap,
  EditMovement,
  CanvasEditModeBase,
} from '../models/index'
import { useStore } from '/@/store/index'
import { CanvasStore } from '/@/store/canvas'
import { useAnimationStore } from '../store/animation'
import { mapReduce } from '../utils/commons'
import { applyTransform, invertPoseTransform, scale } from '../utils/armatures'

interface State {
  command: EditMode
  editMovement: EditMovement | undefined
  clipboard: IdMap<Transform>
}

export interface BonePoseMode extends CanvasEditModeBase {}

export function useBonePoseMode(canvasStore: CanvasStore): BonePoseMode {
  const state = reactive<State>({
    command: '',
    editMovement: undefined,
    clipboard: {},
  })

  const store = useStore()
  const animationStore = useAnimationStore()
  const lastSelectedBoneId = computed(() => store.lastSelectedBone.value?.id)

  const target = computed(() => store.lastSelectedArmature.value)
  const isAnySelected = computed(() => !!lastSelectedBoneId.value)

  function cancel() {
    state.command = ''
    state.editMovement = undefined
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
      return rotate(
        scale(vec, {
          x: 1 / parent.transform.scale.x,
          y: 1 / parent.transform.scale.y,
        }),
        (-parent.transform.rotate / 180) * Math.PI
      )
    } else {
      return vec
    }
  }

  function rotateDirection(boneId: string) {
    const scale = animationStore.currentPosedBones.value[boneId].transform.scale
    return Math.sign(scale.x * scale.y)
  }

  const editTransforms = computed(() => {
    if (!state.editMovement) return {}

    if (state.command === 'rotate') {
      const origin = animationStore.selectedPosedBoneOrigin.value
      const rotate =
        ((getRadian(state.editMovement.current, origin) -
          getRadian(state.editMovement.start, origin)) /
          Math.PI) *
        180
      return Object.keys(animationStore.selectedBones.value).reduce<
        IdMap<Transform>
      >((map, id) => {
        map[id] = getTransform({ rotate: rotate * rotateDirection(id) })
        return map
      }, {})
    }

    const translate = sub(state.editMovement.current, state.editMovement.start)

    if (state.command === 'scale') {
      const origin = animationStore.selectedPosedBoneOrigin.value
      const isOppositeSide = canvasStore.isOppositeSide(
        origin,
        state.editMovement.start,
        state.editMovement.current
      )
      const scale = multi(
        multi({ x: 1, y: 1 }, isOppositeSide ? -1 : 1),
        getDistance(state.editMovement.current, origin) /
          getDistance(state.editMovement.start, origin)
      )
      const snappedScale = canvasStore.snapScale(scale)
      return Object.keys(animationStore.selectedBones.value).reduce<
        IdMap<Transform>
      >((map, id) => {
        map[id] = getTransform({ scale: snappedScale })
        return map
      }, {})
    }

    const snappedTranslate = canvasStore.snapTranslate(translate)
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
  })

  function completeEdit() {
    if (!target.value) return

    animationStore.applyEditedTransforms(editTransforms.value)
    state.editMovement = undefined
    state.command = ''
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

  function selectAll() {
    if (state.command) {
      completeEdit()
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
    if (state.command === 'grab') {
      return [
        { command: 'x', title: 'Fix Axis X' },
        { command: 'y', title: 'Fix Axis Y' },
      ]
    } else if (isAnySelected.value) {
      return [
        { command: 'i', title: 'Insert Keyframe' },
        { command: 'g', title: 'Grab' },
        { command: 'r', title: 'Rotate' },
        { command: 'a', title: 'All Select' },
        { command: 'Ctrl + c', title: 'Clip' },
        { command: 'Ctrl + v', title: 'Paste' },
      ]
    } else {
      return [
        { command: 'a', title: 'All Select' },
        { command: 'Ctrl + v', title: 'Paste' },
      ]
    }
  })

  return {
    command: computed(() => state.command),
    getEditTransforms(id: string) {
      return editTransforms.value[id] ?? getTransform()
    },
    end: () => cancel(),
    cancel,
    setEditMode,
    select,
    shiftSelect,
    selectAll,
    mousemove,
    clickAny,
    clickEmpty,
    execDelete: () => {},
    execAdd: () => {},
    clip,
    paste,
    duplicate: () => {},
    availableCommandList,
  }
}
