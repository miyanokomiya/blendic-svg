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

import { reactive, computed, ComputedRef } from 'vue'
import {
  Transform,
  getTransform,
  EditMode,
  IdMap,
  EditMovement,
  CanvasEditModeBase,
  toMap,
} from '../models/index'
import { useAnimationStore } from '../store/animation'
import { mapReduce, toList } from '../utils/commons'
import { getFrameX, getNearestFrameAtPoint } from '../utils/animations'
import { getCtrlOrMetaStr } from '/@/utils/devices'
import { applyTransform } from '/@/utils/geometry'
import { IRectangle } from 'okageo'
import { getKeyframeBone, KeyframeBase } from '/@/models/keyframe'
import { splitKeyframeBySelected } from '/@/utils/keyframes'

interface State {
  command: EditMode
  editMovement: EditMovement | undefined
  clipboard: KeyframeBase[]
  tmpKeyframes: IdMap<KeyframeBase>
}

export interface KeyframeEditMode extends CanvasEditModeBase {
  tmpKeyframes: ComputedRef<IdMap<KeyframeBase>>
  getEditFrames: (id: string) => number
  selectFrame: (frame: number) => void
  shiftSelectFrame: (frame: number) => void
  editedKeyframeMap: ComputedRef<{
    selected: IdMap<KeyframeBase>
    notSelected: IdMap<KeyframeBase>
  }>
}

export function useKeyframeEditMode(): KeyframeEditMode {
  const state = reactive<State>({
    command: '',
    editMovement: undefined,
    clipboard: [],
    tmpKeyframes: {},
  })

  const animationStore = useAnimationStore()

  const allKeyframes = computed(() => animationStore.visibledKeyframeMap.value)
  const editTargets = computed(
    () => animationStore.visibledSelectedKeyframeMap.value
  )
  const isAnySelected = computed(
    () => Object.keys(editTargets.value).length > 0
  )

  function cancel() {
    state.command = ''
    state.editMovement = undefined
    state.tmpKeyframes = {}
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
      animationStore.selectKeyframe('')
    }
  }

  function setEditMode(mode: EditMode) {
    if (!isAnySelected.value) return

    cancel()
    state.command = mode
  }

  const editTransforms = computed(() => {
    if (!state.editMovement) return {}

    const translate = {
      x: state.editMovement.current.x - state.editMovement.start.x,
      y: 0,
    }
    return Object.keys(editTargets.value).reduce<IdMap<Transform>>(
      (map, id) => {
        map[id] = getTransform({ translate })
        return map
      },
      {}
    )
  })

  const editFrames = computed(() => {
    return mapReduce(editTransforms.value, (transform, id) => {
      const keyframe = allKeyframes.value[id]
      const nextX = applyTransform(
        { x: getFrameX(keyframe.frame), y: 0 },
        transform
      ).x
      return getNearestFrameAtPoint(nextX)
    })
  })

  const keyframeSelectedInfoSet = computed<{
    selected: IdMap<KeyframeBase>
    notSelected: IdMap<KeyframeBase>
  }>(() => {
    const selected: IdMap<KeyframeBase> = {}
    const notSelected: IdMap<KeyframeBase> = {}

    Object.keys(animationStore.selectedKeyframeMap.value).forEach((id) => {
      const selectedState = animationStore.selectedKeyframeMap.value[id]
      const keyframe = allKeyframes.value[id]
      const splited = splitKeyframeBySelected(keyframe, selectedState)
      if (splited.selected) {
        selected[id] = splited.selected
      }
      if (splited.notSelected) {
        const not = getKeyframeBone(splited.notSelected, true)
        notSelected[not.id] = not
      }
    })

    return {
      selected,
      notSelected,
    }
  })

  const editedKeyframeMap = computed<{
    selected: IdMap<KeyframeBase>
    notSelected: IdMap<KeyframeBase>
  }>(() => {
    if (!state.command) return { selected: {}, notSelected: {} }

    return {
      selected: mapReduce(
        keyframeSelectedInfoSet.value.selected,
        (keyframe, id) => {
          return {
            ...keyframe,
            frame: getEditFrames(id),
          }
        }
      ),
      notSelected: keyframeSelectedInfoSet.value.notSelected,
    }
  })

  function completeEdit() {
    if (!isAnySelected.value) return

    const duplicatedList = toList(state.tmpKeyframes)
    if (duplicatedList.length > 0) {
      animationStore.completeDuplicateKeyframes(
        toList(state.tmpKeyframes),
        toList(editedKeyframeMap.value.selected)
      )
    } else {
      animationStore.completeDuplicateKeyframes(
        toList(editedKeyframeMap.value.notSelected),
        toList(editedKeyframeMap.value.selected)
      )
    }

    state.tmpKeyframes = {}
    state.editMovement = undefined
    state.command = ''
  }

  function select(id: string, selectedState: any) {
    if (state.command) {
      completeEdit()
      return
    }
    animationStore.selectKeyframe(id, selectedState)
  }

  function shiftSelect(id: string, selectedState: any) {
    if (state.command) {
      completeEdit()
      return
    }
    animationStore.selectKeyframe(id, selectedState, true)
  }

  function selectFrame(frame: number) {
    if (state.command) {
      completeEdit()
      return
    }
    animationStore.selectKeyframeByFrame(frame)
  }

  function shiftSelectFrame(frame: number) {
    if (state.command) {
      completeEdit()
      return
    }
    animationStore.selectKeyframeByFrame(frame, true)
  }

  function rectSelect(_rect: IRectangle, _shift = false) {}

  function selectAll() {
    if (state.command) {
      completeEdit()
      return
    }
    animationStore.selectAllKeyframes()
  }

  function mousemove(arg: EditMovement) {
    if (state.command) {
      state.editMovement = arg
    }
  }

  function execDelete() {
    if (state.command) {
      completeEdit()
      return
    }
    animationStore.execDeleteKeyframes()
  }

  function getEditFrames(id: string): number {
    return (
      editFrames.value[id] ??
      allKeyframes.value[id]?.frame ??
      state.tmpKeyframes[id].frame
    )
  }

  function clip() {
    state.clipboard = toList(keyframeSelectedInfoSet.value.selected)
  }

  function paste() {
    if (state.clipboard.length === 0) return
    animationStore.pasteKeyframes(state.clipboard)
  }

  function duplicate() {
    if (state.command !== '') return

    // duplicate current edit targets as tmp keyframes
    // & continue to edit original edit targets
    const duplicated = toMap(
      toList(
        mapReduce(editTargets.value, (src) => {
          return getKeyframeBone({ ...src }, true)
        })
      )
    )
    state.tmpKeyframes = duplicated
    state.command = 'grab'
  }

  const availableCommandList = computed(() => {
    if (isAnySelected.value) {
      return [
        { command: 'g', title: 'Grab' },
        { command: 'a', title: 'All Select' },
        { command: 'x', title: 'Delete' },
        { command: 'D', title: 'Duplicate' },
        { command: `${getCtrlOrMetaStr()} + c`, title: 'Clip' },
        { command: `${getCtrlOrMetaStr()} + v`, title: 'Paste' },
        { command: 'Space', title: 'Play/Stop' },
      ]
    } else {
      return [
        { command: 'a', title: 'All Select' },
        { command: `${getCtrlOrMetaStr()} + v`, title: 'Paste' },
        { command: 'Space', title: 'Play/Stop' },
      ]
    }
  })

  return {
    tmpKeyframes: computed(() => state.tmpKeyframes),
    command: computed(() => state.command),
    getEditTransforms(id: string) {
      return editTransforms.value[id] ?? getTransform()
    },
    getEditFrames,
    end: () => cancel(),
    cancel,
    setEditMode,
    select,
    shiftSelect,
    selectFrame,
    shiftSelectFrame,
    rectSelect,
    selectAll,
    mousemove,
    clickAny,
    clickEmpty,
    execDelete,
    execAdd: () => {},
    insert: () => {},
    clip,
    paste,
    duplicate,
    availableCommandList,
    popupMenuList: computed(() => []),
    editedKeyframeMap,
  }
}
