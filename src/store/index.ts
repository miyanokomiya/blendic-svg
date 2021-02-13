import { reactive, computed, watch } from 'vue'
import { getNextName } from '/@/utils/relations'
import {
  Armature,
  BornSelectedState,
  getBorn,
  getArmature,
  toMap,
  Born,
  IdMap,
} from '/@/models/index'
import * as armatureUtils from '/@/utils/armatures'
// @ts-ignore
import merge from 'just-merge'
import { IVec2 } from 'okageo'
import { HistoryItem, useHistoryStore } from './history'

const historyStore = useHistoryStore()

const armature = reactive<Armature>(
  getArmature(
    {
      name: 'armature',
      borns: [
        getBorn(
          {
            name: 'born',
            head: { x: 20, y: 200 },
            tail: { x: 220, y: 200 },
          },
          true
        ),
      ],
    },
    true
  )
)

const state = reactive({
  armatures: [armature],
  lastSelectedArmatureId: '',
  lastSelectedBornId: '',
  selectedArmatures: {} as IdMap<boolean>,
  selectedBorns: {} as IdMap<BornSelectedState>,
})

const lastSelectedArmatureIndex = computed(() =>
  state.armatures.findIndex((a) => a.id === state.lastSelectedArmatureId)
)
const lastSelectedArmature = computed(
  () => state.armatures[lastSelectedArmatureIndex.value]
)
const lastSelectedBorn = computed(() => {
  if (!lastSelectedArmature.value) return
  return lastSelectedArmature.value.borns.find(
    (b) => b.id === state.lastSelectedBornId
  )
})

const armatureMap = computed(() => toMap(state.armatures))
const bornMap = computed(() => toMap(lastSelectedArmature.value?.borns ?? []))

const selectedBornsOrigin = computed(
  (): IVec2 =>
    armatureUtils.getSelectedBornsOrigin(bornMap.value, state.selectedBorns)
)

watch(
  () => state.selectedArmatures,
  () => {
    if (!(state.lastSelectedArmatureId in state.selectedArmatures)) {
      state.lastSelectedArmatureId = ''
    }
  }
)
watch(
  () => armatureMap.value,
  () => {
    // unselect unexisted armatures
    state.selectedArmatures = Object.keys(state.selectedArmatures).reduce<
      IdMap<boolean>
    >((m, id) => {
      return armatureMap.value[id]
        ? {
            ...m,
            [id]: state.selectedArmatures[id],
          }
        : m
    }, {})
  }
)

watch(
  () => state.selectedBorns,
  () => {
    if (!(state.lastSelectedBornId in state.selectedBorns)) {
      state.lastSelectedBornId = ''
    }
  }
)
watch(
  () => bornMap.value,
  () => {
    // unselect unexisted borns
    state.selectedBorns = Object.keys(state.selectedBorns).reduce<
      IdMap<BornSelectedState>
    >((m, id) => {
      return bornMap.value[id]
        ? {
            ...m,
            [id]: state.selectedBorns[id],
          }
        : m
    }, {})
  }
)

function selectArmature(id: string = '') {
  if (state.lastSelectedArmatureId === id) return

  const item = getSelectArmatureItem(id)
  item.redo()
  historyStore.push(item)
}
function selectBorn(
  id: string = '',
  selectedState: BornSelectedState = { head: true, tail: true }
) {
  if (!lastSelectedArmature.value) return

  state.lastSelectedBornId = id
  state.selectedBorns = { [id]: selectedState }
  state.selectedBorns = merge(
    state.selectedBorns,
    armatureUtils.selectBorn(lastSelectedArmature.value, id, selectedState)
  )
}
function shiftSelectBorn(
  id: string = '',
  selectedState: BornSelectedState = { head: true, tail: true }
) {
  if (!lastSelectedArmature.value) return

  state.lastSelectedBornId = id
  state.selectedBorns[id] = selectedState
  state.selectedBorns = merge(
    state.selectedBorns,
    armatureUtils.selectBorn(lastSelectedArmature.value, id, selectedState)
  )
}
function setSelectedBorns(
  data: IdMap<BornSelectedState>,
  lastSelectedBornId: string = ''
) {
  state.selectedBorns = data
  state.lastSelectedBornId = lastSelectedBornId
}
function setBornConnection(connected: boolean) {
  if (!lastSelectedArmature.value) return
  if (!lastSelectedBorn.value) return

  lastSelectedBorn.value.connected = connected
  if (connected) {
    lastSelectedArmature.value.borns = armatureUtils.fixConnections(
      lastSelectedArmature.value.borns
    )
  }
}
function setBornParent(parentId: string = '') {
  if (!lastSelectedArmature.value) return
  if (!lastSelectedBorn.value) return

  lastSelectedBorn.value.parentId = parentId
  if (lastSelectedBorn.value.connected) {
    lastSelectedArmature.value.borns = armatureUtils.fixConnections(
      lastSelectedArmature.value.borns
    )
  }
}
function updateBornName(name: string) {
  if (!lastSelectedArmature.value) return
  if (!lastSelectedBorn.value) return

  lastSelectedBorn.value.name = name
}
function updateArmatureName(name: string) {
  if (!lastSelectedArmature.value) return

  const item = getUpdateArmatureItem({ name })
  item.redo()
  historyStore.push(item)
}
function deleteArmature() {
  const item = getDeleteArmatureItem()
  item.redo()
  historyStore.push(item)
}
function addArmature() {
  const item = getAddArmatureItem(
    getArmature(
      {
        name: getNextName(
          'armature',
          state.armatures.map((a) => a.name)
        ),
        borns: [getBorn({ name: 'born', tail: { x: 100, y: 0 } }, true)],
      },
      true
    )
  )
  item.redo()
  historyStore.push(item)
}
function deleteBorn() {
  if (!lastSelectedArmature.value) return

  lastSelectedArmature.value.borns = armatureUtils.updateConnections(
    lastSelectedArmature.value.borns.filter((b) => !state.selectedBorns[b.id])
  )
}
function addBorn() {
  if (!lastSelectedArmature.value) return

  lastSelectedArmature.value.borns.push(
    getBorn(
      {
        name: getNextName(
          'born',
          lastSelectedArmature.value.borns.map((a) => a.name)
        ),
        tail: { x: 100, y: 0 },
      },
      true
    )
  )
}
function updateBorns(diffMap: IdMap<Born>) {
  if (!lastSelectedArmature.value) return

  lastSelectedArmature.value.borns = Object.values({
    ...bornMap.value,
    ...diffMap,
  }).sort((a, b) => (a.name >= b.name ? 1 : -1))
}
function updateBornConnections() {
  if (!lastSelectedArmature.value) return

  lastSelectedArmature.value.borns = armatureUtils.updateConnections(
    lastSelectedArmature.value.borns
  )
}

export function useStore() {
  return {
    state,
    lastSelectedArmature,
    lastSelectedBorn,
    bornMap,
    selectedBornsOrigin,
    selectArmature,
    selectBorn,
    shiftSelectBorn,
    setSelectedBorns,
    setBornConnection,
    setBornParent,
    updateBornName,
    updateArmatureName,
    deleteArmature,
    addArmature,
    deleteBorn,
    addBorn,
    updateBorns,
    updateBornConnections,
  }
}

function getSelectArmatureItem(id: string): HistoryItem {
  const current = { ...state.selectedArmatures }
  const currentLast = state.lastSelectedArmatureId
  const redo = () => {
    state.selectedArmatures = id ? { [id]: true } : {}
    state.lastSelectedArmatureId = id
  }
  return {
    name: 'Select Armature',
    undo: () => {
      state.selectedArmatures = { ...current }
      state.lastSelectedArmatureId = currentLast
    },
    redo,
  }
}
function getUpdateArmatureItem(updated: Partial<Armature>): HistoryItem {
  const current = Object.keys(lastSelectedArmature.value!).reduce<
    Partial<Armature>
  >((p, c) => {
    // @ts-ignore
    if (c in updated) p[c] = lastSelectedArmature.value![c]
    return p
  }, {})

  const redo = () => {
    const index = lastSelectedArmatureIndex.value
    state.armatures[index] = { ...state.armatures[index], ...updated }
  }
  return {
    name: 'Update Armature',
    undo: () => {
      const index = lastSelectedArmatureIndex.value
      state.armatures[index] = { ...state.armatures[index], ...current }
    },
    redo,
  }
}
function getDeleteArmatureItem(): HistoryItem {
  const current = { ...lastSelectedArmature.value }
  const index = lastSelectedArmatureIndex.value
  const selectItem = getSelectArmatureItem('')

  const redo = () => {
    state.armatures.splice(index, 1)
  }
  return {
    name: 'Delete Armature',
    undo: () => {
      state.armatures.splice(index, 0, current)
      selectItem.undo()
    },
    redo,
  }
}
function getAddArmatureItem(armatures: Armature): HistoryItem {
  const index = state.armatures.length
  const selectItem = getSelectArmatureItem(armatures.id)

  const redo = () => {
    state.armatures.push(armatures)
    selectItem.redo()
  }
  return {
    name: 'Add Armature',
    undo: () => {
      state.armatures.splice(index, 1)
      selectItem.undo()
    },
    redo,
  }
}
