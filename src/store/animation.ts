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
  getInterpolatedTransformMapByBornId,
  getKeyframeMapByBornId,
  getKeyframeMapByFrame,
  slideKeyframesTo,
} from '../utils/animations'
import {
  convolutePoseTransforms,
  getAnySelectedBorns,
  getPosedBornHeadsOrigin,
  getPoseSelectedBorns,
  getTransformedBornMap,
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
  Born,
  getAction,
  getKeyframe,
  getTransform,
  IdMap,
  Keyframe,
  PlayState,
  toBornIdMap,
  toMap,
  Transform,
} from '/@/models'

const playing = ref<PlayState>('pause')
const currentFrame = ref(0)
const endFrame = ref(60)
const actions = useListState<Action>('Action')
const editTransforms = ref<IdMap<Transform>>({})
const selectedKeyframeMap = ref<IdMap<boolean>>({})

const historyStore = useHistoryStore()
const store = useStore()

const keyframeMapByFrame = computed(() => {
  return getKeyframeMapByFrame(actions.lastSelectedItem.value?.keyframes ?? [])
})

const keyframeMapByBornId = computed(() => {
  return getKeyframeMapByBornId(actions.lastSelectedItem.value?.keyframes ?? [])
})

const visibledKeyframeMapByBornId = computed(() => {
  return extractMap(keyframeMapByBornId.value, selectedAllBorns.value)
})

const visibledKeyframeMap = computed(() => {
  return toMap(flatKeyListMap(visibledKeyframeMapByBornId.value))
})

const visibledSelectedKeyframeMap = computed(() => {
  return extractMap(visibledKeyframeMap.value, selectedKeyframeMap.value)
})
const isAnyVisibledSelectedKeyframe = computed(() => {
  return Object.keys(visibledSelectedKeyframeMap).length > 0
})

const currentInterpolatedTransformMapByBornId = computed(
  (): IdMap<Transform> => {
    return getInterpolatedTransformMapByBornId(
      keyframeMapByBornId.value,
      currentFrame.value
    )
  }
)

const posedBornIds = computed(() => {
  return Array.from(
    new Set(
      Object.keys(editTransforms.value).concat(
        Object.keys(keyframeMapByBornId.value)
      )
    )
  )
})

const currentSelfTransforms = computed(
  (): IdMap<Transform> => {
    return posedBornIds.value.reduce<IdMap<Transform>>((p, id) => {
      p[id] = convolutePoseTransforms([
        currentInterpolatedTransform(id),
        getBornEditedTransforms(id),
      ])
      return p
    }, {})
  }
)

const currentPosedBorns = computed(
  (): IdMap<Born> => {
    if (!store.lastSelectedArmature.value) return {}
    return getTransformedBornMap(
      toMap(
        store.lastSelectedArmature.value.borns.map((b) => {
          return {
            ...b,
            transform: getCurrentSelfTransforms(b.id),
          }
        })
      )
    )
  }
)

const selectedAllBorns = computed(() => {
  return getAnySelectedBorns(currentPosedBorns.value, store.state.selectedBorns)
})

const selectedBorns = computed(() => {
  return getPoseSelectedBorns(
    currentPosedBorns.value,
    store.state.selectedBorns
  )
})

const selectedPosedBornOrigin = computed(
  (): IVec2 => {
    if (!store.lastSelectedArmature.value) return { x: 0, y: 0 }
    return getPosedBornHeadsOrigin(selectedBorns.value)
  }
)

function setEndFrame(val: number) {
  if (endFrame.value === val) return
  const item = getUpdateEndFrameItem(val)
  item.redo()
  historyStore.push(item)
}

function setEditedTransforms(mapByBornId: IdMap<Transform>) {
  const item = getUpdateEditedTransformsItem(mapByBornId)
  item.redo()
  historyStore.push(item)
}
function applyEditedTransforms(mapByBornId: IdMap<Transform>) {
  setEditedTransforms(
    mapReduce({ ...editTransforms.value, ...mapByBornId }, (_p, id) => {
      return convolutePoseTransforms([
        getBornEditedTransforms(id),
        mapByBornId[id] ?? getTransform(),
      ])
    })
  )
}
function pastePoses(mapByBornId: IdMap<Transform>) {
  const item = getUpdateEditedTransformsItem(
    mapReduce(
      dropMapIfFalse(mapByBornId, (_, bornId) => {
        // drop poses of unexisted borns
        return !!currentPosedBorns.value[bornId]
      }),
      (t, bornId) => {
        // invert keyframe's pose & paste the pose
        return multiPoseTransform(
          t,
          invertPoseTransform(currentInterpolatedTransform(bornId))
        )
      }
    ),
    'Paste Pose'
  )
  item.redo()
  historyStore.push(item)
}

function currentInterpolatedTransform(bornId: string): Transform {
  return currentInterpolatedTransformMapByBornId.value[bornId] ?? getTransform()
}
function getBornEditedTransforms(bornId: string): Transform {
  return editTransforms.value[bornId] ?? getTransform()
}
function getCurrentSelfTransforms(bornId: string): Transform {
  return currentSelfTransforms.value[bornId] ?? getTransform()
}

function setCurrentFrame(val: number) {
  currentFrame.value = val
  editTransforms.value = {}
}

function setPlaying(val: PlayState) {
  playing.value = val
}
function togglePlaying() {
  playing.value = playing.value === 'pause' ? 'play' : 'pause'
}
function jumpStartFrame() {
  currentFrame.value = 0
}
function jumpEndFrame() {
  currentFrame.value = endFrame.value
}
function jumpNextKey() {
  console.log('TODO jumpNextKey')
}
function jumpPrevKey() {
  console.log('TODO jumpPrevKey')
}
function stepFrame(tickFrame: number, reverse = false) {
  if (endFrame.value === 0) return

  if (reverse) {
    const val = currentFrame.value - tickFrame
    currentFrame.value = val <= 0 ? endFrame.value : val
  } else {
    const val = currentFrame.value + tickFrame
    currentFrame.value = endFrame.value <= val ? 0 : val
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

function selectKeyframe(keyframeId: string, shift = false) {
  if (!keyframeId && !isAnyVisibledSelectedKeyframe.value) return

  const item = getSelectKeyframesItem([keyframeId], shift)
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
    Object.keys(visibledKeyframeMap.value).length
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
function execInsertKeyframe() {
  if (Object.keys(selectedAllBorns.value).length === 0) return
  if (!actions.lastSelectedItem.value) {
    addAction()
  }

  const keyframes = Object.keys(selectedAllBorns.value).map((bornId) => {
    return getKeyframe(
      {
        frame: currentFrame.value,
        bornId,
        transform: getCurrentSelfTransforms(bornId),
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
function execUpdateKeyframes(keyframes: IdMap<Keyframe>) {
  const item = getExecUpdateKeyframeItem(keyframes)
  item.redo()
  historyStore.push(item)
}
function pasteKeyframes(keyframeList: Keyframe[]) {
  const item = getExecPasteKeyframeItem(
    toMap(
      slideKeyframesTo(
        keyframeList
          .filter((k) => store.bornMap.value[k.bornId])
          .map((k) => getKeyframe(k, true)),
        currentFrame.value
      )
    )
  )
  item.redo()
  historyStore.push(item)
}

export function useAnimationStore() {
  return {
    playing,
    currentFrame,
    endFrame,
    actions: actions.state.list,
    selectedKeyframeMap,
    keyframeMapByFrame,
    keyframeMapByBornId,
    visibledKeyframeMap,
    visibledSelectedKeyframeMap,
    posedBornIds,
    currentPosedBorns,
    selectedAllBorns,
    selectedBorns,
    selectedPosedBornOrigin,
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
  }
}

function getUpdateEndFrameItem(val: number): HistoryItem {
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
  }
}

function getUpdateEditedTransformsItem(
  val: IdMap<Transform>,
  name = 'Update Pose'
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
      ...mapReduce(visibledKeyframeMap.value, () => true),
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
      const idMap = ids.reduce<IdMap<boolean>>((p, id) => {
        p[id] = !selectedKeyframeMap.value[id]
        return p
      }, {})
      selectedKeyframeMap.value = {
        ...selectedKeyframeMap.value,
        ...idMap,
      }
    } else {
      const idMap = ids.reduce<IdMap<boolean>>((p, id) => {
        p[id] = true
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

function getExecInsertKeyframeItem(keyframes: Keyframe[]) {
  const bornIds = toBornIdMap(keyframes)
  const preFrame = currentFrame.value
  const preEditTransforms = { ...editTransforms.value }
  const preKeyframes = actions.lastSelectedItem.value!.keyframes.filter((k) => {
    return k.frame === preFrame && bornIds[k.bornId]
  })

  const redo = () => {
    const updated = actions.lastSelectedItem
      .value!.keyframes.filter((k) => {
        return !(k.frame === preFrame && bornIds[k.bornId])
      })
      .concat(keyframes)
    currentFrame.value = preFrame
    actions.lastSelectedItem.value!.keyframes = updated
    editTransforms.value = dropMap(editTransforms.value, bornIds)
  }
  return {
    name: 'Insert Keyframe',
    undo: () => {
      const reverted = actions.lastSelectedItem
        .value!.keyframes.filter((k) => {
          return !(k.frame === preFrame && bornIds[k.bornId])
        })
        .concat(preKeyframes)
      currentFrame.value = preFrame
      actions.lastSelectedItem.value!.keyframes = reverted
      editTransforms.value = preEditTransforms
    },
    redo,
  }
}

function getExecDeleteKeyframesItem() {
  const deletedFrames = { ...visibledSelectedKeyframeMap.value }
  const selectItem = getSelectKeyframesItem([])

  const redo = () => {
    const updated = actions.lastSelectedItem.value!.keyframes.filter((k) => {
      return !deletedFrames[k.id]
    })
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

function getSrameFrameAndBornIdKeyframe(
  frame: number,
  bornId: string
): Keyframe | undefined {
  const sameFrames = keyframeMapByFrame.value[frame]
  if (!sameFrames) return
  const sameFrameAndBorn = sameFrames.find((f) => f.bornId === bornId)
  if (!sameFrameAndBorn) return
  return sameFrameAndBorn
}

function getOverridedKeyframeList(keyframes: IdMap<Keyframe>): Keyframe[] {
  const overridedKeyframeList: Keyframe[] = []
  Object.keys(keyframes).forEach((id) => {
    const keyframe = keyframes[id]
    const same = getSrameFrameAndBornIdKeyframe(keyframe.frame, keyframe.bornId)
    if (same) overridedKeyframeList.push(same)
  })
  return overridedKeyframeList
}

function overridedKeyframeList(keyframes: IdMap<Keyframe>): Keyframe[] {
  const overridedKeyframeList = getOverridedKeyframeList(keyframes)
  return toList({
    ...dropMap(
      toMap(actions.lastSelectedItem.value!.keyframes),
      toMap(overridedKeyframeList)
    ),
    ...keyframes,
  })
}

function getExecUpdateKeyframeItem(keyframes: IdMap<Keyframe>) {
  const preKeyframes = extractMap(visibledSelectedKeyframeMap.value, keyframes)

  const redo = () => {
    const updated = overridedKeyframeList(keyframes)
    actions.lastSelectedItem.value!.keyframes = updated
  }
  return {
    name: 'Update Keyframe',
    undo: () => {
      const reverted = toList({
        ...dropMap(toMap(actions.lastSelectedItem.value!.keyframes), keyframes),
        ...preKeyframes,
        ...toMap(overridedKeyframeList(keyframes)),
      })
      actions.lastSelectedItem.value!.keyframes = reverted
    },
    redo,
  }
}

function getExecPasteKeyframeItem(keyframes: IdMap<Keyframe>) {
  const redo = () => {
    const updated = overridedKeyframeList(keyframes)
    actions.lastSelectedItem.value!.keyframes = updated
  }
  return {
    name: 'Paste Keyframe',
    undo: () => {
      const reverted = toList({
        ...dropMap(toMap(actions.lastSelectedItem.value!.keyframes), keyframes),
        ...toMap(overridedKeyframeList(keyframes)),
      })
      actions.lastSelectedItem.value!.keyframes = reverted
    },
    redo,
  }
}
