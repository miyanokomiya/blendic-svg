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
import { computed, ref } from 'vue'
import { useStore } from '.'
import {
  getAddItem,
  getDeleteItem,
  getSelectItem,
  useListState,
} from '../composables/listState'
import {
  findNextFrameWithKeyframe,
  findPrevFrameWithKeyframe,
  getKeyframeMapByTargetId,
  getKeyframeMapByFrame,
  mergeKeyframesWithDropped,
  slideKeyframesTo,
} from '../utils/animations'
import {
  convolutePoseTransforms,
  getPosedBoneHeadsOrigin,
  getPoseSelectedBones,
  getTransformedBoneMap,
  invertPoseTransform,
  multiPoseTransform,
} from '../utils/armatures'
import {
  dropMap,
  mapFilter,
  extractMap,
  flatKeyListMap,
  mapReduce,
  toList,
} from '../utils/commons'
import { getNextName } from '../utils/relations'
import { HistoryItem, useHistoryStore } from './history'
import { useAnimationFrameStore } from '/@/composables/stores/animationFrame'
import {
  TargetProps,
  TargetPropsState,
  useTargetProps,
} from '/@/composables/targetProps'
import {
  Action,
  Bone,
  getAction,
  getTransform,
  IdMap,
  toTargetIdMap,
  toMap,
  Transform,
  isBoneSelected,
} from '/@/models'
import {
  getKeyframeBone,
  getKeyframePoint,
  KeyframeBase,
  KeyframeBone,
  KeyframeSelectedState,
} from '/@/models/keyframe'
import { convolute } from '/@/utils/histories'
import {
  deleteKeyframeByProp,
  getAllSelectedState,
  getKeyframeDefaultPropsMap,
  isAllExistSelected,
} from '/@/utils/keyframes'
import { getInterpolatedTransformMapByTargetId } from '/@/utils/keyframes/keyframeBone'

const actions = useListState<Action>('Action')
const editTransforms = ref<IdMap<Transform>>({})
const selectedKeyframeMap = ref<IdMap<KeyframeSelectedState>>({})
const lastSelectedKeyframeId = ref('')

const historyStore = useHistoryStore()
const store = useStore()

const targetPropsState = useTargetProps()
const animationFrameStore = useAnimationFrameStore()

function initState(initActions: Action[] = []) {
  actions.state.list = initActions
  editTransforms.value = {}
  selectedKeyframeMap.value = {}
  lastSelectedKeyframeId.value = ''
  targetPropsState.filter().redo()
}

const keyframeList = computed(() => {
  return actions.lastSelectedItem.value?.keyframes ?? []
})

const keyframeMapByFrame = computed(() => {
  return getKeyframeMapByFrame(keyframeList.value)
})

const keyframeMapByTargetId = computed(() => {
  return getKeyframeMapByTargetId(keyframeList.value)
})

const visibledKeyframeMapByTargetId = computed(() => {
  return extractMap(keyframeMapByTargetId.value, selectedBoneIdMap.value)
})

const visibledKeyframeMap = computed(() => {
  return toMap(flatKeyListMap(visibledKeyframeMapByTargetId.value))
})

const visibledSelectedKeyframeMap = computed(() => {
  return extractMap(visibledKeyframeMap.value, selectedKeyframeMap.value)
})
const isAnyVisibledSelectedKeyframe = computed(() => {
  return Object.keys(visibledSelectedKeyframeMap.value).length > 0
})

const lastSelectedKeyframe = computed(() => {
  return visibledSelectedKeyframeMap.value[lastSelectedKeyframeId.value]
})

const visibledTargetPropsStateMap = computed(() => {
  return extractMap(
    targetPropsState.selectedStateMap.value,
    store.state.selectedBones
  )
})

const currentInterpolatedTransformMapByTargetId = computed(
  (): IdMap<Transform> => {
    return getInterpolatedTransformMapByTargetId(
      keyframeMapByTargetId.value,
      animationFrameStore.currentFrame.value
    )
  }
)

const posedTargetIds = computed(() => {
  return Array.from(
    new Set(
      Object.keys(editTransforms.value).concat(
        Object.keys(keyframeMapByTargetId.value)
      )
    )
  )
})

const currentSelfTransforms = computed(
  (): IdMap<Transform> => {
    return posedTargetIds.value.reduce<IdMap<Transform>>((p, id) => {
      p[id] = convolutePoseTransforms([
        currentInterpolatedTransform(id),
        getBoneEditedTransforms(id),
      ])
      return p
    }, {})
  }
)

const currentPosedBones = computed(
  (): IdMap<Bone> => {
    if (!store.lastSelectedArmature.value) return {}
    return getTransformedBoneMap(
      toMap(
        store.lastSelectedArmature.value.bones.map((b) => {
          return {
            ...b,
            transform: getCurrentSelfTransforms(b.id),
          }
        })
      )
    )
  }
)

const selectedBoneIdMap = computed(() => {
  return mapReduce(
    mapFilter(store.state.selectedBones, (s) => isBoneSelected(s)),
    () => true
  )
})
const selectedBoneMap = computed(() => {
  return mapReduce(selectedBoneIdMap.value, (_, id) => store.boneMap.value[id])
})

const selectedBones = computed(() => {
  return getPoseSelectedBones(
    currentPosedBones.value,
    store.state.selectedBones
  )
})

const selectedPosedBoneOrigin = computed(
  (): IVec2 => {
    if (!store.lastSelectedArmature.value) return { x: 0, y: 0 }
    return getPosedBoneHeadsOrigin(selectedBones.value)
  }
)

function setEditedTransforms(mapByTargetId: IdMap<Transform>) {
  const item = getUpdateEditedTransformsItem(mapByTargetId)
  historyStore.push(item, true)
}
function applyEditedTransforms(mapByTargetId: IdMap<Transform>) {
  setEditedTransforms(
    mapReduce({ ...editTransforms.value, ...mapByTargetId }, (_p, id) => {
      return convolutePoseTransforms([
        getBoneEditedTransforms(id),
        mapByTargetId[id] ?? getTransform(),
      ])
    })
  )
}
function pastePoses(mapByTargetId: IdMap<Transform>, seriesKey?: string) {
  const item = getUpdateEditedTransformsItem(
    {
      ...editTransforms.value,
      ...mapReduce(
        mapFilter(mapByTargetId, (_, targetId) => {
          // drop poses of unexisted bones
          return !!store.boneMap.value[targetId]
        }),
        (t, targetId) => {
          // invert keyframe's pose & paste the pose
          return multiPoseTransform(
            t,
            invertPoseTransform(currentInterpolatedTransform(targetId))
          )
        }
      ),
    },
    'Paste Pose',
    seriesKey
  )
  historyStore.push(item, true)
}

function currentInterpolatedTransform(targetId: string): Transform {
  return (
    currentInterpolatedTransformMapByTargetId.value[targetId] ?? getTransform()
  )
}
function getBoneEditedTransforms(targetId: string): Transform {
  return editTransforms.value[targetId] ?? getTransform()
}
function getCurrentSelfTransforms(targetId: string): Transform {
  return currentSelfTransforms.value[targetId] ?? getTransform()
}

function updateCurrentFrame(frameItem?: HistoryItem) {
  if (frameItem) {
    const item = convolute(frameItem, [getUpdateEditedTransformsItem({})])
    historyStore.push(item, true)
  }
}
function setCurrentFrame(val: number, seriesKey?: string) {
  updateCurrentFrame(animationFrameStore.setCurrentFrame(val, seriesKey))
}
function jumpStartFrame() {
  updateCurrentFrame(animationFrameStore.jumpStartFrame())
}
function jumpEndFrame() {
  updateCurrentFrame(animationFrameStore.jumpEndFrame())
}
function stepFrame(tickFrame: number, reverse = false, seriesKey?: string) {
  updateCurrentFrame(
    animationFrameStore.stepFrame(tickFrame, reverse, seriesKey)
  )
}
function jumpNextKey() {
  setCurrentFrame(
    findNextFrameWithKeyframe(
      keyframeList.value,
      animationFrameStore.currentFrame.value
    )
  )
}
function jumpPrevKey() {
  setCurrentFrame(
    findPrevFrameWithKeyframe(
      keyframeList.value,
      animationFrameStore.currentFrame.value
    )
  )
}

function setEndFrame(next: number, seriesKey?: string) {
  const item = animationFrameStore.setEndFrame(next, seriesKey)
  historyStore.push(item, true)
}

function selectAction(id: string) {
  if (actions.state.lastSelectedId === id) return

  const item = convolute(getSelectItem(actions.state, id), [
    getSelectKeyframesItem([]),
  ])
  historyStore.push(item, true)
}
function addAction() {
  if (!store.lastSelectedArmature.value) return

  const item = convolute(
    getAddItem(
      actions.state,
      getAction(
        {
          name: getNextName(
            'action',
            actions.state.list.map((a) => a.name)
          ),
          armatureId: store.lastSelectedArmature.value.id,
        },
        true
      )
    ),
    [getSelectKeyframesItem([])]
  )
  historyStore.push(item, true)
}
function deleteAction() {
  if (!actions.lastSelectedItem.value) return

  const item = convolute(
    getDeleteItem(actions.state, actions.lastSelectedIndex.value),
    [getSelectKeyframesItem([])]
  )
  historyStore.push(item, true)
}

function selectKeyframe(
  keyframeId: string,
  selectedState?: KeyframeSelectedState,
  shift = false
) {
  if (!keyframeId && !isAnyVisibledSelectedKeyframe.value) return

  const item = getSelectKeyframeItem(keyframeId, selectedState, shift)
  historyStore.push(item, true)
}
function selectKeyframeByFrame(frame: number, shift = false) {
  const frames = keyframeMapByFrame.value[frame]
  if (frames.length === 0) return

  const item = getSelectKeyframesItem(
    frames.map((f) => f.id),
    shift
  )
  historyStore.push(item, true)
}
function selectAllKeyframes() {
  if (
    Object.keys(visibledSelectedKeyframeMap.value).length ===
      Object.keys(visibledKeyframeMap.value).length &&
    Object.keys(visibledSelectedKeyframeMap.value).every((key) =>
      isAllExistSelected(
        visibledKeyframeMap.value[key],
        selectedKeyframeMap.value[key]
      )
    )
  ) {
    if (isAnyVisibledSelectedKeyframe.value) {
      selectKeyframe('')
    }
  } else {
    const item = getSelectAllKeyframesItem()
    historyStore.push(item, true)
  }
}
function execInsertKeyframe(
  options: {
    useTranslate?: boolean
    useRotate?: boolean
    useScale?: boolean
  } = {}
) {
  if (Object.keys(selectedBoneIdMap.value).length === 0) return
  if (!actions.lastSelectedItem.value) {
    addAction()
  }

  const keyframes = Object.keys(selectedBoneIdMap.value).map((targetId) => {
    const t = getCurrentSelfTransforms(targetId)
    return getKeyframeBone(
      {
        frame: animationFrameStore.currentFrame.value,
        targetId,
        points: {
          ...(options.useTranslate
            ? {
                translateX: getKeyframePoint({ value: t.translate.x }),
                translateY: getKeyframePoint({ value: t.translate.y }),
              }
            : {}),
          ...(options.useRotate
            ? {
                rotate: getKeyframePoint({ value: t.rotate }),
              }
            : {}),
          ...(options.useScale
            ? {
                scaleX: getKeyframePoint({ value: t.scale.x }),
                scaleY: getKeyframePoint({ value: t.scale.y }),
              }
            : {}),
        },
      },
      true
    )
  })

  const item = getExecInsertKeyframeItem(keyframes)
  historyStore.push(item, true)
}
function execDeleteKeyframes() {
  if (!isAnyVisibledSelectedKeyframe.value) return

  const item = getExecDeleteKeyframesItem()
  historyStore.push(item, true)
}
function execUpdateKeyframes(
  keyframes: IdMap<KeyframeBase>,
  seriesKey?: string
) {
  const item = getExecUpdateKeyframeItem(
    keyframes as IdMap<KeyframeBone>,
    seriesKey
  )
  historyStore.push(item, true)
}
function pasteKeyframes(keyframeList: KeyframeBase[]) {
  const item = getExecInsertKeyframeItem(
    slideKeyframesTo(
      (keyframeList as KeyframeBone[])
        .filter((k) => store.boneMap.value[k.targetId])
        .map((k) => getKeyframeBone(k, true)),
      animationFrameStore.currentFrame.value
    )
  )
  historyStore.push(item, true)
}
function completeDuplicateKeyframes(
  duplicatedKeyframeList: KeyframeBase[],
  updatedKeyframeList: KeyframeBase[]
) {
  const item = getCompleteDuplicateKeyframesItem(
    duplicatedKeyframeList as KeyframeBone[],
    updatedKeyframeList as KeyframeBone[]
  )
  historyStore.push(item, true)
}

function selectTargetProp(
  targetId: string,
  propsState: TargetPropsState,
  shift = false
) {
  const item = targetPropsState.select(targetId, propsState, shift)
  historyStore.push(item, true)
}

export function useAnimationStore() {
  return {
    initState,
    actions: computed(() => actions.state.list),
    selectedKeyframeMap,
    lastSelectedKeyframe,
    keyframeMapByFrame,
    keyframeMapByTargetId,
    visibledKeyframeMap,
    visibledSelectedKeyframeMap,

    visibledTargetPropsStateMap,

    posedTargetIds,
    currentPosedBones,
    selectedBoneIdMap,
    selectedBoneMap,
    selectedBones,
    selectedPosedBoneOrigin,
    getCurrentSelfTransforms,

    applyEditedTransforms,
    pastePoses,

    playing: animationFrameStore.playing,
    setPlaying: animationFrameStore.setPlaying,
    togglePlaying: animationFrameStore.togglePlaying,

    currentFrame: animationFrameStore.currentFrame,
    setCurrentFrame,
    jumpStartFrame,
    jumpEndFrame,
    jumpNextKey,
    jumpPrevKey,
    stepFrame,

    endFrame: animationFrameStore.endFrame,
    setEndFrame,

    selectedAction: actions.lastSelectedItem,
    selectAction,
    addAction,
    deleteAction,
    updateAction: (action: Partial<Action>) => actions.updateItem(action),

    selectKeyframe,
    selectKeyframeByFrame,
    selectAllKeyframes,
    execInsertKeyframe,
    execDeleteKeyframes,
    execUpdateKeyframes,
    pasteKeyframes,
    completeDuplicateKeyframes,

    selectTargetProp,
  }
}

function getUpdateEditedTransformsItem(
  val: IdMap<Transform>,
  name = 'Update Pose',
  seriesKey?: string
): HistoryItem {
  const current = { ...editTransforms.value }

  const redo = () => {
    editTransforms.value = val
  }
  return {
    name,
    undo: () => {
      editTransforms.value = current
    },
    redo,
    seriesKey,
  }
}

function resetLastSelectedKeyframeId() {
  lastSelectedKeyframeId.value = Object.keys(selectedKeyframeMap.value)[0] ?? ''
}

function getSelectAllKeyframesItem(): HistoryItem {
  const current = { ...selectedKeyframeMap.value }
  const currentLast = lastSelectedKeyframeId.value

  const targetPropsItem = getSelectAllTargetPropsItem(
    toTargetIdMap(toList(visibledKeyframeMap.value)),
    (id) =>
      getKeyframeDefaultPropsMap(() => true, visibledKeyframeMap.value[id].name)
        .props
  )

  const redo = () => {
    selectedKeyframeMap.value = {
      ...selectedKeyframeMap.value,
      ...mapReduce(visibledKeyframeMap.value, (keyframe) =>
        getAllSelectedState(keyframe)
      ),
    }
    resetLastSelectedKeyframeId()
    targetPropsItem.redo()
  }
  return {
    name: 'Select All Keyframe',
    undo: () => {
      selectedKeyframeMap.value = { ...current }
      lastSelectedKeyframeId.value = currentLast
      targetPropsItem.undo()
    },
    redo,
  }
}
function getSelectKeyframesItem(ids: string[], shift = false): HistoryItem {
  const current = { ...selectedKeyframeMap.value }
  const currentLast = lastSelectedKeyframeId.value

  // TODO: select correct props
  const targetPropsItem = targetPropsState.clear(
    ids.length === 0 ? toTargetIdMap(toList(visibledKeyframeMap.value)) : {}
  )

  const redo = () => {
    if (shift) {
      const dropIds: IdMap<boolean> = {}
      const idMap: IdMap<KeyframeSelectedState> = {}
      ids.forEach((id) => {
        if (
          isAllExistSelected(
            visibledKeyframeMap.value[id],
            selectedKeyframeMap.value[id]
          )
        ) {
          dropIds[id] = true
        } else {
          idMap[id] = getAllSelectedState(visibledKeyframeMap.value[id])
        }
      })
      selectedKeyframeMap.value = dropMap(
        { ...selectedKeyframeMap.value, ...idMap },
        dropIds
      )
    } else {
      const idMap = ids.reduce<IdMap<KeyframeSelectedState>>((p, id) => {
        p[id] = getAllSelectedState(visibledKeyframeMap.value[id])
        return p
      }, {})
      selectedKeyframeMap.value =
        ids.length > 0
          ? {
              ...dropMap(selectedKeyframeMap.value, visibledKeyframeMap.value),
              ...idMap,
            }
          : dropMap(selectedKeyframeMap.value, visibledKeyframeMap.value)
    }
    resetLastSelectedKeyframeId()
    targetPropsItem.redo()
  }
  return {
    name: 'Select Keyframe',
    undo: () => {
      selectedKeyframeMap.value = { ...current }
      lastSelectedKeyframeId.value = currentLast
      targetPropsItem.undo()
    },
    redo,
  }
}

function getSelectAllTargetPropsItem(
  keyframeMapByTargetId: IdMap<KeyframeBase>,
  getProps: (id: string) => TargetProps['props']
) {
  return targetPropsState.selectAll(
    Object.keys(keyframeMapByTargetId).reduce<
      Parameters<typeof targetPropsState.selectAll>[0]
    >((p, targetId) => {
      const k = keyframeMapByTargetId[targetId]
      p[targetId] = { id: targetId, props: getProps(k.id) }
      return p
    }, {})
  )
}

function getSelectKeyframesPropsItem(
  keyframeMap: IdMap<KeyframeBase>
): HistoryItem {
  const current = { ...selectedKeyframeMap.value }
  const currentLast = lastSelectedKeyframeId.value

  const selectedStateMap = mapReduce(keyframeMap, (k) => {
    return {
      name: k.name,
      props: mapReduce(k.points, () => true),
    }
  })
  const targetPropsClearItem = targetPropsState.clear(
    toTargetIdMap(toList(visibledKeyframeMap.value))
  )

  const redo = () => {
    selectedKeyframeMap.value = selectedStateMap
    resetLastSelectedKeyframeId()
    targetPropsClearItem.redo()
    getSelectAllTargetPropsItem(
      toTargetIdMap(toList(keyframeMap)),
      (id) => selectedStateMap[id]?.props ?? {}
    ).redo()
  }
  return {
    name: 'Select Keyframe',
    undo: () => {
      selectedKeyframeMap.value = { ...current }
      lastSelectedKeyframeId.value = currentLast
      targetPropsClearItem.undo()
    },
    redo,
  }
}

function getSelectKeyframeItem(
  id: string,
  selectedState?: KeyframeSelectedState,
  shift = false
): HistoryItem {
  const current = { ...selectedKeyframeMap.value }
  const currentLast = lastSelectedKeyframeId.value
  const keyframe = visibledKeyframeMap.value[id]

  const propsItem = !id
    ? targetPropsState.clear(toTargetIdMap(toList(visibledKeyframeMap.value)))
    : targetPropsState.select(
        keyframe.targetId,
        {
          id: keyframe.targetId,
          props: mapReduce(
            (selectedState ?? getAllSelectedState(keyframe)).props,
            () => 'selected'
          ),
        },
        shift,
        true
      )

  const redo = () => {
    if (shift) {
      if (id) {
        selectedKeyframeMap.value = {
          ...selectedKeyframeMap.value,
          [id]:
            selectedState ?? getAllSelectedState(visibledKeyframeMap.value[id]),
        }
      }
      lastSelectedKeyframeId.value = id
    } else {
      selectedKeyframeMap.value = {
        ...dropMap(selectedKeyframeMap.value, visibledKeyframeMap.value),
        ...(selectedState ? { [id]: selectedState } : {}),
      }
      lastSelectedKeyframeId.value = selectedState ? id : ''
    }
    propsItem.redo()
  }
  return {
    name: 'Select Keyframe',
    undo: () => {
      selectedKeyframeMap.value = { ...current }
      lastSelectedKeyframeId.value = currentLast
      propsItem.undo()
    },
    redo,
  }
}

function getExecInsertKeyframeItem(
  keyframes: KeyframeBone[],
  replace = false,
  notSelect = false
) {
  const preFrame = animationFrameStore.currentFrame.value
  const insertedKeyframes = keyframes
  const preEditTransforms = { ...editTransforms.value }

  const selectItem = !notSelect
    ? getSelectKeyframesPropsItem(toMap(keyframes))
    : undefined

  const { dropped } = mergeKeyframesWithDropped(
    actions.lastSelectedItem.value!.keyframes,
    insertedKeyframes,
    !replace
  )

  const redo = () => {
    const { merged } = mergeKeyframesWithDropped(
      actions.lastSelectedItem.value!.keyframes,
      insertedKeyframes,
      !replace
    )
    actions.lastSelectedItem.value!.keyframes = merged
    editTransforms.value = dropMap(
      editTransforms.value,
      toTargetIdMap(insertedKeyframes)
    )
    selectItem?.redo()
  }
  return {
    name: 'Insert Keyframe',
    undo: () => {
      const reverted = toList({
        ...dropMap(
          toMap(actions.lastSelectedItem.value!.keyframes),
          toMap(insertedKeyframes)
        ),
        ...toMap(dropped),
      })
      actions.lastSelectedItem.value!.keyframes = reverted
      animationFrameStore.setCurrentFrame(preFrame)?.redo()
      editTransforms.value = preEditTransforms
      selectItem?.undo()
    },
    redo,
  }
}

function getExecDeleteKeyframesItem() {
  const deletedFrames = { ...visibledSelectedKeyframeMap.value }
  const selectItem = getSelectKeyframesItem([])

  const redo = () => {
    const deletedMap = mapReduce(deletedFrames, (keyframe) => {
      return deleteKeyframeByProp(
        keyframe,
        selectedKeyframeMap.value[keyframe.id]
      )
    })
    const updated = toList({
      ...toMap(actions.lastSelectedItem.value!.keyframes),
      ...deletedMap,
    }).filter((k): k is KeyframeBone => !!k)

    selectItem.redo()
    actions.lastSelectedItem.value!.keyframes = updated
  }
  return {
    name: 'Delete Keyframes',
    undo: () => {
      const reverted = actions.lastSelectedItem.value!.keyframes.concat(
        toList(deletedFrames)
      )
      actions.lastSelectedItem.value!.keyframes = reverted
      selectItem.undo()
    },
    redo,
  }
}

function getExecUpdateKeyframeItem(
  keyframes: IdMap<KeyframeBone>,
  seriesKey?: string
) {
  const { dropped } = mergeKeyframesWithDropped(
    actions.lastSelectedItem.value!.keyframes,
    toList(keyframes),
    true
  )

  const redo = () => {
    const { merged } = mergeKeyframesWithDropped(
      actions.lastSelectedItem.value!.keyframes,
      toList(keyframes),
      true
    )
    actions.lastSelectedItem.value!.keyframes = merged
  }
  return {
    name: 'Update Keyframe',
    undo: () => {
      const { merged } = mergeKeyframesWithDropped(
        actions.lastSelectedItem.value!.keyframes,
        dropped,
        true
      )
      actions.lastSelectedItem.value!.keyframes = merged
    },
    redo,
    seriesKey,
  }
}

function getCompleteDuplicateKeyframesItem(
  duplicatedKeyframeList: KeyframeBone[],
  updatedKeyframeList: KeyframeBone[]
) {
  const duplicatItem = getExecInsertKeyframeItem(
    duplicatedKeyframeList,
    true,
    true
  )
  const updateItem = getExecUpdateKeyframeItem(toMap(updatedKeyframeList))

  return {
    name: 'Duplicate Keyframe',
    undo: () => {
      updateItem.undo()
      duplicatItem.undo()
    },
    redo: () => {
      duplicatItem.redo()
      updateItem.redo()
    },
  }
}
