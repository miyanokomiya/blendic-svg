import { reactive, computed, watch } from 'vue'
import { getNextName } from '/@/utils/relations'
import {
  Armature,
  BornSelectedState,
  getBorn,
  getArmature,
} from '/@/models/index'
import * as armatureUtils from '/@/utils/armatures'
import merge from 'just-merge'

type IdMap = { [id: string]: boolean }

const armature = reactive<Armature>(
  getArmature(
    {
      name: '1',
      borns: [
        getBorn(
          {
            name: '1',
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
  selectedArmatures: {} as IdMap,
  selectedBorns: {} as { [id: string]: BornSelectedState },
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

watch(
  () => state.lastSelectedArmatureId,
  () => (state.lastSelectedBornId = '')
)

watch(
  () => state.selectedBorns,
  () => {
    if (!(state.lastSelectedBornId in state.selectedBorns)) {
      state.lastSelectedBornId = ''
    }
  }
)

function selectArmature(id: string = '') {
  state.lastSelectedArmatureId = id
  state.lastSelectedBornId = ''
  state.selectedBorns = {}
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
function setSelectedBorns(data: { [id: string]: BornSelectedState }) {
  state.selectedBorns = data
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

export function useStore() {
  return {
    state,
    lastSelectedArmature,
    lastSelectedBorn,
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
  }
}
