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
import { HistoryStore } from '/@/composables/stores/history'
import { fromEntityList, toEntityList } from '/@/models/entity'
import {
  useAttrsSelectable,
  useItemSelectable,
} from '/@/composables/selectable'
import { getNotDuplicatedName } from '/@/utils/relations'
import {
  dropMap,
  getTreeIdPath,
  mapReduce,
  reduceToMap,
  shallowEqual,
  splitList,
  toList,
  xor,
} from '/@/utils/commons'
import { useEntities } from '/@/composables/entities'
import { SelectOptions } from '/@/composables/modes/types'
import { BoneConstraint } from '/@/utils/constraints'

export function createStore(historyStore: HistoryStore) {
  const armatureEntities = useEntities<Armature>('Armature')
  const boneEntities = useEntities<Bone>('Bone')
  const constraintEntities = useEntities<BoneConstraint>('Constraint')
  const armatureSelectable = useItemSelectable(
    'Armature',
    () => armatureEntities.entities.value.byId
  )
  const boneSelectable = useAttrsSelectable<Bone, BoneSelectedState>(
    'Bone',
    () => boneMap.value,
    ['head', 'tail']
  )

  historyStore.defineReducers(armatureEntities.reducers)
  historyStore.defineReducers(boneEntities.reducers)
  historyStore.defineReducers(constraintEntities.reducers)
  historyStore.defineReducers(armatureSelectable.reducers)
  historyStore.defineReducers(boneSelectable.reducers)

  const armatures = computed(() =>
    toEntityList(armatureEntities.entities.value)
  )
  const lastSelectedArmatureId = armatureSelectable.lastSelectedId
  const lastSelectedArmature = computed(() =>
    lastSelectedArmatureId.value
      ? armatureEntities.entities.value.byId[lastSelectedArmatureId.value]
      : undefined
  )

  const boneMap = computed(() => {
    if (!lastSelectedArmature.value) return {}

    const boneById = boneEntities.entities.value.byId
    return toMap(lastSelectedArmature.value.bones.map((id) => boneById[id]))
  })
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
    boneEntities.init(fromEntityList(bones))
    constraintEntities.init(fromEntityList(constraints))
    armatureSelectable.init([])
    boneSelectable.init({})
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

    armatureEntities.init(fromEntityList([armature]))
    boneEntities.init(fromEntityList([bone]))
    armatureSelectable.init([armature.id])
    boneSelectable.init({})
  }

  function selectArmature(id: string = '') {
    if (lastSelectedArmatureId.value === id) return

    historyStore.dispatch(armatureSelectable.createSelectAction(id), [
      boneSelectable.createClearAllAction(),
    ])
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

    historyStore.dispatch(armatureEntities.createAddAction([armature]), [
      armatureSelectable.createSelectAction(armature.id),
      boneEntities.createAddAction([bone]),
      boneSelectable.createMultiSelectAction({
        [bone.id]: { head: true, tail: true },
      }),
    ])
  }

  function deleteArmature() {
    const armature = lastSelectedArmature.value
    if (!armature) return

    const boneById = boneEntities.entities.value.byId

    historyStore.dispatch(armatureEntities.createDeleteAction([armature.id]), [
      boneEntities.createDeleteAction(armature.bones),
      constraintEntities.createDeleteAction(
        armature.bones.flatMap((bid) => boneById[bid].constraints)
      ),
      boneSelectable.createClearAllAction(),
    ])
  }

  function updateArmatureName(name: string) {
    if (
      !name ||
      !lastSelectedArmature.value ||
      lastSelectedArmature.value.name === name
    )
      return

    historyStore.dispatch(
      armatureEntities.createUpdateAction({
        [lastSelectedArmature.value!.id]: {
          name: getNotDuplicatedName(
            name,
            toList(armatureEntities.entities.value.byId).map((a) => a.name)
          ),
        },
      })
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
    historyStore.dispatch(boneSelectable.createSelectAllAction(true))
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
      Object.keys(selectedBones.value).length === 1 &&
      !shift &&
      shallowEqual(selectedBones.value[id], selectedState)
    )
      return

    if (!id) {
      historyStore.dispatch(boneSelectable.createClearAllAction())
    } else {
      let nextState: BoneSelectedState = {}

      if (shift) {
        const current: BoneSelectedState = selectedBones.value[id] ?? {}
        if (xor(current.head, selectedState.head)) nextState.head = true
        if (xor(current.tail, selectedState.tail)) nextState.tail = true
      } else {
        nextState = selectedState
      }

      historyStore.dispatch(
        boneSelectable.createMultiSelectAction(
          mergeMap(
            {
              ...(shift
                ? dropMap(boneSelectable.selectedMap.value, { [id]: true })
                : {}),
              ...(Object.keys(nextState).length > 0 ? { [id]: nextState } : {}),
            },
            armatureUtils.selectBone(
              toList(boneMap.value),
              id,
              nextState,
              ignoreConnection
            )
          )
        )
      )
    }
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

    historyStore.dispatch(
      boneSelectable.createMultiSelectAction(selectedStateMap, shift)
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

    historyStore.dispatch(boneEntities.createAddAction(bones), [
      armatureEntities.createUpdateAction({
        [armature.id]: {
          bones: armature.bones.concat(bones.map((b) => b.id)),
        },
      }),
      boneSelectable.createMultiSelectAction(
        selectedState ? mapReduce(toMap(bones), () => selectedState) : {}
      ),
      ...(constraints ? [constraintEntities.createAddAction(constraints)] : []),
    ])
  }

  function deleteBone() {
    const armature = lastSelectedArmature.value
    if (!armature) return

    const targetMap = allSelectedBones.value
    const targetIds = Object.keys(targetMap)

    historyStore.dispatch(boneEntities.createDeleteAction(targetIds), [
      boneEntities.createUpdateAction(
        armatureUtils.updateConnections(
          toList(boneMap.value).filter((val) => !targetMap[val.id])
        )
      ),
      armatureEntities.createUpdateAction({
        [armature.id]: {
          bones: armature.bones.filter((id) => !targetMap[id]),
        },
      }),
      constraintEntities.createDeleteAction(
        targetIds.flatMap((id) => targetMap[id].constraints)
      ),
      boneSelectable.createClearAllAction(),
    ])
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

    historyStore.dispatch(boneEntities.createDeleteAction(targetIds), [
      boneEntities.createUpdateAction(dissolved.bones),
      armatureEntities.createUpdateAction({
        [armature.id]: {
          bones: armature.bones.filter((id) => !targetMap[id]),
        },
      }),
      constraintEntities.createDeleteAction(
        targetIds.flatMap((id) => targetMap[id].constraints)
      ),
      constraintEntities.createUpdateAction(dissolved.constraints),
      boneSelectable.createClearAllAction(),
    ])
  }

  function updateBones(diffMap: IdMap<Partial<Bone>>, seriesKey?: string) {
    if (!lastSelectedArmature.value) return

    historyStore.dispatch(
      boneEntities.createUpdateAction(
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
      )
    )
  }

  function updateBone(diff: Partial<Bone>, seriesKey?: string) {
    if (!lastSelectedArmature.value || !lastSelectedBone.value) return

    historyStore.dispatch(
      boneEntities.createUpdateAction(
        {
          [lastSelectedBone.value.id]: armatureUtils.fixConnection(
            toList(boneMap.value),
            { ...lastSelectedBone.value, ...diff }
          ),
        },
        seriesKey
      )
    )
  }

  function updateBoneName(name: string) {
    if (
      !name ||
      !lastSelectedBone.value ||
      lastSelectedBone.value.name === name
    )
      return

    historyStore.dispatch(
      boneEntities.createUpdateAction({
        [lastSelectedBone.value.id]: {
          name: getNotDuplicatedName(
            name,
            toList(boneMap.value).map((b) => b.name)
          ),
        },
      })
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

    historyStore.dispatch(
      constraintEntities.createUpdateAction(toMap(updated), seriesKey),
      [
        created.length + deleted.length > 0
          ? boneEntities.createUpdateAction({
              [lastSelectedBone.value.id]: {
                constraints: constraints.map((c) => c.id),
              },
            })
          : undefined,
        created.length > 0
          ? constraintEntities.createAddAction(created)
          : undefined,
        deleted.length > 0
          ? constraintEntities.createDeleteAction(deleted)
          : undefined,
      ].filter((a): a is Exclude<typeof a, undefined> => !!a)
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

    historyStore.dispatch(
      boneEntities.createAddAction(created),
      [
        armatureEntities.createUpdateAction({
          [armature.id]: {
            bones: armature.bones.concat(created.map((b) => b.id)),
          },
        }),
        boneEntities.createUpdateAction(toMap(updated)),
        boneSelectable.createMultiSelectAction(selectedStateMap),
        constraints
          ? constraintEntities.createAddAction(
              constraints.filter((c) => !_constraintMap[c.id])
            )
          : undefined,
        constraints
          ? constraintEntities.createUpdateAction(
              toMap(constraints.filter((c) => _constraintMap[c.id]))
            )
          : undefined,
      ].filter((a): a is Exclude<typeof a, undefined> => !!a)
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
