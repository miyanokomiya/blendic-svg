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

import { reactive, computed } from 'vue'
import { getDistance, getRadian, IRectangle, multi, sub } from 'okageo'
import {
  Transform,
  Bone,
  getTransform,
  BoneSelectedState,
  IdMap,
  toMap,
} from '/@/models/index'
import {
  EditMode,
  CanvasEditModeBase,
  EditMovement,
} from '/@/composables/modes/types'
import {
  duplicateBones,
  editTransform,
  extrudeFromParent,
  selectBoneInRect,
  subdivideBones,
  symmetrizeBones,
} from '/@/utils/armatures'
import { getNotDuplicatedName } from '/@/utils/relations'
import { Store } from '/@/store/index'
import { CanvasStore } from '/@/store/canvas'
import { mapReduce, toList } from '/@/utils/commons'
import { snapGrid, snapRotate, snapScale } from '/@/utils/geometry'
import { getCtrlOrMetaStr } from '/@/utils/devices'

interface State {
  command: EditMode
  editMovement: EditMovement | undefined
}

export interface BoneEditMode extends CanvasEditModeBase {
  subdivide(): void
  symmetrize(): void
}

export function useBoneEditMode(
  store: Store,
  canvasStore: CanvasStore
): BoneEditMode {
  const state = reactive<State>({
    command: '',
    editMovement: undefined,
  })
  const selectedBones = computed(() => store.state.selectedBones)
  const lastSelectedBoneId = computed(() => store.lastSelectedBone.value?.id)

  const target = computed(() => store.lastSelectedArmature.value)

  const isAnySelected = computed(() => !!lastSelectedBoneId.value)

  const allNames = computed(() => target.value?.bones.map((a) => a.name) ?? [])

  function cancel() {
    state.command = ''
    state.editMovement = undefined
  }

  function clickAny() {
    if (state.command) {
      completeEdit()
    }
  }

  function clickEmpty() {
    if (state.command) {
      completeEdit()
    } else {
      store.selectBone()
    }
  }

  function setEditMode(mode: EditMode) {
    if (!target.value) return

    cancel()

    if (isAnySelected.value) {
      state.command = mode
      if (mode === 'extrude') {
        const shouldSkipBones: IdMap<boolean> = {}
        const names = allNames.value.concat()
        const extrudedBones: Bone[] = []

        Object.keys(selectedBones.value).forEach((id) => {
          const selectedState = selectedBones.value[id]
          const parent = store.boneMap.value[id]

          const bones: Bone[] = []
          if (selectedState.tail) bones.push(extrudeFromParent(parent))
          if (selectedState.head) bones.push(extrudeFromParent(parent, true))

          bones.forEach((b) => {
            // prevent to extruding from same parent
            if (!shouldSkipBones[b.parentId]) {
              b.name = getNotDuplicatedName(parent.name, names)
              extrudedBones.push(b)
              names.push(b.name)
              shouldSkipBones[b.parentId] = true
            }
          })
        })

        if (extrudedBones.length > 0) {
          store.addBones(extrudedBones, { tail: true })
          state.command = 'grab'
        } else {
          state.command = ''
        }
      }
    }
  }

  const editTransforms = computed(() => {
    const editMovement = state.editMovement
    if (!editMovement) return {}

    if (state.command === 'scale') {
      const origin = store.selectedBonesOrigin.value
      const isOppositeSide = canvasStore.isOppositeSide(
        origin,
        editMovement.start,
        editMovement.current
      )
      const scale = multi(
        multi({ x: 1, y: 1 }, isOppositeSide ? -1 : 1),
        getDistance(editMovement.current, origin) /
          getDistance(editMovement.start, origin)
      )
      const gridScale = editMovement.ctrl ? snapScale(scale) : scale
      const snappedScale = canvasStore.snapScale(gridScale)

      return Object.keys(selectedBones.value).reduce<IdMap<Transform>>(
        (map, id) => {
          map[id] = getTransform({ origin, scale: snappedScale })
          return map
        },
        {}
      )
    }

    if (state.command === 'rotate') {
      const origin = store.selectedBonesOrigin.value
      const rotate =
        ((getRadian(editMovement.current, origin) -
          getRadian(editMovement.start, origin)) /
          Math.PI) *
        180
      const snappedRotate = editMovement.ctrl ? snapRotate(rotate) : rotate

      return Object.keys(selectedBones.value).reduce<IdMap<Transform>>(
        (map, id) => {
          map[id] = getTransform({
            origin,
            rotate: snappedRotate,
          })
          return map
        },
        {}
      )
    }

    const translate = sub(editMovement.current, editMovement.start)
    const gridTranslate = editMovement.ctrl
      ? snapGrid(editMovement.scale, translate)
      : translate
    const snappedTranslate = canvasStore.snapTranslate(gridTranslate)

    return Object.keys(selectedBones.value).reduce<IdMap<Transform>>(
      (map, id) => {
        map[id] = getTransform({ translate: snappedTranslate })
        return map
      },
      {}
    )
  })

  const editedBoneMap = computed(
    (): IdMap<Bone> =>
      Object.keys(editTransforms.value).reduce<IdMap<Bone>>((m, id) => {
        m[id] = editTransform(
          store.boneMap.value[id],
          editTransforms.value[id],
          selectedBones.value[id]
        )
        return m
      }, {})
  )

  function completeEdit() {
    if (!target.value) return

    store.updateBones(editedBoneMap.value)
    state.editMovement = undefined
    state.command = ''
  }

  function select(id: string, selectedState: BoneSelectedState) {
    if (state.command) {
      completeEdit()
      return
    }
    store.selectBone(id, selectedState)
  }

  function shiftSelect(id: string, selectedState: BoneSelectedState) {
    if (state.command) {
      completeEdit()
      return
    }
    store.selectBone(id, selectedState, true)
  }

  function rectSelect(rect: IRectangle, shift = false) {
    const stateMap = selectBoneInRect(rect, store.boneMap.value)
    store.selectBones(stateMap, shift)
  }

  function selectAll() {
    if (state.command) {
      cancel()
      return
    }
    store.selectAllBone()
  }

  function mousemove(arg: EditMovement) {
    if (state.command) {
      state.editMovement = arg
    }
  }

  function execDelete() {
    if (state.command) {
      cancel()
      return
    }
    store.deleteBone()
  }

  function execAdd() {
    if (state.command) {
      cancel()
      return
    }
    store.addBone()
  }

  function duplicate(): boolean {
    if (state.command) {
      cancel()
      return false
    }

    const srcBones = store.allSelectedBones.value
    const names = allNames.value.concat()
    const duplicated = duplicateBones(srcBones, names)
    if (duplicated.length === 0) return false

    store.addBones(duplicated, {
      head: true,
      tail: true,
    })
    setEditMode('grab')
    return true
  }

  const availableCommandList = computed(() => {
    const ctrl = { command: getCtrlOrMetaStr(), title: 'Snap' }

    if (state.command === 'grab' || state.command === 'scale') {
      return [
        { command: 'x', title: 'On Axis X' },
        { command: 'y', title: 'On Axis Y' },
        ctrl,
      ]
    } else if (state.command === 'rotate') {
      return [ctrl]
    } else if (isAnySelected.value) {
      return [
        { command: 'e', title: 'Extrude' },
        { command: 'g', title: 'Grab' },
        { command: 'r', title: 'Rotate' },
        { command: 's', title: 'Scale' },
        { command: 'a', title: 'All Select' },
        { command: 'x', title: 'Delete' },
        { command: 'A', title: 'Add' },
        { command: 'D', title: 'Duplicate' },
      ]
    } else {
      return [
        { command: 'a', title: 'All Select' },
        { command: 'A', title: 'Add' },
      ]
    }
  })

  function subdivide() {
    if (state.command) {
      cancel()
      return
    }

    const upsertedBones = subdivideBones(
      store.boneMap.value,
      Object.keys(store.allSelectedBones.value)
    )
    // select subdivided bones
    const subdividedIdMap = Object.keys(upsertedBones).reduce<
      IdMap<BoneSelectedState>
    >((p, id) => {
      if (!store.boneMap.value[id]) {
        p[id] = { head: true, tail: true }
        // subdivided new bone must have a parent
        p[upsertedBones[id].parentId] = { head: true, tail: true }
      }
      return p
    }, {})

    store.upsertBones(toList(upsertedBones), subdividedIdMap)
  }

  function symmetrize() {
    if (state.command) {
      cancel()
      return
    }

    const newBones = symmetrizeBones(
      store.boneMap.value,
      Object.keys(store.allSelectedBones.value)
    )
    store.upsertBones(
      newBones,
      mapReduce(toMap(newBones), () => ({ head: true, tail: true }))
    )
  }

  return {
    command: computed(() => state.command),
    getEditTransforms(id: string) {
      return editTransforms.value[id] || getTransform()
    },
    end: () => cancel(),
    cancel,
    setEditMode,
    select,
    shiftSelect,
    selectAll,
    rectSelect,
    mousemove,
    clickAny,
    clickEmpty,
    execDelete,
    execAdd,
    insert: () => {},
    clip: () => {},
    paste: () => {},
    duplicate,
    availableCommandList,
    subdivide,
    symmetrize,
    popupMenuList: computed(() => []),
  }
}
