import { IVec2 } from 'okageo'
import { computed, ref, watch } from 'vue'
import { useStore } from '.'
import { useListState } from '../composables/listState'
import {
  convolutePoseTransforms,
  getAnySelectedBorns,
  getPosedBornHeadsOrigin,
  getPoseSelectedBorns,
  getTransformedBornMap,
} from '../utils/armatures'
import { getNextName } from '../utils/relations'
import { HistoryItem, useHistoryStore } from './history'
import {
  Action,
  Born,
  getAction,
  getTransform,
  IdMap,
  Keyframe,
  toBornIdMap,
  toMap,
  Transform,
} from '/@/models'

const currentFrame = ref(0)
const endFrame = ref(60)
const actions = useListState<Action>('Action')
const editTransforms = ref<IdMap<Transform>>({})

const historyStore = useHistoryStore()
const store = useStore()

const currentKeyFrames = computed((): Keyframe[] => {
  return (
    actions.lastSelectedItem.value?.keyframes.filter(
      (k) => k.frame === currentFrame.value
    ) ?? []
  )
})

const currentKeyFrameMap = computed(
  (): IdMap<Keyframe> => toBornIdMap(currentKeyFrames.value)
)

const posedBornIds = computed(() => {
  return Array.from(
    new Set(
      Object.keys(editTransforms.value).concat(
        Object.keys(currentKeyFrameMap.value)
      )
    )
  )
})

const currentSelfTransforms = computed(
  (): IdMap<Transform> => {
    return posedBornIds.value.reduce<IdMap<Transform>>((p, id) => {
      if (currentKeyFrameMap.value[id]) {
        p[id] = convolutePoseTransforms([
          currentKeyFrameMap.value[id].transform,
          getBornEditedTransforms(id),
        ])
      } else {
        p[id] = getBornEditedTransforms(id)
      }
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

watch(currentFrame, () => {
  editTransforms.value = {}
})

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
function getBornEditedTransforms(id: string): Transform {
  return editTransforms.value[id] ?? getTransform()
}
function getCurrentSelfTransforms(id: string): Transform {
  return currentSelfTransforms.value[id] ?? getTransform()
}

export function useAnimationStore() {
  return {
    currentFrame,
    endFrame,
    actions: actions.state.list,
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
