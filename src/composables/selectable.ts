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
import { mapReduce } from '/@/utils/commons'

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
      redo: () => (id ? selectable.select(id, shift) : selectable.clearAll()),
    }
  }

  function getSelectHistoryDryRun(id: string, shift = false): boolean {
    const selectedCount = Object.keys(selectedMap.value).length
    if (!id && selectedCount === 0) return false
    if (shift) return true
    if (lastSelectedId.value === id && selectedCount === 1) return false
    return true
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
    getSelectHistoryDryRun,
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
      redo: () =>
        id ? selectable.select(id, attrKey, shift) : selectable.clearAll(),
    }
  }

  function getSelectHistoryDryRun(
    id: string,
    attrKey: string,
    shift = false
  ): boolean {
    const selectedCount = Object.keys(selectedMap.value).length
    if (!id && selectedCount === 0) return false
    if (shift) return true
    if (lastSelectedId.value === id && selectedCount === 1) {
      const lastAttrs = selectedMap.value[id]
      if (Object.keys(lastAttrs).length === 1 && lastAttrs[attrKey]) {
        return false
      }
    }
    return true
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
    getSelectHistoryDryRun,
    getMultiSelectHistory,
    getSelectAllHistory,
    getClearAllHistory,
  }
}

type GenericsProps = {
  name: string
  props: SelectableAttrs
}

export function useGeneAttrsSelectable<T, K extends GenericsProps>(
  name: string,
  getItems: () => IdMap<T>,
  getItemType: (item: T) => string,
  attrKeys: { [type: string]: string[] }
) {
  // Note: ref<IdMap<K>> does not work well
  // => becomes UnwrapRef unexpectedly
  const selectedMap = ref<IdMap<okaselect.GenericsAttrs>>({})
  const lastSelectedId = ref<string>()
  const allAttrsSelectedIds = ref<string[]>([])

  const selectable = okaselect.useGenericsSelectable<
    T,
    okaselect.GenericsAttrs
  >(getItems, getItemType, attrKeys, { onUpdated })

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
      redo: () =>
        id ? selectable.select(id, attrKey, shift) : selectable.clearAll(),
    }
  }

  function getSelectHistoryDryRun(
    id: string,
    attrKey: string,
    shift = false
  ): boolean {
    const selectedCount = Object.keys(selectedMap.value).length
    if (!id && selectedCount === 0) return false
    if (shift) return true
    if (lastSelectedId.value === id && selectedCount === 1) {
      const lastAttrs = selectedMap.value[id].attrs
      if (Object.keys(lastAttrs).length === 1 && lastAttrs[attrKey]) {
        return false
      }
    }
    return true
  }

  function getMultiSelectHistory(val: IdMap<K>, shift = false): HistoryItem {
    const snapshot = selectable.createSnapshot()
    return {
      name: `Select ${name}`,
      undo: () => selectable.restore(snapshot),
      redo: () => selectable.multiSelect(mapReduce(val, toAttrs), shift),
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
    selectedMap: computed(() => mapReduce(selectedMap.value, fromAttrs)),
    lastSelectedId: computed(() => lastSelectedId.value),
    allAttrsSelectedIds: computed(() => allAttrsSelectedIds.value),

    isAttrsSelected: selectable.isAttrsSelected,
    createSnapshot: selectable.createSnapshot,
    restore: selectable.restore,

    getSelectHistory,
    getSelectHistoryDryRun,
    getMultiSelectHistory,
    getSelectAllHistory,
    getClearAllHistory,
  }
}

function fromAttrs(val: okaselect.GenericsAttrs): GenericsProps {
  return { name: val.type, props: val.attrs }
}
function toAttrs(val: GenericsProps): okaselect.GenericsAttrs {
  return { type: val.name, attrs: val.props }
}
