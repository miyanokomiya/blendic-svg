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
  isSameBornSelectedState,
  isBornSelected,
  mergeMap,
  getOriginPartial,
} from '/@/models/index'
import * as armatureUtils from '/@/utils/armatures'
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
  state.armatures.findIndex(
    (a) =>
      a.id === state.lastSelectedArmatureId &&
      state.selectedArmatures[state.lastSelectedArmatureId]
  )
)
const lastSelectedArmature = computed(() =>
  lastSelectedArmatureIndex.value !== -1
    ? state.armatures[lastSelectedArmatureIndex.value]
    : undefined
)

const lastSelectedBornIndex = computed(() => {
  if (!lastSelectedArmature.value) return -1
  return lastSelectedArmature.value.borns.findIndex(
    (b) =>
      b.id === state.lastSelectedBornId &&
      (state.selectedBorns[state.lastSelectedBornId]?.head ||
        state.selectedBorns[state.lastSelectedBornId]?.tail)
  )
})
const lastSelectedBorn = computed(() => {
  if (!lastSelectedArmature.value) return
  return lastSelectedBornIndex.value !== -1
    ? lastSelectedArmature.value.borns[lastSelectedBornIndex.value]
    : undefined
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
    if (!state.selectedArmatures[state.lastSelectedArmatureId]) {
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
    if (!isBornSelected(state.selectedBorns[state.lastSelectedBornId])) {
      const otherKeys = Object.keys(state.selectedBorns)
      state.lastSelectedBornId = otherKeys.length > 0 ? otherKeys[0] : ''
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

function selectAllArmature() {
  if (state.lastSelectedArmatureId) return

  const armature = state.armatures[0]
  if (!armature) return

  selectArmature(armature.id)
}
function selectArmature(id: string = '') {
  if (state.lastSelectedArmatureId === id) return

  const item = getSelectArmatureItem(id)
  item.redo()
  historyStore.push(item)
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

function selectAllBorn() {
  if (!lastSelectedArmature.value) return

  const item = getSelectAllBornItem()
  item.redo()
  historyStore.push(item)
}
function selectBorn(
  id: string = '',
  selectedState: BornSelectedState = { head: true, tail: true },
  shift = false,
  ignoreConnection = false
) {
  if (!lastSelectedArmature.value) return
  // skip same selected state
  if (!lastSelectedBorn.value && !id) return
  if (
    state.lastSelectedBornId === id &&
    isSameBornSelectedState(state.selectedBorns[id], selectedState)
  )
    return

  const item = getSelectBornItem(id, selectedState, shift, ignoreConnection)
  item.redo()
  historyStore.push(item)
}
function deleteBorn() {
  if (!lastSelectedArmature.value) return

  const item = getDeleteBornItem()
  item.redo()
  historyStore.push(item)
}
function addBorn() {
  if (!lastSelectedArmature.value) return

  addBorns([
    getBorn(
      {
        name: getNextName(
          'born',
          lastSelectedArmature.value.borns.map((a) => a.name)
        ),
        tail: { x: 100, y: 0 },
      },
      true
    ),
  ])
}
function addBorns(borns: Born[], selectedState?: BornSelectedState) {
  if (!lastSelectedArmature.value) return

  const item = getAddBornItem(
    borns,
    borns.reduce<IdMap<BornSelectedState>>((p, born) => {
      if (selectedState) p[born.id] = { ...selectedState }
      return p
    }, {})
  )
  item.redo()
  historyStore.push(item)
}
function updateBorns(diffMap: IdMap<Partial<Born>>) {
  if (!lastSelectedArmature.value) return

  const item = getUpdateBornsItem(diffMap)
  item.redo()
  historyStore.push(item)
}
function updateBorn(diff: Partial<Born>) {
  if (!lastSelectedArmature.value) return
  if (!lastSelectedBorn.value) return

  const item = getUpdateBornItem(
    armatureUtils.fixConnection(lastSelectedArmature.value.borns, {
      ...lastSelectedBorn.value,
      ...diff,
    })
  )
  item.redo()
  historyStore.push(item)
}

export function useStore() {
  return {
    state,
    lastSelectedArmature,
    lastSelectedBorn,
    bornMap,
    selectedBornsOrigin,
    selectAllArmature,
    selectArmature,
    updateArmatureName,
    deleteArmature,
    addArmature,
    selectAllBorn,
    selectBorn,
    deleteBorn,
    addBorn,
    addBorns,
    updateBorns,
    updateBorn,
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
  const current = getOriginPartial(lastSelectedArmature.value!, updated)

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
  const current = { ...lastSelectedArmature.value! }
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
function getAddArmatureItem(armature: Armature): HistoryItem {
  const index = state.armatures.length
  const selectItem = getSelectArmatureItem(armature.id)

  const redo = () => {
    state.armatures.push(armature)
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

function getSelectBornItem(
  id: string,
  selectedState: BornSelectedState = { head: true, tail: true },
  shift = false,
  ignoreConnection = false
): HistoryItem {
  const current = { ...state.selectedBorns }
  const currentLast = state.lastSelectedBornId

  const redo = () => {
    state.selectedBorns = id
      ? mergeMap(
          { ...(shift ? state.selectedBorns : {}), [id]: selectedState },
          armatureUtils.selectBorn(
            lastSelectedArmature.value!,
            id,
            selectedState,
            ignoreConnection
          )
        )
      : {}
    state.lastSelectedBornId = id
  }
  return {
    name: 'Select Born',
    undo: () => {
      state.selectedBorns = { ...current }
      state.lastSelectedBornId = currentLast
    },
    redo,
  }
}

function getAllBornSelectedStateMap(): IdMap<BornSelectedState> {
  if (!lastSelectedArmature.value) return {}

  return lastSelectedArmature.value.borns.reduce<IdMap<BornSelectedState>>(
    (p, b) => {
      p[b.id] = { head: true, tail: true }
      return p
    },
    {}
  )
}

function getSelectAllBornItem(): HistoryItem {
  const current = { ...state.selectedBorns }
  const currentLast = state.lastSelectedBornId

  const redo = () => {
    state.selectedBorns = getAllBornSelectedStateMap()
  }
  return {
    name: 'Select All Born',
    undo: () => {
      state.selectedBorns = { ...current }
      state.lastSelectedBornId = currentLast
    },
    redo,
  }
}

function getUpdateBornItem(updated: Partial<Born>): HistoryItem {
  const current = getOriginPartial(lastSelectedBorn.value!, updated)

  const redo = () => {
    const index = lastSelectedBornIndex.value
    lastSelectedArmature.value!.borns[index] = {
      ...lastSelectedArmature.value!.borns[index],
      ...updated,
    }
  }
  return {
    name: 'Update Born',
    undo: () => {
      const index = lastSelectedBornIndex.value
      lastSelectedArmature.value!.borns[index] = {
        ...lastSelectedArmature.value!.borns[index],
        ...current,
      }
    },
    redo,
  }
}
function getUpdateBornsItem(updated: IdMap<Partial<Born>>): HistoryItem {
  const updatedMap = mergeMap<Partial<Born>>(
    updated,
    armatureUtils.updateConnections(
      lastSelectedArmature.value!.borns.map((b) => ({
        ...b,
        ...updated[b.id],
      }))
    )
  )

  const current = Object.keys(updatedMap).reduce<IdMap<Partial<Born>>>(
    (p, id) => {
      if (bornMap.value[id])
        p[id] = getOriginPartial(bornMap.value[id], updatedMap[id])
      return p
    },
    {}
  )

  const redo = () => {
    lastSelectedArmature.value!.borns = lastSelectedArmature.value!.borns.map(
      (b) => ({
        ...b,
        ...updatedMap[b.id],
      })
    )
  }
  return {
    name: 'Update Born',
    undo: () => {
      lastSelectedArmature.value!.borns = lastSelectedArmature.value!.borns.map(
        (b) => ({
          ...b,
          ...current[b.id],
        })
      )
    },
    redo,
  }
}
function getDeleteBornItem(): HistoryItem {
  const current = lastSelectedArmature.value!.borns.concat()
  const updated = lastSelectedArmature.value!.borns.filter(
    (b) => !state.selectedBorns[b.id]
  )

  const updateItem = getUpdateBornsItem(
    armatureUtils.updateConnections(updated)
  )
  const selectItem = getSelectBornItem('')

  const redo = () => {
    lastSelectedArmature.value!.borns = updated
    updateItem.redo()
  }
  return {
    name: 'Delete Born',
    undo: () => {
      lastSelectedArmature.value!.borns = current.concat()
      selectItem.undo()
      updateItem.undo()
    },
    redo,
  }
}
function getAddBornItem(
  borns: Born[],
  selectedBorns: IdMap<BornSelectedState>
): HistoryItem {
  const selectItems = borns.map((b, i) =>
    getSelectBornItem(b.id, selectedBorns[b.id], i !== 0)
  )

  const redo = () => {
    lastSelectedArmature.value!.borns = lastSelectedArmature.value!.borns.concat(
      borns
    )
    selectItems.forEach((i) => i.redo())
  }
  return {
    name: 'Add Born',
    undo: () => {
      lastSelectedArmature.value!.borns = lastSelectedArmature.value!.borns.slice(
        0,
        lastSelectedArmature.value!.borns.length - borns.length
      )
      selectItems.forEach((i) => i.undo())
    },
    redo,
  }
}
