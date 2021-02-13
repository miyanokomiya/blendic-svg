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

const lastSelectedArmature = computed(() =>
  state.armatures.find((a) => a.id === state.lastSelectedArmatureId)
)
const lastSelectedBorn = computed(() => {
  if (!lastSelectedArmature.value) return
  return lastSelectedArmature.value.borns.find(
    (b) => b.id === state.lastSelectedBornId
  )
})

const bornMap = computed(() => toMap(lastSelectedArmature.value?.borns ?? []))

const selectedBornsOrigin = computed(
  (): IVec2 =>
    armatureUtils.getSelectedBornsOrigin(bornMap.value, state.selectedBorns)
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
  state.lastSelectedArmatureId = id
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

  lastSelectedArmature.value.name = name
}
function deleteArmature() {
  state.armatures = state.armatures.filter(
    (a) => a.id !== state.lastSelectedArmatureId
  )
}
function addArmature() {
  state.armatures.push(
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
