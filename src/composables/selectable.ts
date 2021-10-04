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
import { HistoryItem } from '/@/composables/stores/history'

export type SelectableAttrs = {
  [key: string]: true
}

export function useItemSelectable<T>(name: string, getItems: () => IdMap<T>) {
  const selectedMap = ref<IdMap<true>>({})
  const lastSelectedId = ref<string>()

  const selectable = okaselect.useItemSelectable(getItems, { onUpdated })

  function onUpdated() {
    selectedMap.value = selectable.getSelected()
    lastSelectedId.value = selectable.getLastSelected()
  }

  function getSelectHistory(id: string, shift = false): HistoryItem {
    const snapshot = selectable.createSnapshot()
    return {
      name: `Select ${name}`,
      undo: () => selectable.restore(snapshot),
      redo: () => selectable.select(id, shift),
    }
  }

  function getMultiSelectHistory(ids: string[], shift = false): HistoryItem {
    const snapshot = selectable.createSnapshot()
    return {
      name: `Select ${name}`,
      undo: () => selectable.restore(snapshot),
      redo: () => selectable.multiSelect(ids, shift),
    }
  }

  function getSelectAllHistory(toggle = false): HistoryItem {
    const snapshot = selectable.createSnapshot()
    return {
      name: `Select ${name}`,
      undo: () => selectable.restore(snapshot),
      redo: () => selectable.selectAll(toggle),
    }
  }

  function getClearAllHistory(): HistoryItem {
    const snapshot = selectable.createSnapshot()
    return {
      name: `Select ${name}`,
      undo: () => selectable.restore(snapshot),
      redo: () => selectable.clearAll(),
    }
  }

  return {
    selectedMap: computed(() => selectedMap.value),
    lastSelectedId: computed(() => lastSelectedId.value),

    getSelectHistory,
    getMultiSelectHistory,
    getSelectAllHistory,
    getClearAllHistory,
  }
}

export function useAttrsSelectable<T, K extends SelectableAttrs>(
  name: string,
  getItems: () => IdMap<T>,
  attrKeys: string[]
) {
  // Note: ref<IdMap<K>> does not work well
  // => becomes UnwrapRef unexpectedly
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

  function getSelectHistory(
    id: string,
    attrKey: string,
    shift = false
  ): HistoryItem {
    const snapshot = selectable.createSnapshot()
    return {
      name: `Select ${name}`,
      undo: () => selectable.restore(snapshot),
      redo: () => selectable.select(id, attrKey, shift),
    }
  }

  function getMultiSelectHistory(val: IdMap<K>, shift = false): HistoryItem {
    const snapshot = selectable.createSnapshot()
    return {
      name: `Select ${name}`,
      undo: () => selectable.restore(snapshot),
      redo: () => selectable.multiSelect(val, shift),
    }
  }

  function getSelectAllHistory(toggle = false): HistoryItem {
    const snapshot = selectable.createSnapshot()
    return {
      name: `Select ${name}`,
      undo: () => selectable.restore(snapshot),
      redo: () => selectable.selectAll(toggle),
    }
  }

  function getClearAllHistory(): HistoryItem {
    const snapshot = selectable.createSnapshot()
    return {
      name: `Select ${name}`,
      undo: () => selectable.restore(snapshot),
      redo: () => selectable.clearAll(),
    }
  }

  return {
    selectedMap: computed(() => selectedMap.value),
    lastSelectedId: computed(() => lastSelectedId.value),
    allAttrsSelectedIds: computed(() => allAttrsSelectedIds.value),

    isAttrsSelected: selectable.isAttrsSelected,
    createSnapshot: selectable.createSnapshot,
    restore: selectable.restore,

    getSelectHistory,
    getMultiSelectHistory,
    getSelectAllHistory,
    getClearAllHistory,
  }
}
