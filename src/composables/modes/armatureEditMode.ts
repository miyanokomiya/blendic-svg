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
  symmetrizeBones,
} from '/@/utils/armatures'
import { getNextName } from '/@/utils/relations'
import { useStore } from '/@/store/index'
import { CanvasStore } from '/@/store/canvas'
import { mapReduce } from '/@/utils/commons'
import { snapGrid, snapRotate, snapScale } from '/@/utils/geometry'
import { getCtrlOrMetaStr } from '/@/utils/devices'

interface State {
  command: EditMode
  editMovement: EditMovement | undefined
}

export interface BoneEditMode extends CanvasEditModeBase {
  symmetrize(): void
}

export function useBoneEditMode(canvasStore: CanvasStore): BoneEditMode {
  const state = reactive<State>({
    command: '',
    editMovement: undefined,
  })

  const store = useStore()
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

  function extrude(parent: Bone, fromHead = false): Bone {
    return {
      ...extrudeFromParent(parent, fromHead),
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
          if (selectedState.tail) bones.push(extrude(parent))
          if (selectedState.head) bones.push(extrude(parent, true))

          bones.forEach((b) => {
            // prevent to extruding from same parent
            if (!shouldSkipBones[b.parentId]) {
              b.name = getNextName(parent.name, names)
              extrudedBones.push(b)
              names.push(b.name)
              shouldSkipBones[b.parentId] = true
            }
          })
        })

        store.addBones(extrudedBones, { tail: true })
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
      completeEdit()
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
    if (state.command === '') {
      store.deleteBone()
    }
  }

  function execAdd() {
    if (state.command === '') {
      store.addBone()
    }
  }

  function duplicate() {
    if (state.command === '') {
      const srcBones = store.allSelectedBones.value
      const names = allNames.value.concat()
      const duplicated = duplicateBones(srcBones, names)
      if (duplicated.length > 0) {
        store.addBones(duplicated, {
          head: true,
          tail: true,
        })
        setEditMode('grab')
      }
    }
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

  function symmetrize() {
    const newBones = symmetrizeBones(
      store.boneMap.value,
      Object.keys(store.allSelectedBones.value)
    )
    store.addBones(
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
    symmetrize,
    popupMenuList: computed(() => []),
  }
}
