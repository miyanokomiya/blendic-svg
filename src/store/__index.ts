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

import { computed } from 'vue'
import {
  Armature,
  getBone,
  getArmature,
  toMap,
  Bone,
  BoneSelectedState,
  IdMap,
  mergeMap,
} from '/@/models/index'
import * as armatureUtils from '/@/utils/armatures'
import { IVec2 } from 'okageo'
import { useHistoryStore } from './history'
import { HistoryItem } from '/@/composables/stores/history'
import { convolute, SelectedItemAccessor } from '/@/utils/histories'
import { fromEntityList, toEntityList } from '/@/models/entity'
import {
  useAttrsSelectable,
  useItemSelectable,
} from '/@/composables/selectable'
import { getNotDuplicatedName } from '/@/utils/relations'
import { getTreeIdPath, mapReduce, reduceToMap, toList } from '/@/utils/commons'
import { useEntities } from '/@/composables/entities'
import { SelectOptions } from '/@/composables/modes/types'

const historyStore = useHistoryStore()

export function createStore() {
  const armatureEntities = useEntities<Armature>('Armature')
  const armatures = computed(() =>
    toEntityList(armatureEntities.entities.value)
  )
  const armatureSelectable = useItemSelectable(
    () => armatureEntities.entities.value.byId
  )
  const lastSelectedArmatureId = armatureSelectable.lastSelectedId
  const lastSelectedArmature = computed(() =>
    lastSelectedArmatureId.value
      ? armatureEntities.entities.value.byId[lastSelectedArmatureId.value]
      : undefined
  )

  const boneEntities = useEntities<Bone>('Bone')
  const boneMap = computed(() => {
    if (!lastSelectedArmature.value) return {}

    const boneById = boneEntities.entities.value.byId
    return toMap(lastSelectedArmature.value.b_ones.map((id) => boneById[id]))
  })
  const boneSelectable = useAttrsSelectable<Bone, BoneSelectedState>(
    () => boneMap.value,
    ['head', 'tail']
  )
  const selectedBones = boneSelectable.selectedMap
  const lastSelectedBoneId = boneSelectable.lastSelectedId
  const lastSelectedBone = computed(() =>
    lastSelectedBoneId.value
      ? boneEntities.entities.value.byId[lastSelectedBoneId.value]
      : undefined
  )
  const allSelectedBones = computed(() => {
    const byId = boneEntities.entities.value.byId
    return toMap(boneSelectable.allAttrsSelectedIds.value.map((id) => byId[id]))
  })
  const selectedBonesOrigin = computed(
    (): IVec2 =>
      armatureUtils.getSelectedBonesOrigin(boneMap.value, selectedBones.value)
  )

  const constraintMap = computed(() =>
    toMap((toList(boneMap.value) ?? []).flatMap((b) => b.constraints))
  )

  function initState(initArmatures: Armature[]) {
    armatureEntities.init(fromEntityList(initArmatures))
    armatureSelectable.clearAll()
    boneSelectable.clearAll()
  }

  function createDefaultEntities() {
    const bone = getBone(
      {
        name: 'bone',
        head: { x: 20, y: 200 },
        tail: { x: 220, y: 200 },
      },
      true
    )
    const armature = getArmature({
      id: 'initial-armature',
      name: 'armature',
      b_ones: [bone.id],
    })

    armatureEntities.getAddItemsHistory([armature]).redo()
    armatureSelectable.select(armature.id)
    boneEntities.getAddItemsHistory([bone]).redo()
  }

  function selectArmature(id: string = '') {
    if (lastSelectedArmatureId.value === id) return

    const item = getSelectArmatureItem(
      {
        get: () => armatureSelectable.selectedMap.value,
        set: (val) => armatureSelectable.multiSelect(Object.keys(val)),
      },
      id
    )
    historyStore.push(item, true)
  }

  function selectAllArmature() {
    if (lastSelectedArmatureId.value) {
      selectArmature()
    } else {
      const id = armatureEntities.entities.value.allIds[0]
      if (id) {
        selectArmature(id)
      }
    }
  }

  function addArmature(id?: string) {
    const created = getArmature(
      {
        id,
        name: getNotDuplicatedName(
          'armature',
          toList(armatureEntities.entities.value.byId).map((a) => a.name)
        ),
        bones: [getBone({ name: 'bone', tail: { x: 100, y: 0 } }, true)],
      },
      !id
    )

    historyStore.push(
      convolute(armatureEntities.getAddItemsHistory([created]), [
        getSelectArmatureItem(
          {
            get: () => armatureSelectable.selectedMap.value,
            set: (val) => armatureSelectable.multiSelect(Object.keys(val)),
          },
          created.id
        ),
      ]),
      true
    )
  }

  function deleteArmature() {
    if (!lastSelectedArmatureId.value) return

    historyStore.push(
      armatureEntities.getDeleteItemsHistory(
        Object.keys(armatureSelectable.selectedMap.value)
      ),
      true
    )
  }

  function updateArmatureName(name: string) {
    if (
      !name ||
      !lastSelectedArmature.value ||
      lastSelectedArmature.value.name === name
    )
      return

    historyStore.push(
      armatureEntities.getUpdateItemHistory({
        [lastSelectedArmature.value!.id]: {
          name: getNotDuplicatedName(
            name,
            toList(armatureEntities.entities.value.byId).map((a) => a.name)
          ),
        },
      }),
      true
    )
  }

  function selectAllBone() {
    if (!lastSelectedArmature.value) return
    historyStore.push(getSelectAllBoneItem(boneSelectable), true)
  }

  function _selectBone(
    id: string = '',
    selectedState: BoneSelectedState = { head: true, tail: true },
    shift = false,
    ignoreConnection = false
  ) {
    if (!lastSelectedArmature.value) return
    // skip same selected state
    if (!lastSelectedBone.value && !id) return
    if (
      boneSelectable.lastSelectedId.value === id &&
      boneSelectable.isAttrsSelected({ [id]: selectedState }) &&
      Object.keys(allSelectedBones.value).length === 1
    )
      return

    historyStore.push(
      getSelectBoneItem(
        {
          getSelectedMap: () => boneSelectable.selectedMap.value,
          multiSelect: boneSelectable.multiSelect,
        },
        toList(boneMap.value),
        id,
        selectedState,
        shift,
        ignoreConnection
      ),
      true
    )
  }

  function selectBones(
    selectedStateMap: IdMap<BoneSelectedState>,
    shift = false
  ) {
    // select nothing -> nothing
    if (
      Object.keys(selectedStateMap).length === 0 &&
      !boneSelectable.lastSelectedId.value
    )
      return

    historyStore.push(
      getSelectBonesItem(
        {
          getSelectedMap: () => boneSelectable.selectedMap.value,
          multiSelect: boneSelectable.multiSelect,
        },
        selectedStateMap,
        shift
      ),
      true
    )
  }

  function selectBone(
    id?: string,
    selectedState: BoneSelectedState = { head: true, tail: true },
    options?: SelectOptions,
    ignoreConnection = false
  ) {
    if (id && options?.ctrl && lastSelectedBone.value) {
      selectBones(
        reduceToMap(
          getTreeIdPath(boneMap.value, lastSelectedBone.value.id, id),
          () => ({ head: true, tail: true })
        ),
        true
      )
    } else {
      _selectBone(id, selectedState, options?.shift, ignoreConnection)
    }
  }

  function addBone(id?: string) {
    if (!lastSelectedArmature.value) return

    addBones(
      [
        getBone(
          {
            id,
            name: getNotDuplicatedName(
              'bone',
              lastSelectedArmature.value.bones.map((a) => a.name)
            ),
            tail: { x: 100, y: 0 },
          },
          !id
        ),
      ],
      { head: true, tail: true }
    )
  }

  function addBones(bones: Bone[], selectedState?: BoneSelectedState) {
    const armature = lastSelectedArmature.value
    if (!armature) return

    historyStore.push(
      convolute(boneEntities.getAddItemsHistory(bones), [
        armatureEntities.getUpdateItemHistory({
          [armature.id]: {
            b_ones: armature.b_ones.concat(bones.map((b) => b.id)),
          },
        }),
        getSelectBonesItem(
          {
            getSelectedMap: () => boneSelectable.selectedMap.value,
            multiSelect: boneSelectable.multiSelect,
          },
          selectedState ? mapReduce(toMap(bones), () => selectedState) : {}
        ),
      ]),
      true
    )
  }

  function deleteBone() {
    const armature = lastSelectedArmature.value
    if (!armature) return

    const targetMap = boneSelectable.selectedMap.value

    historyStore.push(
      convolute(
        boneEntities.getDeleteAndUpdateItemHistory(
          Object.keys(targetMap),
          armatureUtils.updateConnections(
            toList(boneMap.value).filter((val) => !targetMap[val.id])
          )
        ),
        [
          armatureEntities.getUpdateItemHistory({
            [armature.id]: {
              b_ones: armature.b_ones.filter((id) => !targetMap[id]),
            },
          }),
          getSelectBonesItem(
            {
              getSelectedMap: () => boneSelectable.selectedMap.value,
              multiSelect: boneSelectable.multiSelect,
            },
            {}
          ),
        ]
      ),
      true
    )
  }

  return {
    armatures,
    lastSelectedArmatureId,
    lastSelectedArmature,

    boneMap,
    selectedBones,
    lastSelectedBoneId,
    lastSelectedBone,
    allSelectedBones,
    selectedBonesOrigin,

    constraintMap,

    initState,
    createDefaultEntities,

    selectArmature,
    selectAllArmature,
    addArmature,
    deleteArmature,
    updateArmatureName,

    selectAllBone,
    selectBone,
    selectBones,
    addBone,
    addBones,
    deleteBone,
  }
}
export type IndexStore = ReturnType<typeof createStore>

const store = createStore()
export function useStore() {
  return store
}

function getSelectArmatureItem(
  selectedAccessor: SelectedItemAccessor,
  id: string
): HistoryItem {
  const current = { ...selectedAccessor.get() }

  return {
    name: 'Select Armature',
    undo: () => {
      selectedAccessor.set({ ...current })
    },
    redo: () => {
      selectedAccessor.set(id ? { [id]: true } : {})
    },
  }
}

function getSelectBonesItem(
  attrsSelectable: {
    getSelectedMap(): IdMap<BoneSelectedState>
    multiSelect(val: IdMap<BoneSelectedState>, ctrl?: boolean): void
  },
  selectedStateMap: IdMap<BoneSelectedState>,
  shift = false
): HistoryItem {
  const before = { ...attrsSelectable.getSelectedMap() }

  return {
    name: 'Select Bone',
    undo: () => {
      attrsSelectable.multiSelect(before)
    },
    redo: () => {
      attrsSelectable.multiSelect(selectedStateMap, shift)
    },
  }
}

function getSelectBoneItem(
  attrsSelectable: {
    getSelectedMap(): IdMap<BoneSelectedState>
    multiSelect(val: IdMap<BoneSelectedState>, ctrl?: boolean): void
  },
  bones: Bone[],
  id: string,
  selectedState: BoneSelectedState = { head: true, tail: true },
  shift = false,
  ignoreConnection = false
): HistoryItem {
  const before = { ...attrsSelectable.getSelectedMap() }

  return {
    name: 'Select Bone',
    undo: () => {
      attrsSelectable.multiSelect(before)
    },
    redo: () => {
      attrsSelectable.multiSelect(
        id
          ? mergeMap(
              {
                ...(shift ? attrsSelectable.getSelectedMap() : {}),
                [id]: selectedState,
              },
              armatureUtils.selectBone(
                bones,
                id,
                selectedState,
                ignoreConnection
              )
            )
          : {}
      )
    },
  }
}

function getSelectAllBoneItem(attrsSelectable: {
  selectAll(toggle?: boolean): void
  createSnapshot(): [string, BoneSelectedState][]
  restore(snapshot: [string, BoneSelectedState][]): void
}): HistoryItem {
  const snapshot = attrsSelectable.createSnapshot()

  return {
    name: 'Select Bone',
    undo: () => {
      attrsSelectable.restore(snapshot)
    },
    redo: () => {
      attrsSelectable.selectAll(true)
    },
  }
}
