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

import { IVec2 } from 'okageo'
import { computed, ref, watch } from 'vue'
import { useHistoryStore } from './history'
import {
  CanvasCommand,
  CanvasMode,
  CommandExam,
  PopupMenuItem,
  ToolMenuGroup,
} from '/@/composables/modes/types'
import { HistoryStore } from '/@/composables/stores/history'
import { IndexStore, useStore } from '/@/store'
import { AnimationStore, useAnimationStore } from '/@/store/animation'
import { ElementStore, useElementStore } from '/@/store/element'
import {
  addPoseTransform,
  editTransform as applyEditTransform,
  getTransformedBoneMap,
  posedTransform,
} from '/@/utils/armatures'
import { snapAxisGrid, snapPlainGrid } from '/@/utils/geometry'
import { toList } from '/@/utils/commons'
import { useValueStore } from '/@/composables/stores/valueStore'
import { Bone, getTransform, IdMap, toMap, Transform } from '/@/models'

export type AxisGrid = 'x' | 'y'
export interface AxisGridInfo {
  axis: AxisGrid
  local: boolean
  vec: IVec2
  origin: IVec2
}

const IDENTITY_TRANSFORM = getTransform()
const IDENTITY_POSE_TRANSFORM = getTransform({ scale: { x: 0, y: 0 } })

export function createStore(
  historyStore: HistoryStore,
  indexStore: IndexStore,
  elementStore: ElementStore,
  animationStore: AnimationStore
) {
  const canvasModeStore = useValueStore<CanvasMode>(
    'Canvas Mode',
    () => 'object'
  )

  historyStore.defineReducers(canvasModeStore.reducers)

  const pastCanvasMode = ref<CanvasMode>('edit')
  const axisGridInfo = ref<AxisGridInfo>()
  const lastSelectedBoneSpace = ref<{ radian: number; origin: IVec2 }>()
  const editTransform = ref<Transform>()
  const poseTransforms = ref<IdMap<Transform>>({})
  const editTransformType = ref<CanvasCommand>('')

  const canvasMode = canvasModeStore.state

  watch(canvasMode, (_, from) => {
    pastCanvasMode.value = from
  })

  function initState(canvasMode: CanvasMode) {
    canvasModeStore.restore(canvasMode)
    pastCanvasMode.value = canvasMode !== 'edit' ? 'edit' : 'object'
    axisGridInfo.value = undefined
    lastSelectedBoneSpace.value = undefined
  }

  function exportState() {
    return {
      canvasMode: canvasModeStore.createSnapshot(),
    }
  }

  const selectedBonesOrigin = computed(() => {
    if (canvasMode.value === 'edit') {
      return indexStore.selectedBonesOrigin.value
    } else {
      return animationStore.selectedPosedBoneOrigin.value
    }
  })

  const commandExamList = ref<CommandExam[]>()
  function setCommandExams(exams: CommandExam[] = []) {
    commandExamList.value = exams
  }

  const popupMenuInfo = ref<{ items: PopupMenuItem[]; point: IVec2 }>()
  function setPopupMenuList(val?: { items: PopupMenuItem[]; point: IVec2 }) {
    popupMenuInfo.value = val
  }

  const toolMenuGroupList = ref<ToolMenuGroup[]>([])
  function setToolMenuGroups(val: ToolMenuGroup[] = []) {
    toolMenuGroupList.value = val
  }

  const posedBoneMap = computed(() => {
    if (!indexStore.lastSelectedArmature.value) return {}

    if (Object.keys(poseTransforms.value).length > 0) {
      const constraintMap =
        animationStore.currentInterpolatedConstraintMap.value

      return getTransformedBoneMap(
        toMap(
          toList(indexStore.boneMap.value).map((b) => {
            return {
              ...b,
              transform: addPoseTransform(
                animationStore.getCurrentSelfTransforms(b.id),
                getEditPoseTransforms(b.id)
              ),
            }
          })
        ),
        constraintMap
      )
    } else {
      return animationStore.currentPosedBones.value
    }
  })

  const visibledBoneMap = computed(() => {
    if (!indexStore.lastSelectedArmature.value) return {}
    if (canvasMode.value === 'edit') {
      return toMap(
        toList(indexStore.boneMap.value).map((b) => {
          return applyEditTransform(
            b,
            getEditTransforms(b.id),
            indexStore.selectedBones.value[b.id] || {}
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

  const axisGridLine = computed(() => axisGridInfo.value)

  function toggleCanvasMode(ctrl = false) {
    if (ctrl) return ctrlToggleCanvasMode()

    if (canvasMode.value === 'edit') {
      setCanvasMode(pastCanvasMode.value)
    } else {
      setCanvasMode('edit')
    }
  }
  function ctrlToggleCanvasMode() {
    if (canvasMode.value === 'edit') {
      if (pastCanvasMode.value === 'object') {
        setCanvasMode('pose')
      } else {
        setCanvasMode('object')
      }
    } else if (canvasMode.value === 'object') {
      setCanvasMode('pose')
    } else {
      setCanvasMode('object')
    }
  }
  function setCanvasMode(canvasMode: CanvasMode) {
    historyStore.dispatch(canvasModeStore.createUpdateAction(canvasMode))
  }

  function setAxisGridInfo(val: AxisGridInfo | undefined) {
    axisGridInfo.value = val
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

  function getEditTransforms(id: string): Transform {
    const t = editTransform.value
    return t && indexStore.selectedBones.value[id] ? t : IDENTITY_TRANSFORM
  }

  function getEditPoseTransforms(id: string): Transform {
    if (canvasMode.value !== 'pose') return IDENTITY_POSE_TRANSFORM
    return poseTransforms.value[id] ?? IDENTITY_POSE_TRANSFORM
  }

  function changeCanvasMode(canvasMode: CanvasMode) {
    if (canvasMode === 'weight') {
      if (elementStore.lastSelectedActor.value) {
        setCanvasMode(canvasMode)
      }
    } else {
      if (indexStore.lastSelectedArmature.value) {
        setCanvasMode(canvasMode)
      } else {
        setCanvasMode('object')
      }
    }
  }

  function completeEditTransform() {
    const t = editTransform.value
    if (!t) return

    indexStore.updateBones(
      Object.keys(indexStore.selectedBones.value).reduce<IdMap<Bone>>(
        (m, id) => {
          m[id] = applyEditTransform(
            indexStore.boneMap.value[id],
            t,
            indexStore.selectedBones.value[id]
          )
          return m
        },
        {}
      )
    )
    setEditTransform()
  }

  function setEditTransform(val?: Transform, type: CanvasCommand = '') {
    editTransform.value = val
    editTransformType.value = type
  }

  function completePoseTransforms() {
    animationStore.applyEditedTransforms(poseTransforms.value)
    setPoseTransforms()
  }

  function setPoseTransforms(val?: IdMap<Transform>, type: CanvasCommand = '') {
    poseTransforms.value = val ?? {}
    editTransformType.value = type
  }

  return {
    initState,
    exportState,

    canvasMode,
    editTransformType: computed(() => editTransformType.value),
    selectedBonesOrigin,
    changeCanvasMode,
    toggleCanvasMode,

    snapScaleDiff,
    snapTranslate,
    axisGridLine,
    setAxisGridInfo,

    getEditTransforms,
    getEditPoseTransforms,

    commandExamList: computed(() => commandExamList.value),
    setCommandExams,
    popupMenuList: computed(() => popupMenuInfo.value?.items ?? []),
    popupMenuInfo: computed(() => popupMenuInfo.value),
    setPopupMenuList,
    toolMenuGroupList: computed(() => toolMenuGroupList.value),
    setToolMenuGroups,

    posedBoneMap,
    visibledBoneMap,
    lastSelectedBoneSpace: computed(() => lastSelectedBoneSpace.value),

    setEditTransform,
    completeEditTransform,

    completePoseTransforms,
    setPoseTransforms,
  }
}

export type CanvasStore = ReturnType<typeof createStore>

const store = createStore(
  useHistoryStore(),
  useStore(),
  useElementStore(),
  useAnimationStore()
)
export function useCanvasStore(): CanvasStore {
  return store
}
