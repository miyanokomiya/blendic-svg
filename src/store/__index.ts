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

import { ref, computed } from 'vue'
import { Armature, getBone, getArmature, toMap, Bone } from '/@/models/index'
import * as armatureUtils from '/@/utils/armatures'
import { IVec2 } from 'okageo'
import { useHistoryStore } from './history'
import { HistoryItem } from '/@/composables/stores/history'
import {
  getAddItemsHistory,
  getDeleteItemHistory,
  getUpdateSingleItemHistory,
  SelectedItemAccessor,
} from '/@/utils/histories'
import {
  Entities,
  fromEntityList,
  setEntities,
  toEntityList,
  updateEntity,
} from '/@/models/entity'
import { useAttrsSelectable, useItemSelectable } from '/@/components/selectable'
import { getNotDuplicatedName } from '/@/utils/relations'
import { toList } from '/@/utils/commons'

const historyStore = useHistoryStore()

type ArmatureEntities = Entities<Armature>
type BoneEntities = Entities<Bone>

export function createStore() {
  const armature = getArmature({
    id: 'initial-armature',
    name: 'armature',
    b_ones: ['bone'],
  })
  const bone = getBone(
    {
      name: 'bone',
      head: { x: 20, y: 200 },
      tail: { x: 220, y: 200 },
    },
    true
  )

  const armatureEntities = ref<ArmatureEntities>({
    byId: { [armature.id]: armature },
    allIds: [armature.id],
  })
  const armatures = computed(() => toEntityList(armatureEntities.value))
  const armatureSelectable = useItemSelectable(
    () => armatureEntities.value.byId
  )
  const lastSelectedArmatureId = computed(armatureSelectable.getLastSelectedId)
  const lastSelectedArmature = computed(() =>
    lastSelectedArmatureId.value
      ? armatureEntities.value.byId[lastSelectedArmatureId.value]
      : undefined
  )

  const boneEntities = ref<BoneEntities>({
    byId: { [bone.id]: bone },
    allIds: [bone.id],
  })
  const boneMap = computed(() => {
    if (!lastSelectedArmature.value) return {}

    const boneById = boneEntities.value.byId
    return toMap(lastSelectedArmature.value.b_ones.map((id) => boneById[id]))
  })
  const boneSelectable = useAttrsSelectable<Bone, { head: true; tail: true }>(
    () => boneMap.value,
    ['head', 'tail']
  )
  const selectedBones = computed(boneSelectable.getSelectedMap)
  const lastSelectedBoneId = computed(boneSelectable.getLastSelectedId)
  const lastSelectedBone = computed(() =>
    lastSelectedBoneId.value
      ? boneEntities.value.byId[lastSelectedBoneId.value]
      : undefined
  )
  const allSelectedBones = computed(() => {
    const byId = boneEntities.value.byId
    return toMap(boneSelectable.getAllAttrsSelected().map((id) => byId[id]))
  })
  const selectedBonesOrigin = computed(
    (): IVec2 =>
      armatureUtils.getSelectedBonesOrigin(boneMap.value, selectedBones.value)
  )

  const constraintMap = computed(() =>
    toMap(
      (lastSelectedArmature.value?.bones ?? []).flatMap((b) => b.constraints)
    )
  )

  function initState(initArmatures: Armature[]) {
    armatureEntities.value = fromEntityList(initArmatures)
    armatureSelectable.clearAll()
    boneSelectable.clearAll()
  }

  function selectArmature(id: string = '') {
    if (lastSelectedArmatureId.value === id) return

    const item = getSelectArmatureItem(
      {
        get: () => armatureSelectable.getSelectedMap(),
        set: (val) => armatureSelectable.multiSelect(Object.keys(val)),
      },
      id
    )
    item.redo()
    historyStore.push(item)
  }

  function selectAllArmature() {
    if (lastSelectedArmatureId.value) {
      selectArmature()
    } else {
      const id = armatureEntities.value.allIds[0]
      if (id) {
        selectArmature(id)
      }
    }
  }

  function addArmature() {
    historyStore.push(
      getAddItemsHistory(
        {
          get: () => toList(armatureEntities.value.byId),
          set: (val) => setEntities(armatureEntities.value, val),
        },
        [
          getArmature(
            {
              name: getNotDuplicatedName(
                'armature',
                toList(armatureEntities.value.byId).map((a) => a.name)
              ),
              bones: [getBone({ name: 'bone', tail: { x: 100, y: 0 } }, true)],
            },
            true
          ),
        ]
      ),
      true
    )
  }

  function deleteArmature() {
    if (!lastSelectedArmatureId.value) return

    historyStore.push(
      getDeleteItemHistory(
        {
          get: () => toList(armatureEntities.value.byId),
          set: (val) => setEntities(armatureEntities.value, val),
        },
        armatureSelectable.getSelectedMap(),
        'Delete Armature'
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
      getUpdateSingleItemHistory(
        {
          get: () => lastSelectedArmature.value!,
          set: (val) => updateEntity(armatureEntities.value, val),
        },
        {
          name: getNotDuplicatedName(
            name,
            toList(armatureEntities.value.byId).map((a) => a.name)
          ),
        },
        undefined,
        'Update Armature'
      ),
      true
    )
  }

  return () => {
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
      selectArmature,
      selectAllArmature,
      addArmature,
      deleteArmature,
      updateArmatureName,
    }
  }
}
export type IndexStore = ReturnType<typeof createStore>

const store = createStore()
export function u_seStore() {
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
