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

import { reactive, computed, watch } from 'vue'
import { getNextName } from '/@/utils/relations'
import {
  Armature,
  BoneSelectedState,
  getBone,
  getArmature,
  toMap,
  Bone,
  IdMap,
  isSameBoneSelectedState,
  isBoneSelected,
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
      bones: [
        getBone(
          {
            name: 'bone',
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
  lastSelectedBoneId: '',
  selectedArmatures: {} as IdMap<boolean>,
  selectedBones: {} as IdMap<BoneSelectedState>,
})

function initState(initArmatures: Armature[]) {
  state.armatures = initArmatures
  state.lastSelectedArmatureId = ''
  state.selectedArmatures = {}
  state.selectedBones = {}
}

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

const lastSelectedBoneIndex = computed(() => {
  if (!lastSelectedArmature.value) return -1
  return lastSelectedArmature.value.bones.findIndex(
    (b) =>
      b.id === state.lastSelectedBoneId &&
      (state.selectedBones[state.lastSelectedBoneId]?.head ||
        state.selectedBones[state.lastSelectedBoneId]?.tail)
  )
})
const lastSelectedBone = computed(() => {
  if (!lastSelectedArmature.value) return
  return lastSelectedBoneIndex.value !== -1
    ? lastSelectedArmature.value.bones[lastSelectedBoneIndex.value]
    : undefined
})

const armatureMap = computed(() => toMap(state.armatures))
const boneMap = computed(() => toMap(lastSelectedArmature.value?.bones ?? []))

const selectedBonesOrigin = computed(
  (): IVec2 =>
    armatureUtils.getSelectedBonesOrigin(boneMap.value, state.selectedBones)
)

const allSelectedBones = computed(() => {
  return armatureUtils.getAllSelectedBones(boneMap.value, state.selectedBones)
})

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
  () => state.selectedBones,
  () => {
    if (!isBoneSelected(state.selectedBones[state.lastSelectedBoneId])) {
      const otherKeys = Object.keys(state.selectedBones)
      state.lastSelectedBoneId = otherKeys.length > 0 ? otherKeys[0] : ''
    }
  }
)
watch(
  () => boneMap.value,
  () => {
    // unselect unexisted bones
    state.selectedBones = Object.keys(state.selectedBones).reduce<
      IdMap<BoneSelectedState>
    >((m, id) => {
      return boneMap.value[id]
        ? {
            ...m,
            [id]: state.selectedBones[id],
          }
        : m
    }, {})
  }
)

function selectAllArmature() {
  // TODO: multi select armatures
  if (state.lastSelectedArmatureId) {
    selectArmature()
  } else {
    const armature = state.armatures[0]
    if (!armature) return

    selectArmature(armature.id)
  }
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
        bones: [getBone({ name: 'bone', tail: { x: 100, y: 0 } }, true)],
      },
      true
    )
  )
  item.redo()
  historyStore.push(item)
}

function selectAllBone() {
  if (!lastSelectedArmature.value) return
  if (
    Object.keys(allSelectedBones.value).length ===
    Object.keys(boneMap.value).length
  ) {
    selectBone()
  } else {
    const item = getSelectAllBoneItem()
    item.redo()
    historyStore.push(item)
  }
}
function selectBone(
  id: string = '',
  selectedState: BoneSelectedState = { head: true, tail: true },
  shift = false,
  ignoreConnection = false
) {
  if (!lastSelectedArmature.value) return
  // skip same selected state
  if (!lastSelectedBone.value && !id) return
  if (
    state.lastSelectedBoneId === id &&
    isSameBoneSelectedState(state.selectedBones[id], selectedState) &&
    Object.keys(allSelectedBones.value).length === 1
  )
    return

  const item = getSelectBoneItem(id, selectedState, shift, ignoreConnection)
  item.redo()
  historyStore.push(item)
}
function selectBones(
  selectedStateMap: IdMap<BoneSelectedState>,
  shift = false
) {
  // select nothing -> nothing
  if (Object.keys(selectedStateMap).length === 0 && !state.lastSelectedBoneId)
    return

  const item = getSelectBonesItem(selectedStateMap, shift)
  item.redo()
  historyStore.push(item)
}

function deleteBone() {
  if (!lastSelectedArmature.value) return

  const item = getDeleteBoneItem()
  item.redo()
  historyStore.push(item)
}
function addBone() {
  if (!lastSelectedArmature.value) return

  addBones([
    getBone(
      {
        name: getNextName(
          'bone',
          lastSelectedArmature.value.bones.map((a) => a.name)
        ),
        tail: { x: 100, y: 0 },
      },
      true
    ),
  ])
}
function addBones(bones: Bone[], selectedState?: BoneSelectedState) {
  if (!lastSelectedArmature.value) return

  const item = getAddBoneItem(
    bones,
    bones.reduce<IdMap<BoneSelectedState>>((p, bone) => {
      if (selectedState) p[bone.id] = { ...selectedState }
      return p
    }, {})
  )
  item.redo()
  historyStore.push(item)
}
function updateBones(diffMap: IdMap<Partial<Bone>>, seriesKey?: string) {
  if (!lastSelectedArmature.value) return

  const item = getUpdateBonesItem(diffMap, seriesKey)
  item.redo()
  historyStore.push(item)
}
function updateBone(diff: Partial<Bone>) {
  if (!lastSelectedArmature.value) return
  if (!lastSelectedBone.value) return

  const item = getUpdateBoneItem(
    armatureUtils.fixConnection(lastSelectedArmature.value.bones, {
      ...lastSelectedBone.value,
      ...diff,
    })
  )
  item.redo()
  historyStore.push(item)
}

export function useStore() {
  return {
    initState,
    state,
    lastSelectedArmature,
    lastSelectedBone,
    boneMap,
    allSelectedBones,
    selectedBonesOrigin,
    selectAllArmature,
    selectArmature,
    updateArmatureName,
    deleteArmature,
    addArmature,
    selectAllBone,
    selectBone,
    selectBones,
    deleteBone,
    addBone,
    addBones,
    updateBones,
    updateBone,
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

function getSelectBoneItem(
  id: string,
  selectedState: BoneSelectedState = { head: true, tail: true },
  shift = false,
  ignoreConnection = false
): HistoryItem {
  const current = { ...state.selectedBones }
  const currentLast = state.lastSelectedBoneId

  const redo = () => {
    state.selectedBones = id
      ? mergeMap(
          { ...(shift ? state.selectedBones : {}), [id]: selectedState },
          armatureUtils.selectBone(
            lastSelectedArmature.value!,
            id,
            selectedState,
            ignoreConnection
          )
        )
      : {}
    state.lastSelectedBoneId = id
  }
  return {
    name: 'Select Bone',
    undo: () => {
      state.selectedBones = { ...current }
      state.lastSelectedBoneId = currentLast
    },
    redo,
  }
}

function getAllBoneSelectedStateMap(): IdMap<BoneSelectedState> {
  if (!lastSelectedArmature.value) return {}

  return lastSelectedArmature.value.bones.reduce<IdMap<BoneSelectedState>>(
    (p, b) => {
      p[b.id] = { head: true, tail: true }
      return p
    },
    {}
  )
}

function getSelectAllBoneItem(): HistoryItem {
  const current = { ...state.selectedBones }
  const currentLast = state.lastSelectedBoneId

  const redo = () => {
    state.selectedBones = getAllBoneSelectedStateMap()
  }
  return {
    name: 'Select All Bone',
    undo: () => {
      state.selectedBones = { ...current }
      state.lastSelectedBoneId = currentLast
    },
    redo,
  }
}

function getSelectBonesItem(
  selectedStateMap: IdMap<BoneSelectedState>,
  shift = false
): HistoryItem {
  const current = { ...state.selectedBones }
  const currentLast = state.lastSelectedBoneId

  const redo = () => {
    if (shift) {
      state.selectedBones = mergeMap(state.selectedBones, selectedStateMap)
    } else {
      state.selectedBones = selectedStateMap
    }

    const last = Object.keys(state.selectedBones).find(
      (s) => state.selectedBones[s].head || state.selectedBones[s].tail
    )
    state.lastSelectedBoneId = last ?? ''
  }
  return {
    name: 'Select Bones',
    undo: () => {
      state.selectedBones = { ...current }
      state.lastSelectedBoneId = currentLast
    },
    redo,
  }
}

function getUpdateBoneItem(updated: Partial<Bone>): HistoryItem {
  const current = getOriginPartial(lastSelectedBone.value!, updated)

  const redo = () => {
    const index = lastSelectedBoneIndex.value
    lastSelectedArmature.value!.bones[index] = {
      ...lastSelectedArmature.value!.bones[index],
      ...updated,
    }
  }
  return {
    name: 'Update Bone',
    undo: () => {
      const index = lastSelectedBoneIndex.value
      lastSelectedArmature.value!.bones[index] = {
        ...lastSelectedArmature.value!.bones[index],
        ...current,
      }
    },
    redo,
  }
}
function getUpdateBonesItem(
  updated: IdMap<Partial<Bone>>,
  seriesKey?: string
): HistoryItem {
  const updatedMap = mergeMap<Partial<Bone>>(
    updated,
    armatureUtils.updateConnections(
      lastSelectedArmature.value!.bones.map((b) => ({
        ...b,
        ...updated[b.id],
      }))
    )
  )

  const current = Object.keys(updatedMap).reduce<IdMap<Partial<Bone>>>(
    (p, id) => {
      if (boneMap.value[id])
        p[id] = getOriginPartial(boneMap.value[id], updatedMap[id])
      return p
    },
    {}
  )

  const redo = () => {
    lastSelectedArmature.value!.bones = lastSelectedArmature.value!.bones.map(
      (b) => ({
        ...b,
        ...updatedMap[b.id],
      })
    )
  }
  return {
    name: 'Update Bone',
    undo: () => {
      lastSelectedArmature.value!.bones = lastSelectedArmature.value!.bones.map(
        (b) => ({
          ...b,
          ...current[b.id],
        })
      )
    },
    redo,
    seriesKey,
  }
}
function getDeleteBoneItem(): HistoryItem {
  const current = lastSelectedArmature.value!.bones.concat()
  const updated = lastSelectedArmature.value!.bones.filter(
    (b) => !state.selectedBones[b.id]
  )

  const updateItem = getUpdateBonesItem(
    armatureUtils.updateConnections(updated)
  )
  const selectItem = getSelectBoneItem('')

  const redo = () => {
    lastSelectedArmature.value!.bones = updated
    updateItem.redo()
  }
  return {
    name: 'Delete Bone',
    undo: () => {
      lastSelectedArmature.value!.bones = current.concat()
      selectItem.undo()
      updateItem.undo()
    },
    redo,
  }
}
function getAddBoneItem(
  bones: Bone[],
  selectedBones: IdMap<BoneSelectedState>
): HistoryItem {
  const selectItems = bones.map((b, i) =>
    getSelectBoneItem(b.id, selectedBones[b.id], i !== 0)
  )

  const redo = () => {
    lastSelectedArmature.value!.bones = lastSelectedArmature.value!.bones.concat(
      bones
    )
    selectItems.forEach((i) => i.redo())
  }
  return {
    name: 'Add Bone',
    undo: () => {
      lastSelectedArmature.value!.bones = lastSelectedArmature.value!.bones.slice(
        0,
        lastSelectedArmature.value!.bones.length - bones.length
      )
      selectItems.forEach((i) => i.undo())
    },
    redo,
  }
}
