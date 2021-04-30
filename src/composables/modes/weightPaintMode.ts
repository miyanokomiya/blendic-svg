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
import { getTransform } from '/@/models/index'
import {
  EditMode,
  EditMovement,
  CanvasEditModeBase,
} from '/@/composables/modes/types'
import { ElementStore } from '/@/store/element'

export interface WeightPaintMode extends CanvasEditModeBase {}

export function useWeightPaintMode(
  elementStore: ElementStore
): WeightPaintMode {
  function cancel() {}

  function clickAny() {}

  function clickEmpty() {
    elementStore.selectElement()
  }

  function setEditMode(_mode: EditMode) {}

  function select(_id: string) {
    cancel()
  }

  function shiftSelect(_id: string) {
    cancel()
  }

  function rectSelect() {}

  function selectAll() {
    cancel()
    elementStore.selectAllElement()
  }

  function mousemove(_arg: EditMovement) {}

  function clip() {}

  function paste() {}

  const availableCommandList = computed(() => {
    return [{ command: 'a', title: 'All Select' }]
  })

  return {
    command: computed(() => ''),
    getEditTransforms(_id: string) {
      return getTransform()
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
    execDelete: () => {},
    execAdd: () => {},
    insert: () => {},
    clip,
    paste,
    duplicate: () => {},
    availableCommandList,
    popupMenuList: computed(() => []),
  }
}
