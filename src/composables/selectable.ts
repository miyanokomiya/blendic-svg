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

import * as okaselect from 'okaselect'
import { IdMap } from '/@/models'
import { computed, ref } from 'vue'

export type SelectableAttrs = {
  [key: string]: true
}

export function useItemSelectable<T>(getItems: () => IdMap<T>) {
  const selectedMap = ref<IdMap<true>>({})
  const lastSelectedId = ref<string>()

  const selectable = okaselect.useItemSelectable(getItems, { onUpdated })

  function onUpdated() {
    selectedMap.value = selectable.getSelected()
    lastSelectedId.value = selectable.getLastSelected()
  }

  return {
    selectedMap: computed(() => selectedMap.value),
    lastSelectedId: computed(() => lastSelectedId.value),

    select: selectable.select,
    multiSelect: selectable.multiSelect,
    selectAll: selectable.selectAll,
    clearAll: selectable.clearAll,
  }
}

export function useAttrsSelectable<T, K extends SelectableAttrs>(
  getItems: () => IdMap<T>,
  attrKeys: string[]
) {
  const selectedMap = ref<IdMap<SelectableAttrs>>({})
  const lastSelectedId = ref<string>()
  const allAttrsSelectedIds = ref<string[]>([])

  const selectable = okaselect.useAttributeSelectable<T, K>(
    getItems,
    attrKeys,
    {
      onUpdated,
    }
  )

  function onUpdated() {
    selectedMap.value = selectable.getSelected()
    lastSelectedId.value = selectable.getLastSelected()
    allAttrsSelectedIds.value = selectable.getAllAttrsSelected()
  }

  return {
    selectedMap: computed(() => selectedMap.value),
    lastSelectedId: computed(() => lastSelectedId.value),
    allAttrsSelectedIds: computed(() => allAttrsSelectedIds.value),

    isAttrsSelected: selectable.isAttrsSelected,
    select: selectable.select,
    multiSelect: selectable.multiSelect,
    selectAll: selectable.selectAll,
    clearAll: selectable.clearAll,
    createSnapshot: selectable.createSnapshot,
    restore: selectable.restore,
  }
}
