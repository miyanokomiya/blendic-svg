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
import {
  Transform,
  BoneSelectedState,
  IdMap,
  getTransform,
} from '/@/models/index'
import {
  EditMode,
  CanvasEditModeBase,
  EditMovement,
} from '/@/composables/modes/types'
import { useStore } from '/@/store/index'

interface State {
  command: EditMode
  editMovement: EditMovement | undefined
}

export interface ObjectMode extends CanvasEditModeBase {}

export function useObjectMode(): ObjectMode {
  const state = reactive<State>({
    command: '',
    editMovement: undefined,
  })

  const store = useStore()
  const target = computed(() => store.lastSelectedArmature.value)

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
      store.selectArmature()
    }
  }

  function setEditMode(mode: EditMode) {
    if (!target.value) return

    cancel()
    state.command = mode
  }

  const editTransforms = computed(
    (): IdMap<Transform> => {
      return {}
    }
  )

  function completeEdit() {
    if (!target.value) return

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

  function rectSelect() {}

  function selectAll() {
    if (state.command) {
      completeEdit()
      return
    }
    store.selectAllArmature()
  }

  function mousemove(arg: EditMovement) {
    if (state.command) {
      state.editMovement = arg
    }
  }

  function execDelete() {
    if (state.command === '') {
      store.deleteArmature()
    }
  }

  function execAdd() {
    if (state.command === '') {
      store.addArmature()
    }
  }

  const availableCommandList = computed(() => {
    if (target.value) {
      return [
        { command: 'a', title: 'Select' },
        { command: 'A', title: 'Add' },
        { command: 'x', title: 'Delete' },
      ]
    } else {
      return [
        { command: 'a', title: 'Select' },
        { command: 'A', title: 'Add' },
      ]
    }
  })

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
    rectSelect,
    selectAll,
    mousemove,
    clickAny,
    clickEmpty,
    execDelete,
    execAdd,
    insert: () => {},
    clip: () => {},
    paste: () => {},
    duplicate: () => false,
    availableCommandList,
    popupMenuList: computed(() => []),
    toolMenuGroupList: computed(() => []),
  }
}
