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
  getKeyframeMapByBoneId,
  getKeyframeMapByFrame,
  mergeKeyframesWithDropped,
  slideKeyframesTo,
} from '../utils/animations'
import {
  convolutePoseTransforms,
  getAnySelectedBones,
  getPosedBoneHeadsOrigin,
  getPoseSelectedBones,
  getTransformedBoneMap,
  invertPoseTransform,
  multiPoseTransform,
} from '../utils/armatures'
import {
  dropMap,
  dropMapIfFalse,
  extractMap,
  flatKeyListMap,
  mapReduce,
  toList,
} from '../utils/commons'
import { getNextName } from '../utils/relations'
import { HistoryItem, useHistoryStore } from './history'
import {
  Action,
  Bone,
  getAction,
  getTransform,
  IdMap,
  PlayState,
  toBoneIdMap,
  toMap,
  Transform,
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
  isAllExistSelected,
} from '/@/utils/keyframes'
import { getInterpolatedTransformMapByBoneId } from '/@/utils/keyframes/keyframeBone'

const playing = ref<PlayState>('pause')
const currentFrame = ref(0)
const endFrame = ref(60)
const actions = useListState<Action>('Action')
const editTransforms = ref<IdMap<Transform>>({})
const selectedKeyframeMap = ref<IdMap<KeyframeSelectedState>>({})

const historyStore = useHistoryStore()
const store = useStore()

function initState(initActions: Action[] = []) {
  actions.state.list = initActions
  editTransforms.value = {}
  selectedKeyframeMap.value = {}
}

const keyframeList = computed(() => {
  return actions.lastSelectedItem.value?.keyframes ?? []
})

const keyframeMapByFrame = computed(() => {
  return getKeyframeMapByFrame(keyframeList.value)
})

const keyframeMapByBoneId = computed(() => {
  return getKeyframeMapByBoneId(keyframeList.value)
})

const visibledKeyframeMapByBoneId = computed(() => {
  return extractMap(keyframeMapByBoneId.value, selectedAllBones.value)
})

const visibledKeyframeMap = computed(() => {
  return toMap(flatKeyListMap(visibledKeyframeMapByBoneId.value))
})

const visibledSelectedKeyframeMap = computed(() => {
  return extractMap(visibledKeyframeMap.value, selectedKeyframeMap.value)
})
const isAnyVisibledSelectedKeyframe = computed(() => {
  return Object.keys(visibledSelectedKeyframeMap.value).length > 0
})

const currentInterpolatedTransformMapByBoneId = computed(
  (): IdMap<Transform> => {
    return getInterpolatedTransformMapByBoneId(
      keyframeMapByBoneId.value,
      currentFrame.value
    )
  }
)

const posedBoneIds = computed(() => {
  return Array.from(
    new Set(
      Object.keys(editTransforms.value).concat(
        Object.keys(keyframeMapByBoneId.value)
      )
    )
  )
})

const currentSelfTransforms = computed(
  (): IdMap<Transform> => {
    return posedBoneIds.value.reduce<IdMap<Transform>>((p, id) => {
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

const selectedAllBones = computed(() => {
  return getAnySelectedBones(currentPosedBones.value, store.state.selectedBones)
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

function setEditedTransforms(mapByBoneId: IdMap<Transform>) {
  const item = getUpdateEditedTransformsItem(mapByBoneId)
  item.redo()
  historyStore.push(item)
}
function applyEditedTransforms(mapByBoneId: IdMap<Transform>) {
  setEditedTransforms(
    mapReduce({ ...editTransforms.value, ...mapByBoneId }, (_p, id) => {
      return convolutePoseTransforms([
        getBoneEditedTransforms(id),
        mapByBoneId[id] ?? getTransform(),
      ])
    })
  )
}
function pastePoses(mapByBoneId: IdMap<Transform>, seriesKey?: string) {
  const item = getUpdateEditedTransformsItem(
    {
      ...editTransforms.value,
      ...mapReduce(
        dropMapIfFalse(mapByBoneId, (_, boneId) => {
          // drop poses of unexisted bones
          return !!store.boneMap.value[boneId]
        }),
        (t, boneId) => {
          // invert keyframe's pose & paste the pose
          return multiPoseTransform(
            t,
            invertPoseTransform(currentInterpolatedTransform(boneId))
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

function currentInterpolatedTransform(boneId: string): Transform {
  return currentInterpolatedTransformMapByBoneId.value[boneId] ?? getTransform()
}
function getBoneEditedTransforms(boneId: string): Transform {
  return editTransforms.value[boneId] ?? getTransform()
}
function getCurrentSelfTransforms(boneId: string): Transform {
  return currentSelfTransforms.value[boneId] ?? getTransform()
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
  if (Object.keys(selectedAllBones.value).length === 0) return
  if (!actions.lastSelectedItem.value) {
    addAction()
  }

  const keyframes = Object.keys(selectedAllBones.value).map((boneId) => {
    const t = getCurrentSelfTransforms(boneId)
    return getKeyframeBone(
      {
        frame: currentFrame.value,
        boneId,
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
function execUpdateKeyframes(keyframes: IdMap<KeyframeBase>) {
  const item = getExecUpdateKeyframeItem(keyframes as IdMap<KeyframeBone>)
  item.redo()
  historyStore.push(item)
}
function pasteKeyframes(keyframeList: KeyframeBase[]) {
  const item = getExecPasteKeyframeItem(
    toMap(
      slideKeyframesTo(
        (keyframeList as KeyframeBone[])
          .filter((k) => store.boneMap.value[k.boneId])
          .map((k) => getKeyframeBone(k, true)),
        currentFrame.value
      )
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

export function useAnimationStore() {
  return {
    initState,
    playing,
    currentFrame,
    endFrame,
    actions: computed(() => actions.state.list),
    selectedKeyframeMap,
    keyframeMapByFrame,
    keyframeMapByBoneId,
    visibledKeyframeMap,
    visibledSelectedKeyframeMap,
    posedBoneIds,
    currentPosedBones,
    selectedAllBones,
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

function getSelectAllKeyframesItem(): HistoryItem {
  const current = { ...selectedKeyframeMap.value }
  const redo = () => {
    selectedKeyframeMap.value = {
      ...selectedKeyframeMap.value,
      ...mapReduce(visibledKeyframeMap.value, () =>
        getAllSelectedState('bone')
      ),
    }
  }
  return {
    name: 'Select All Keyframe',
    undo: () => {
      selectedKeyframeMap.value = { ...current }
    },
    redo,
  }
}
function getSelectKeyframesItem(ids: string[], shift = false): HistoryItem {
  const current = { ...selectedKeyframeMap.value }

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
          idMap[id] = getAllSelectedState('bone')
        }
      })
      selectedKeyframeMap.value = dropMap(
        { ...selectedKeyframeMap.value, ...idMap },
        dropIds
      )
    } else {
      const idMap = ids.reduce<IdMap<KeyframeSelectedState>>((p, id) => {
        p[id] = getAllSelectedState('bone')
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
  }
  return {
    name: 'Select Keyframe',
    undo: () => {
      selectedKeyframeMap.value = { ...current }
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

  const redo = () => {
    if (shift) {
      selectedKeyframeMap.value = {
        ...selectedKeyframeMap.value,
        [id]: selectedState ?? getAllSelectedState('bone'),
      }
    } else {
      selectedKeyframeMap.value = {
        ...dropMap(selectedKeyframeMap.value, visibledKeyframeMap.value),
        ...(selectedState ? { [id]: selectedState } : {}),
      }
    }
  }
  return {
    name: 'Select Keyframe',
    undo: () => {
      selectedKeyframeMap.value = { ...current }
    },
    redo,
  }
}

function getExecInsertKeyframeItem(keyframes: KeyframeBone[], replace = false) {
  const preFrame = currentFrame.value
  const insertedKeyframes = keyframes
  const preEditTransforms = { ...editTransforms.value }

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
      toBoneIdMap(insertedKeyframes)
    )
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

function getExecUpdateKeyframeItem(keyframes: IdMap<KeyframeBone>) {
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
  }
}

function getExecPasteKeyframeItem(keyframes: IdMap<KeyframeBone>) {
  const { merged, dropped } = mergeKeyframesWithDropped(
    actions.lastSelectedItem.value!.keyframes,
    toList(keyframes),
    true
  )

  const redo = () => {
    const updated = merged
    actions.lastSelectedItem.value!.keyframes = updated
  }
  return {
    name: 'Paste Keyframe',
    undo: () => {
      const dropPastedMap = dropMap(
        toMap(actions.lastSelectedItem.value!.keyframes),
        keyframes
      )
      const reverted = toList({
        ...dropPastedMap,
        ...toMap(
          mergeKeyframesWithDropped(toList(dropPastedMap), dropped).merged
        ),
      })
      actions.lastSelectedItem.value!.keyframes = reverted
    },
    redo,
  }
}

function getCompleteDuplicateKeyframesItem(
  duplicatedKeyframeList: KeyframeBone[],
  updatedKeyframeList: KeyframeBone[]
) {
  const duplicatItem = getExecInsertKeyframeItem(duplicatedKeyframeList, true)
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
