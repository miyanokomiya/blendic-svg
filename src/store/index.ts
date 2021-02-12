import { reactive, computed } from 'vue'
import { Armature, getBorn, getArmature } from '/@/models/index'
import * as armatureUtils from '/@/utils/armatures'

const armature = reactive<Armature>(
  getArmature({
    name: '1',
    borns: [
      getBorn({
        name: '1',
        head: { x: 20, y: 200 },
        tail: { x: 220, y: 200 },
      }),
    ],
  })
)

const state = reactive({
  armatures: [armature],
  lastSelectedArmatureName: '',
  lastSelectedBornName: '',
})

const lastSelectedArmature = computed(() =>
  state.armatures.find((a) => a.name === state.lastSelectedArmatureName)
)
const lastSelectedBorn = computed(() => {
  if (!lastSelectedArmature.value) return
  return lastSelectedArmature.value.borns.find(
    (b) => b.name === state.lastSelectedBornName
  )
})

function selectArmature(name: string = '') {
  state.lastSelectedArmatureName = name
  state.lastSelectedBornName = ''
}
function selectBorn(name: string = '') {
  state.lastSelectedBornName = name
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
function setBornParent(parentKey: string = '') {
  if (!lastSelectedArmature.value) return
  if (!lastSelectedBorn.value) return

  lastSelectedBorn.value.parentKey = parentKey
  if (lastSelectedBorn.value.connected) {
    lastSelectedArmature.value.borns = armatureUtils.fixConnections(
      lastSelectedArmature.value.borns
    )
  }
}
function updateBornName(name: string) {
  if (!lastSelectedArmature.value) return
  if (!lastSelectedBorn.value) return

  lastSelectedArmature.value.borns = armatureUtils.updateBornName(
    lastSelectedArmature.value.borns,
    lastSelectedBorn.value.name,
    name
  )
}
function updateArmatureName(name: string) {
  if (!lastSelectedArmature.value) return

  lastSelectedArmature.value.name = name
  state.lastSelectedArmatureName = name
}

export function useStore() {
  return {
    state,
    lastSelectedArmature,
    lastSelectedBorn,
    selectArmature,
    selectBorn,
    setBornConnection,
    setBornParent,
    updateBornName,
    updateArmatureName,
  }
}
