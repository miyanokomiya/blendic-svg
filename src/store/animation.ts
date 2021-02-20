import { IVec2 } from 'okageo'
import { computed, ref } from 'vue'
import { useStore } from '.'
import { useListState } from '../composables/listState'
import {
  getInterpolatedTransformMapByBornId,
  getKeyframeMapByBornId,
  getKeyframeMapByFrame,
  getKeyframesAt,
} from '../utils/animations'
import {
  convolutePoseTransforms,
  getAnySelectedBorns,
  getPosedBornHeadsOrigin,
  getPoseSelectedBorns,
  getTransformedBornMap,
} from '../utils/armatures'
import { dropKeys, mapReduce } from '../utils/commons'
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

const historyStore = useHistoryStore()
const store = useStore()

const keyframeMapByFrame = computed(() => {
  return getKeyframeMapByFrame(actions.lastSelectedItem.value?.keyframes ?? [])
})

const keyframeMapByBornId = computed(() => {
  return getKeyframeMapByBornId(actions.lastSelectedItem.value?.keyframes ?? [])
})

const currentKeyframes = computed((): Keyframe[] => {
  return getKeyframesAt(
    actions.lastSelectedItem.value?.keyframes ?? [],
    currentFrame.value
  )
})

const currentInterpolatedTransformMapByBornId = computed(
  (): IdMap<Transform> => {
    return getInterpolatedTransformMapByBornId(
      keyframeMapByBornId.value,
      currentFrame.value
    )
  }
)

const currentKeyframeMap = computed(
  (): IdMap<Keyframe> => toBornIdMap(currentKeyframes.value)
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
      // if (currentKeyframeMap.value[id]) {
      //   p[id] = convolutePoseTransforms([
      //     currentKeyframeMap.value[id].transform,
      //     getBornEditedTransforms(id),
      //   ])
      // } else {
      //   p[id] = getBornEditedTransforms(id)
      // }
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

function addAction() {
  if (!store.lastSelectedArmature.value) return

  actions.addItem(
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
  )
}

function setEndFrame(val: number) {
  if (endFrame.value === val) return
  const item = getUpdateEndFrameItem(val)
  item.redo()
  historyStore.push(item)
}

function setEditedTransforms(map: IdMap<Transform>) {
  const item = getUpdateEditedTransformsItem(map)
  item.redo()
  historyStore.push(item)
}
function applyEditedTransforms(map: IdMap<Transform>) {
  const ids = Array.from(
    new Set(Object.keys(editTransforms.value).concat(Object.keys(map)))
  )
  setEditedTransforms(
    ids.reduce<IdMap<Transform>>((p, id) => {
      p[id] = convolutePoseTransforms([
        getBornEditedTransforms(id),
        map[id] ?? getTransform(),
      ])
      return p
    }, {})
  )
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

function execInsertKeyframe() {
  if (!actions.lastSelectedItem.value) return

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
}

export function useAnimationStore() {
  return {
    playing,
    currentFrame,
    endFrame,
    actions: actions.state.list,
    keyframeMapByFrame,
    keyframeMapByBornId,
    posedBornIds,
    currentPosedBorns,
    selectedAllBorns,
    selectedBorns,
    selectedPosedBornOrigin,
    getCurrentSelfTransforms,
    setEndFrame,
    selectedAction: actions.lastSelectedItem,
    selectAction: actions.selectItem,
    addAction,
    deleteAction: actions.deleteItem,
    updateAction: (action: Partial<Action>) => actions.updateItem(action),
    applyEditedTransforms,
    execInsertKeyframe,
    setCurrentFrame,
    setPlaying,
    togglePlaying,
    jumpStartFrame,
    jumpEndFrame,
    jumpNextKey,
    jumpPrevKey,
    stepFrame,
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

function getUpdateEditedTransformsItem(val: IdMap<Transform>): HistoryItem {
  const current = { ...editTransforms.value }

  const redo = () => {
    editTransforms.value = val
  }
  return {
    name: 'Update Pose',
    undo: () => {
      editTransforms.value = current
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
    editTransforms.value = dropKeys(editTransforms.value, bornIds)
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
