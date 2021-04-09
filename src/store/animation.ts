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
  PlayState,
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
import {
  deleteKeyframeByProp,
  getAllSelectedState,
  getKeyframeDefaultPropsMap,
  isAllExistSelected,
} from '/@/utils/keyframes'
import { getInterpolatedTransformMapByTargetId } from '/@/utils/keyframes/keyframeBone'

const playing = ref<PlayState>('pause')
const currentFrame = ref(0)
const endFrame = ref(60)
const actions = useListState<Action>('Action')
const editTransforms = ref<IdMap<Transform>>({})
const selectedKeyframeMap = ref<IdMap<KeyframeSelectedState>>({})
const lastSelectedKeyframeId = ref('')

const historyStore = useHistoryStore()
const store = useStore()

const targetPropsState = useTargetProps()

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
      currentFrame.value
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

function setEndFrame(val: number, seriesKey?: string) {
  if (endFrame.value === val) return

  const item = getUpdateEndFrameItem(val, seriesKey)
  item.redo()
  historyStore.push(item)
}

function setEditedTransforms(mapByTargetId: IdMap<Transform>) {
  const item = getUpdateEditedTransformsItem(mapByTargetId)
  item.redo()
  historyStore.push(item)
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
  item.redo()
  historyStore.push(item)
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

function setCurrentFrame(val: number, seriesKey?: string) {
  if (currentFrame.value === val) return

  const item = getUpdateCurrentFrameItem(val, seriesKey)
  item.redo()
  historyStore.push(item)
}

function setPlaying(val: PlayState) {
  playing.value = val
}
function togglePlaying() {
  playing.value = playing.value === 'pause' ? 'play' : 'pause'
}
function jumpStartFrame() {
  setCurrentFrame(0)
}
function jumpEndFrame() {
  setCurrentFrame(endFrame.value)
}
function jumpNextKey() {
  setCurrentFrame(
    findNextFrameWithKeyframe(keyframeList.value, currentFrame.value)
  )
}
function jumpPrevKey() {
  setCurrentFrame(
    findPrevFrameWithKeyframe(keyframeList.value, currentFrame.value)
  )
}
function stepFrame(tickFrame: number, reverse = false, seriesKey?: string) {
  if (endFrame.value === 0) return

  if (reverse) {
    const val = currentFrame.value - tickFrame
    setCurrentFrame(val <= 0 ? endFrame.value : val, seriesKey)
  } else {
    const val = currentFrame.value + tickFrame
    setCurrentFrame(endFrame.value <= val ? 0 : val, seriesKey)
  }
  editTransforms.value = {}
}

function selectAction(id: string) {
  if (actions.state.lastSelectedId === id) return

  const item = getSelectActionItem(id)
  item.redo()
  historyStore.push(item)
}
function addAction() {
  if (!store.lastSelectedArmature.value) return

  const action = getAction(
    {
      name: getNextName(
        'action',
        actions.state.list.map((a) => a.name)
      ),
      armatureId: store.lastSelectedArmature.value.id,
    },
    true
  )
  const item = getAddActionItem(action)
  item.redo()
  historyStore.push(item)
}
function deleteAction() {
  if (!actions.lastSelectedItem.value) return

  const item = getDeleteActionItem()
  item.redo()
  historyStore.push(item)
}

function selectKeyframe(
  keyframeId: string,
  selectedState?: KeyframeSelectedState,
  shift = false
) {
  if (!keyframeId && !isAnyVisibledSelectedKeyframe.value) return

  const item = getSelectKeyframeItem(keyframeId, selectedState, shift)
  item.redo()
  historyStore.push(item)
}
function selectKeyframeByFrame(frame: number, shift = false) {
  const frames = keyframeMapByFrame.value[frame]
  if (frames.length === 0) return

  const item = getSelectKeyframesItem(
    frames.map((f) => f.id),
    shift
  )
  item.redo()
  historyStore.push(item)
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
    item.redo()
    historyStore.push(item)
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
        frame: currentFrame.value,
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
  item.redo()
  historyStore.push(item)
}
function execDeleteKeyframes() {
  if (!isAnyVisibledSelectedKeyframe.value) return

  const item = getExecDeleteKeyframesItem()
  item.redo()
  historyStore.push(item)
}
function execUpdateKeyframes(
  keyframes: IdMap<KeyframeBase>,
  seriesKey?: string
) {
  const item = getExecUpdateKeyframeItem(
    keyframes as IdMap<KeyframeBone>,
    seriesKey
  )
  item.redo()
  historyStore.push(item)
}
function pasteKeyframes(keyframeList: KeyframeBase[]) {
  const item = getExecInsertKeyframeItem(
    slideKeyframesTo(
      (keyframeList as KeyframeBone[])
        .filter((k) => store.boneMap.value[k.targetId])
        .map((k) => getKeyframeBone(k, true)),
      currentFrame.value
    )
  )
  item.redo()
  historyStore.push(item)
}
function completeDuplicateKeyframes(
  duplicatedKeyframeList: KeyframeBase[],
  updatedKeyframeList: KeyframeBase[]
) {
  const item = getCompleteDuplicateKeyframesItem(
    duplicatedKeyframeList as KeyframeBone[],
    updatedKeyframeList as KeyframeBone[]
  )
  item.redo()
  historyStore.push(item)
}

function selectTargetProp(
  targetId: string,
  propsState: TargetPropsState,
  shift = false
) {
  const item = targetPropsState.select(targetId, propsState, shift)
  item.redo()
  historyStore.push(item)
}

export function useAnimationStore() {
  return {
    initState,
    playing,
    currentFrame,
    endFrame,
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
    setEndFrame,

    applyEditedTransforms,
    pastePoses,
    setCurrentFrame,
    setPlaying,
    togglePlaying,
    jumpStartFrame,
    jumpEndFrame,
    jumpNextKey,
    jumpPrevKey,
    stepFrame,

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

function getUpdateEndFrameItem(val: number, seriesKey?: string): HistoryItem {
  const current = endFrame.value

  const redo = () => {
    endFrame.value = val
  }
  return {
    name: 'Update End Frame',
    undo: () => {
      endFrame.value = current
    },
    redo,
    seriesKey,
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

function getSelectActionItem(id: string): HistoryItem {
  const actionItem = getSelectItem(actions.state, id)
  const selectItem = getSelectKeyframesItem([])

  return {
    name: 'Select Action',
    undo: () => {
      actionItem.undo()
      selectItem.undo()
    },
    redo: () => {
      selectItem.redo()
      actionItem.redo()
    },
  }
}
export function getAddActionItem(item: Action): HistoryItem {
  const actionItem = getAddItem(actions.state, item)
  const selectItem = getSelectKeyframesItem([])

  return {
    name: 'Add Action',
    undo: () => {
      actionItem.undo()
      selectItem.undo()
    },
    redo: () => {
      selectItem.redo()
      actionItem.redo()
    },
  }
}
export function getDeleteActionItem(): HistoryItem {
  const actionItem = getDeleteItem(
    actions.state,
    actions.lastSelectedIndex.value
  )
  const selectItem = getSelectKeyframesItem([])

  return {
    name: 'Delete Action',
    undo: () => {
      actionItem.undo()
      selectItem.undo()
    },
    redo: () => {
      selectItem.redo()
      actionItem.redo()
    },
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
        shift
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
  const preFrame = currentFrame.value
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
    currentFrame.value = preFrame
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
      currentFrame.value = preFrame
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

function getUpdateCurrentFrameItem(
  frame: number,
  seriesKey?: string
): HistoryItem {
  const preFrame = currentFrame.value
  const preEditTransforms = { ...editTransforms.value }

  return {
    name: 'Update Frame',
    undo: () => {
      currentFrame.value = preFrame
      editTransforms.value = preEditTransforms
    },
    redo: () => {
      currentFrame.value = frame
      editTransforms.value = {}
    },
    seriesKey,
  }
}
