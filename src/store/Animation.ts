import { IVec2 } from 'okageo'
import { computed, watch, ref } from 'vue'
import { useStore } from '.'
import { useListState } from '../composables/listState'
import {
  convolutePoseTransforms,
  getSelectedBornsOrigin,
} from '../utils/armatures'
import { getNextName } from '../utils/relations'
import { HistoryItem, useHistoryStore } from './history'
import {
  Action,
  Born,
  getAction,
  IdMap,
  isBornSelected,
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

const currentTransforms = computed(
  (): IdMap<Transform[]> => {
    return posedBornIds.value.reduce<IdMap<Transform[]>>((p, id) => {
      if (currentKeyFrameMap.value[id]) {
        p[id] = [
          currentKeyFrameMap.value[id].transform,
          ...getBornEditedTransforms(id),
        ]
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
    return toMap(
      store.lastSelectedArmature.value.borns.map((b) => {
        return {
          ...b,
          transform: convolutePoseTransforms(getBornCurrentTransforms(b.id)),
        }
      })
    )
  }
)
const currentSelectedPosedBorns = computed(
  (): IdMap<Born> => {
    return toMap(
      Object.keys(currentPosedBorns.value)
        .filter((id) => {
          return isBornSelected(store.state.selectedBorns[id])
        })
        .map((id) => currentPosedBorns.value[id])
    )
  }
)

const selectedPosedBornOrigin = computed(
  (): IVec2 => {
    if (!store.lastSelectedArmature.value) return { x: 0, y: 0 }
    return getSelectedBornsOrigin(
      currentPosedBorns.value,
      store.state.selectedBorns,
      true
    )
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
      p[id] = convolutePoseTransforms(
        getBornEditedTransforms(id).concat(map[id] ? [map[id]] : [])
      )
      return p
    }, {})
  )
}
function getBornEditedTransforms(id: string): Transform[] {
  return editTransforms.value[id] ? [editTransforms.value[id]] : []
}
function getBornCurrentTransforms(id: string): Transform[] {
  return currentTransforms.value[id] ?? []
}

export function useAnimationStore() {
  return {
    currentFrame,
    endFrame,
    actions: actions.state.list,
    posedBornIds,
    currentPosedBorns,
    currentTransforms,
    selectedPosedBornOrigin,
    getBornEditedTransforms,
    getBornCurrentTransforms,
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
