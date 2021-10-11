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
import { HistoryItem, HistoryStore } from '/@/composables/stores/history'
import { convolute } from '/@/utils/histories'
import { fromEntityList, toEntityList } from '/@/models/entity'
import {
  useAttrsSelectable,
  useItemSelectable,
} from '/@/composables/selectable'
import { getNotDuplicatedName } from '/@/utils/relations'
import {
  getTreeIdPath,
  mapReduce,
  reduceToMap,
  splitList,
  toList,
} from '/@/utils/commons'
import { useEntities } from '/@/composables/entities'
import { SelectOptions } from '/@/composables/modes/types'
import { BoneConstraint } from '/@/utils/constraints'

export function createStore(historyStore: HistoryStore) {
  const armatureEntities = useEntities<Armature>('Armature')
  const armatures = computed(() =>
    toEntityList(armatureEntities.entities.value)
  )
  const armatureSelectable = useItemSelectable(
    'Armature',
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
    return toMap(lastSelectedArmature.value.bones.map((id) => boneById[id]))
  })
  const boneSelectable = useAttrsSelectable<Bone, BoneSelectedState>(
    'Bone',
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

  const constraintEntities = useEntities<BoneConstraint>('Constraint')
  const constraintMap = computed(() => {
    const byId = constraintEntities.entities.value.byId
    return toMap(
      (toList(boneMap.value) ?? []).flatMap((b) =>
        b.constraints.map((id) => byId[id])
      )
    )
  })

  const bonesByArmatureId = computed(() => {
    const boneById = boneEntities.entities.value.byId
    return mapReduce(toMap(armatures.value), (a) =>
      a.bones.map((id) => boneById[id])
    )
  })

  function initState(
    armatures: Armature[],
    bones: Bone[],
    constraints: BoneConstraint[]
  ) {
    armatureEntities.init(fromEntityList(armatures))
    armatureSelectable.getClearAllHistory().redo()
    boneEntities.init(fromEntityList(bones))
    boneSelectable.getClearAllHistory().redo()
    constraintEntities.init(fromEntityList(constraints))
  }

  function exportState() {
    return {
      armatures: armatures.value,
      bones: toEntityList(boneEntities.entities.value),
      constraints: toEntityList(constraintEntities.entities.value),
    }
  }

  function createDefaultEntities() {
    const bone = getBone(
      {
        name: 'bone',
        tail: { x: 200, y: 0 },
      },
      true
    )
    const armature = getArmature({
      id: 'initial-armature',
      name: 'armature',
      bones: [bone.id],
    })

    armatureEntities.getAddItemsHistory([armature]).redo()
    armatureSelectable.getSelectHistory(armature.id).redo()
    boneEntities.getAddItemsHistory([bone]).redo()
    boneSelectable.getClearAllHistory().redo()
  }

  function selectArmature(id: string = '') {
    if (lastSelectedArmatureId.value === id) return

    historyStore.push(
      convolute(
        id
          ? armatureSelectable.getSelectHistory(id)
          : armatureSelectable.getClearAllHistory(),
        [boneSelectable.getClearAllHistory()]
      ),
      true
    )
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

  function addArmature(id?: string, boneId?: string) {
    const bone = getBone(
      { id: boneId, name: 'bone', tail: { x: 200, y: 0 } },
      !boneId
    )
    const armature = getArmature(
      {
        id,
        name: getNotDuplicatedName(
          'armature',
          toList(armatureEntities.entities.value.byId).map((a) => a.name)
        ),
        bones: [bone.id],
      },
      !id
    )

    historyStore.push(
      convolute(armatureEntities.getAddItemsHistory([armature]), [
        armatureSelectable.getSelectHistory(armature.id),
        boneEntities.getAddItemsHistory([bone]),
        boneSelectable.getMultiSelectHistory({
          [bone.id]: { head: true, tail: true },
        }),
      ]),
      true
    )
  }

  function deleteArmature() {
    const armature = lastSelectedArmature.value
    if (!armature) return

    historyStore.push(
      convolute(armatureEntities.getDeleteItemsHistory([armature.id]), [
        boneEntities.getDeleteItemsHistory(armature.bones),
        boneSelectable.getClearAllHistory(),
      ]),
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

  function getBonesByArmatureId(armatureId: string): Bone[] {
    const boneById = boneEntities.entities.value.byId
    return armatureEntities.entities.value.byId[armatureId].bones.map(
      (id) => boneById[id]
    )
  }

  function selectAllBones() {
    if (Object.keys(boneMap.value).length === 0) return
    historyStore.push(boneSelectable.getSelectAllHistory(true), true)
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
          getMultiSelectHistory: boneSelectable.getMultiSelectHistory,
          getClearAllHistory: boneSelectable.getClearAllHistory,
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
      boneSelectable.getMultiSelectHistory(selectedStateMap, shift),
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
              toList(boneMap.value).map((a) => a.name)
            ),
            tail: { x: 100, y: 0 },
          },
          !id
        ),
      ],
      { head: true, tail: true }
    )
  }

  function addBones(
    bones: Bone[],
    selectedState?: BoneSelectedState,
    constraints?: BoneConstraint[]
  ) {
    const armature = lastSelectedArmature.value
    if (!armature) return

    historyStore.push(
      convolute(boneEntities.getAddItemsHistory(bones), [
        armatureEntities.getUpdateItemHistory({
          [armature.id]: {
            bones: armature.bones.concat(bones.map((b) => b.id)),
          },
        }),
        boneSelectable.getMultiSelectHistory(
          selectedState ? mapReduce(toMap(bones), () => selectedState) : {}
        ),
        constraints
          ? constraintEntities.getAddItemsHistory(constraints)
          : undefined,
      ]),
      true
    )
  }

  function deleteBone() {
    const armature = lastSelectedArmature.value
    if (!armature) return

    const targetMap = allSelectedBones.value
    const targetIds = Object.keys(targetMap)

    historyStore.push(
      convolute(
        boneEntities.getDeleteAndUpdateItemHistory(
          targetIds,
          armatureUtils.updateConnections(
            toList(boneMap.value).filter((val) => !targetMap[val.id])
          )
        ),
        [
          armatureEntities.getUpdateItemHistory({
            [armature.id]: {
              bones: armature.bones.filter((id) => !targetMap[id]),
            },
          }),
          boneSelectable.getClearAllHistory(),
          constraintEntities.getDeleteItemsHistory(
            targetIds.flatMap((id) => targetMap[id].constraints)
          ),
        ]
      ),
      true
    )
  }

  function dissolveBone() {
    const armature = lastSelectedArmature.value
    if (!armature) return

    const targetMap = allSelectedBones.value
    const targetIds = Object.keys(targetMap)

    const dissolved = armatureUtils.getUpdatedBonesByDissolvingBones(
      boneMap.value,
      constraintMap.value,
      Object.keys(targetMap)
    )

    historyStore.push(
      convolute(
        boneEntities.getDeleteAndUpdateItemHistory(targetIds, dissolved.bones),
        [
          armatureEntities.getUpdateItemHistory({
            [armature.id]: {
              bones: armature.bones.filter((id) => !targetMap[id]),
            },
          }),
          boneSelectable.getMultiSelectHistory({}),
          constraintEntities.getDeleteAndUpdateItemHistory(
            targetIds.flatMap((id) => targetMap[id].constraints),
            dissolved.constraints
          ),
        ]
      ),
      true
    )
  }

  function updateBones(diffMap: IdMap<Partial<Bone>>, seriesKey?: string) {
    if (!lastSelectedArmature.value) return

    historyStore.push(
      boneEntities.getUpdateItemHistory(
        mergeMap(
          diffMap,
          armatureUtils.updateConnections(
            toList(boneMap.value).map((b) => ({
              ...b,
              ...diffMap[b.id],
            }))
          )
        ),
        seriesKey
      ),
      true
    )
  }

  function updateBone(diff: Partial<Bone>, seriesKey?: string) {
    if (!lastSelectedArmature.value || !lastSelectedBone.value) return

    historyStore.push(
      boneEntities.getUpdateItemHistory(
        {
          [lastSelectedBone.value.id]: armatureUtils.fixConnection(
            toList(boneMap.value),
            { ...lastSelectedBone.value, ...diff }
          ),
        },
        seriesKey
      ),
      true
    )
  }

  function updateBoneName(name: string) {
    if (
      !name ||
      !lastSelectedBone.value ||
      lastSelectedBone.value.name === name
    )
      return

    historyStore.push(
      boneEntities.getUpdateItemHistory({
        [lastSelectedBone.value.id]: {
          name: getNotDuplicatedName(
            name,
            toList(boneMap.value).map((b) => b.name)
          ),
        },
      }),
      true
    )
  }

  function updateBoneConstraints(
    constraints: BoneConstraint[],
    seriesKey?: string
  ) {
    if (!lastSelectedArmature.value || !lastSelectedBone.value) return

    const all = constraintMap.value
    const currentMap = reduceToMap(
      lastSelectedBone.value.constraints,
      (id) => all[id]
    )
    const nextMap = toMap(constraints)

    const created = constraints.filter((c) => !currentMap[c.id])
    const deleted = lastSelectedBone.value.constraints.filter(
      (cid) => !nextMap[cid]
    )
    const updated = constraints.filter((c) => currentMap[c.id])

    historyStore.push(
      convolute(
        constraintEntities.getUpdateItemHistory(toMap(updated), seriesKey),
        [
          created.length + deleted.length > 0
            ? boneEntities.getUpdateItemHistory({
                [lastSelectedBone.value.id]: {
                  constraints: constraints.map((c) => c.id),
                },
              })
            : undefined,
          created.length > 0
            ? constraintEntities.getAddItemsHistory(created)
            : undefined,
          deleted.length > 0
            ? constraintEntities.getDeleteItemsHistory(deleted)
            : undefined,
        ]
      ),
      true
    )
  }

  function upsertBones(
    upserted: Bone[],
    selectedStateMap: IdMap<BoneSelectedState> = {},
    constraints?: BoneConstraint[]
  ) {
    const armature = lastSelectedArmature.value
    if (!armature) return

    const [updatedTargets, createdTargets] = splitList(
      upserted,
      (b) => !!boneMap.value[b.id]
    )

    const fixedDiff = armatureUtils.updateConnections(
      toList({
        ...boneMap.value,
        ...toMap(upserted),
      })
    )

    const created = createdTargets.map((b) =>
      fixedDiff[b.id] ? { ...b, ...fixedDiff[b.id] } : b
    )
    const updated = updatedTargets.map((b) =>
      fixedDiff[b.id] ? { ...b, ...fixedDiff[b.id] } : b
    )

    const _constraintMap = constraintMap.value

    historyStore.push(
      convolute(
        boneEntities.getAddItemsHistory(created),
        [
          armatureEntities.getUpdateItemHistory({
            [armature.id]: {
              bones: armature.bones.concat(created.map((b) => b.id)),
            },
          }),
          boneEntities.getUpdateItemHistory(toMap(updated)),
          boneSelectable.getMultiSelectHistory(selectedStateMap),
          constraints
            ? constraintEntities.getAddItemsHistory(
                constraints.filter((c) => !_constraintMap[c.id])
              )
            : undefined,
          constraints
            ? constraintEntities.getUpdateItemHistory(
                toMap(constraints.filter((c) => _constraintMap[c.id]))
              )
            : undefined,
        ],
        'Upsert Bone'
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
    bonesByArmatureId,

    initState,
    exportState,
    createDefaultEntities,

    selectArmature,
    selectAllArmature,
    addArmature,
    deleteArmature,
    updateArmatureName,

    getBonesByArmatureId,
    selectAllBones,
    selectBone,
    selectBones,
    addBone,
    addBones,
    deleteBone,
    dissolveBone,
    updateBones,
    updateBone,
    updateBoneName,
    updateBoneConstraints,
    upsertBones,
  }
}
export type IndexStore = ReturnType<typeof createStore>

const store = createStore(useHistoryStore())
export function useStore() {
  return store
}

function getSelectBoneItem(
  attrsSelectable: {
    getSelectedMap(): IdMap<BoneSelectedState>
    getMultiSelectHistory(
      val: IdMap<BoneSelectedState>,
      shift?: boolean
    ): HistoryItem
    getClearAllHistory(): HistoryItem
  },
  bones: Bone[],
  id: string,
  selectedState: BoneSelectedState = { head: true, tail: true },
  shift = false,
  ignoreConnection = false
): HistoryItem {
  if (!id) return attrsSelectable.getClearAllHistory()

  return attrsSelectable.getMultiSelectHistory(
    mergeMap(
      {
        ...(shift ? attrsSelectable.getSelectedMap() : {}),
        [id]: selectedState,
      },
      armatureUtils.selectBone(bones, id, selectedState, ignoreConnection)
    ),
    shift
  )
}
