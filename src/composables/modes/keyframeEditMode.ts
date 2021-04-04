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

import { reactive, computed, ComputedRef, ref } from 'vue'
import { Transform, getTransform, IdMap, toMap } from '/@/models/index'
import {
  KeyframeEditCommand,
  KeyframeEditModeBase,
  EditMovement,
  PopupMenuItem,
} from '/@/composables/modes/types'
import { useAnimationStore } from '/@/store/animation'
import { extractMap, mapReduce, toList } from '/@/utils/commons'
import { getFrameX, getNearestFrameAtPoint } from '/@/utils/animations'
import { getCtrlOrMetaStr } from '/@/utils/devices'
import { applyTransform } from '/@/utils/geometry'
import {
  CurveName,
  CurveSelectedState,
  getCurve,
  getKeyframeBone,
  KeyframeBase,
} from '/@/models/keyframe'
import { batchUpdatePoints, splitKeyframeBySelected } from '/@/utils/keyframes'
import { curveItems } from '/@/utils/keyframes/core'
import { IVec2, sub } from 'okageo'
import { useSettings } from '/@/composables/settings'
import { pointToControl, moveCurveControlsMap } from '/@/utils/graphCurves'

interface State {
  command: KeyframeEditCommand
  editMovement: EditMovement | undefined
  clipboard: KeyframeBase[] | undefined
  tmpKeyframes: IdMap<KeyframeBase> | undefined
  selectedControlMap: IdMap<IdMap<CurveSelectedState>> | undefined
}

export interface KeyframeEditMode extends KeyframeEditModeBase {
  tmpKeyframes: ComputedRef<IdMap<KeyframeBase> | undefined>
  selectFrame: (frame: number) => void
  shiftSelectFrame: (frame: number) => void
  editedKeyframeMap: ComputedRef<
    | {
        selected: IdMap<KeyframeBase>
        notSelected: IdMap<KeyframeBase>
      }
    | undefined
  >
}

export function useKeyframeEditMode(): KeyframeEditMode {
  const state = reactive<State>({
    command: '',
    editMovement: undefined,
    clipboard: undefined,
    tmpKeyframes: undefined,
    selectedControlMap: undefined,
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
    state.tmpKeyframes = undefined
    state.selectedControlMap = undefined
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

  function upLeft() {
    if (
      state.command === 'grab-control' ||
      state.command === 'grab-current-frame'
    ) {
      cancel()
    }
  }

  function setEditMode(mode: KeyframeEditCommand) {
    if (!isAnySelected.value) return

    cancel()
    state.command = mode
  }

  const editTransforms = computed(() => {
    if (!state.editMovement) return undefined

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
    if (!editTransforms.value) return

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

  const editedKeyframeMap = computed<
    | {
        selected: IdMap<KeyframeBase>
        notSelected: IdMap<KeyframeBase>
      }
    | undefined
  >(() => {
    if (state.command !== 'grab') return

    return {
      selected: mapReduce(
        keyframeSelectedInfoSet.value.selected,
        (keyframe, id) => {
          return {
            ...keyframe,
            frame: getEditFrames(id)!,
          }
        }
      ),
      notSelected: keyframeSelectedInfoSet.value.notSelected,
    }
  })

  function completeEdit() {
    if (!isAnySelected.value) return

    if (editedKeyframeMap.value) {
      if (state.tmpKeyframes) {
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
    }

    state.tmpKeyframes = undefined
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

  function selectAll() {
    if (state.command) {
      cancel()
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
      cancel()
      return
    }
    animationStore.execDeleteKeyframes()
  }

  function getEditFrames(id: string): number | undefined {
    return (
      (editFrames.value ? editFrames.value[id] : undefined) ??
      allKeyframes.value[id]?.frame ??
      (state.tmpKeyframes ? state.tmpKeyframes[id].frame : undefined)
    )
  }

  function clip() {
    state.clipboard = toList(keyframeSelectedInfoSet.value.selected)
  }

  function paste() {
    if (!state.clipboard) return
    animationStore.pasteKeyframes(state.clipboard)
  }

  function duplicate() {
    if (state.command) {
      cancel()
      return
    }

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
        { command: 't', title: 'Interpolation' },
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

  const lastSelectedCurveName = ref('constant')

  function setInterpolation(curveName: CurveName) {
    const selectedState = animationStore.selectedKeyframeMap.value
    animationStore.execUpdateKeyframes(
      batchUpdatePoints(
        extractMap(editTargets.value, selectedState),
        selectedState,
        (p) => ({ ...p, curve: getCurve(curveName) })
      )
    )
    lastSelectedCurveName.value = curveName
    state.command = ''
  }

  const popupMenuList = computed<PopupMenuItem[]>(() => {
    switch (state.command) {
      case 'interpolation':
        return curveItems.map((item) => ({
          label: item.label,
          exec: () => setInterpolation(item.name),
          focus: item.name === lastSelectedCurveName.value,
        }))
      default:
        return []
    }
  })

  function grabControl(
    keyframeId: string,
    pointKey: string,
    controls: CurveSelectedState
  ) {
    if (state.command) {
      completeEdit()
      return
    }

    state.selectedControlMap = {
      [keyframeId]: {
        [pointKey]: controls,
      },
    }
    state.command = 'grab-control'
    seriesKey.value = `grab-control_${Date.now()}`
  }

  const seriesKey = ref<string>()

  function grabCurrentFrame() {
    if (state.command) {
      completeEdit()
      return
    }

    state.command = 'grab-current-frame'
    seriesKey.value = `grab-current-frame_${Date.now()}`
  }

  const { settings } = useSettings()

  function viewToControl(v: IVec2): IVec2 {
    return pointToControl(v, settings.graphValueWidth)
  }

  function drag(arg: EditMovement) {
    if (state.command === 'grab-current-frame') {
      animationStore.setCurrentFrame(
        getNearestFrameAtPoint(arg.current.x),
        seriesKey.value
      )
      state.editMovement = arg
    } else if (state.command === 'grab-control') {
      if (state.editMovement) {
        const diff = viewToControl(sub(arg.current, state.editMovement.current))

        if (state.selectedControlMap) {
          const updatedMap = moveCurveControlsMap(
            animationStore.visibledKeyframeMap.value,
            state.selectedControlMap,
            diff
          )
          animationStore.execUpdateKeyframes(updatedMap, seriesKey.value)
        }
      }
      state.editMovement = arg
    }
  }

  return {
    tmpKeyframes: computed(() => state.tmpKeyframes),
    command: computed(() => state.command),
    end: () => cancel(),
    cancel,
    setEditMode,
    select,
    shiftSelect,
    selectFrame,
    shiftSelectFrame,
    selectAll,
    mousemove,
    drag,
    clickAny,
    clickEmpty,
    upLeft,
    execDelete,
    clip,
    paste,
    duplicate,
    availableCommandList,
    popupMenuList,
    editedKeyframeMap,
    grabCurrentFrame,
    grabControl,
  }
}
