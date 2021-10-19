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
import { mapReduce } from '/@/utils/commons'
import * as okahistory from 'okahistory'

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

  const actionNames = {
    select: `${name}_SELECT`,
    multiSelect: `${name}_MULTI_SELECT`,
    selectAll: `${name}_SELECT_ALL`,
    clearAll: `${name}_CLEAR_ALL`,
  }

  const selectReducer: okahistory.Reducer<
    { id: string; shift?: boolean },
    string[]
  > = {
    getLabel: () => `Select ${name}`,
    redo(args) {
      const snapshot = selectable.createSnapshot()
      args.id ? selectable.select(args.id, args.shift) : selectable.clearAll()
      return snapshot.map(([id]) => id)
    },
    undo(snapshot) {
      selectable.restore(snapshot.map((id) => [id, true]))
    },
  }

  function createSelectAction(
    id: string,
    shift = false
  ): okahistory.Action<{ id: string; shift?: boolean }> {
    return {
      name: actionNames.select,
      args: { id, shift },
    }
  }

  function getSelectHistoryDryRun(id: string, shift = false): boolean {
    const selectedCount = Object.keys(selectedMap.value).length
    if (!id && selectedCount === 0) return false
    if (shift) return true
    if (lastSelectedId.value === id && selectedCount === 1) return false
    return true
  }

  const multiSelectReducer: okahistory.Reducer<
    { ids: string[]; shift?: boolean },
    string[]
  > = {
    getLabel: () => `Select ${name}`,
    redo(args) {
      const snapshot = selectable.createSnapshot()
      selectable.multiSelect(args.ids, args.shift)
      return snapshot.map(([id]) => id)
    },
    undo(snapshot) {
      selectable.restore(snapshot.map((id) => [id, true]))
    },
  }

  function createMultiSelectAction(
    ids: string[],
    shift = false
  ): okahistory.Action<{ ids: string[]; shift?: boolean }> {
    return {
      name: actionNames.multiSelect,
      args: { ids, shift },
    }
  }

  function getMultiSelectHistoryDryRun(ids: string[], shift = false): boolean {
    const selectedIds = Object.keys(selectedMap.value).sort()
    const selectedCount = selectedIds.length
    if (ids.length === 0 && selectedCount === 0) return false
    if (
      !shift &&
      ids.length === selectedCount &&
      ids.concat().sort().join(',') === selectedIds.join(',')
    ) {
      return false
    }
    return true
  }

  const selectAllReducer: okahistory.Reducer<boolean, string[]> = {
    getLabel: () => `Select ${name}`,
    redo(toggle) {
      const snapshot = selectable.createSnapshot()
      selectable.selectAll(toggle)
      return snapshot.map(([id]) => id)
    },
    undo(snapshot) {
      selectable.restore(snapshot.map((id) => [id, true]))
    },
  }

  function createSelectAllAction(toggle = false): okahistory.Action<boolean> {
    return {
      name: actionNames.selectAll,
      args: toggle,
    }
  }

  const clearAllReducer: okahistory.Reducer<void, string[]> = {
    getLabel: () => `Select ${name}`,
    redo() {
      const snapshot = selectable.createSnapshot()
      selectable.clearAll()
      return snapshot.map(([id]) => id)
    },
    undo(snapshot) {
      selectable.restore(snapshot.map((id) => [id, true]))
    },
  }

  function createClearAllAction(): okahistory.Action<void> {
    return {
      name: actionNames.clearAll,
      args: undefined,
    }
  }

  return {
    selectedMap: computed(() => selectedMap.value),
    lastSelectedId: computed(() => lastSelectedId.value),
    restore: selectable.restore,
    createSnapshot: selectable.createSnapshot,

    getSelectHistoryDryRun,
    getMultiSelectHistoryDryRun,

    reducers: {
      [actionNames.select]: selectReducer,
      [actionNames.multiSelect]: multiSelectReducer,
      [actionNames.selectAll]: selectAllReducer,
      [actionNames.clearAll]: clearAllReducer,
    },
    createSelectAction,
    createMultiSelectAction,
    createSelectAllAction,
    createClearAllAction,
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

  const actionNames = {
    select: `${name}_SELECT`,
    multiSelect: `${name}_MULTI_SELECT`,
    selectAll: `${name}_SELECT_ALL`,
    clearAll: `${name}_CLEAR_ALL`,
  }

  const selectReducer: okahistory.Reducer<
    { id: string; attrKey: string; shift?: boolean },
    [string, K][]
  > = {
    getLabel: () => `Select ${name}`,
    redo(args) {
      const snapshot = selectable.createSnapshot()
      args.id
        ? selectable.select(args.id, args.attrKey, args.shift)
        : selectable.clearAll()
      return snapshot
    },
    undo(snapshot) {
      selectable.restore(snapshot)
    },
  }

  function createSelectAction(
    id: string,
    attrKey: string,
    shift = false
  ): okahistory.Action<{ id: string; attrKey: string; shift?: boolean }> {
    return {
      name: actionNames.select,
      args: { id, attrKey, shift },
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

  const multiSelectReducer: okahistory.Reducer<
    { val: IdMap<K>; shift?: boolean },
    [string, K][]
  > = {
    getLabel: () => `Select ${name}`,
    redo(args) {
      const snapshot = selectable.createSnapshot()
      selectable.multiSelect(args.val, args.shift)
      return snapshot
    },
    undo(snapshot) {
      selectable.restore(snapshot)
    },
  }

  function createMultiSelectAction(
    val: IdMap<K>,
    shift = false
  ): okahistory.Action<{ val: IdMap<K>; shift?: boolean }> {
    return {
      name: actionNames.multiSelect,
      args: { val, shift },
    }
  }

  const selectAllReducer: okahistory.Reducer<boolean, [string, K][]> = {
    getLabel: () => `Select ${name}`,
    redo(toggle) {
      const snapshot = selectable.createSnapshot()
      selectable.selectAll(toggle)
      return snapshot
    },
    undo(snapshot) {
      selectable.restore(snapshot)
    },
  }

  function createSelectAllAction(toggle = false): okahistory.Action<boolean> {
    return {
      name: actionNames.selectAll,
      args: toggle,
    }
  }

  const clearAllReducer: okahistory.Reducer<void, [string, K][]> = {
    getLabel: () => `Select ${name}`,
    redo() {
      const snapshot = selectable.createSnapshot()
      selectable.clearAll()
      return snapshot
    },
    undo(snapshot) {
      selectable.restore(snapshot)
    },
  }

  function createClearAllAction(): okahistory.Action<void> {
    return {
      name: actionNames.clearAll,
      args: undefined,
    }
  }

  return {
    selectedMap: computed(() => selectedMap.value),
    lastSelectedId: computed(() => lastSelectedId.value),
    allAttrsSelectedIds: computed(() => allAttrsSelectedIds.value),
    restore: selectable.restore,
    createSnapshot: selectable.createSnapshot,

    isAttrsSelected: selectable.isAttrsSelected,
    getSelectHistoryDryRun,

    reducers: {
      [actionNames.select]: selectReducer,
      [actionNames.multiSelect]: multiSelectReducer,
      [actionNames.selectAll]: selectAllReducer,
      [actionNames.clearAll]: clearAllReducer,
    },
    createSelectAction,
    createMultiSelectAction,
    createSelectAllAction,
    createClearAllAction,
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

  const actionNames = {
    select: `${name}_SELECT`,
    multiSelect: `${name}_MULTI_SELECT`,
    selectAll: `${name}_SELECT_ALL`,
    clearAll: `${name}_CLEAR_ALL`,
  }

  const selectReducer: okahistory.Reducer<
    { id: string; attrKey: string; shift?: boolean },
    [string, okaselect.GenericsAttrs][]
  > = {
    getLabel: () => `Select ${name}`,
    redo(args) {
      const snapshot = selectable.createSnapshot()
      args.id
        ? selectable.select(args.id, args.attrKey, args.shift)
        : selectable.clearAll()
      return snapshot
    },
    undo(snapshot) {
      selectable.restore(snapshot)
    },
  }

  function createSelectAction(
    id: string,
    attrKey: string,
    shift = false
  ): okahistory.Action<{ id: string; attrKey: string; shift?: boolean }> {
    return {
      name: actionNames.select,
      args: { id, attrKey, shift },
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

  const multiSelectReducer: okahistory.Reducer<
    { val: IdMap<K>; shift?: boolean },
    [string, okaselect.GenericsAttrs][]
  > = {
    getLabel: () => `Select ${name}`,
    redo(args) {
      const snapshot = selectable.createSnapshot()
      selectable.multiSelect(mapReduce(args.val, toAttrs), args.shift)
      return snapshot
    },
    undo(snapshot) {
      selectable.restore(snapshot)
    },
  }

  function createMultiSelectAction(
    val: IdMap<K>,
    shift = false
  ): okahistory.Action<{ val: IdMap<K>; shift?: boolean }> {
    return {
      name: actionNames.multiSelect,
      args: { val, shift },
    }
  }

  const selectAllReducer: okahistory.Reducer<
    boolean,
    [string, okaselect.GenericsAttrs][]
  > = {
    getLabel: () => `Select ${name}`,
    redo(toggle) {
      const snapshot = selectable.createSnapshot()
      selectable.selectAll(toggle)
      return snapshot
    },
    undo(snapshot) {
      selectable.restore(snapshot)
    },
  }

  function createSelectAllAction(toggle = false): okahistory.Action<boolean> {
    return {
      name: actionNames.selectAll,
      args: toggle,
    }
  }

  const clearAllReducer: okahistory.Reducer<
    void,
    [string, okaselect.GenericsAttrs][]
  > = {
    getLabel: () => `Select ${name}`,
    redo() {
      const snapshot = selectable.createSnapshot()
      selectable.clearAll()
      return snapshot
    },
    undo(snapshot) {
      selectable.restore(snapshot)
    },
  }

  function createClearAllAction(): okahistory.Action<void> {
    return {
      name: actionNames.clearAll,
      args: undefined,
    }
  }

  return {
    selectedMap: computed(() => mapReduce(selectedMap.value, fromAttrs)),
    lastSelectedId: computed(() => lastSelectedId.value),
    allAttrsSelectedIds: computed(() => allAttrsSelectedIds.value),

    restore: selectable.restore,
    createSnapshot: selectable.createSnapshot,

    isAttrsSelected: selectable.isAttrsSelected,
    getSelectHistoryDryRun,

    reducers: {
      [actionNames.select]: selectReducer,
      [actionNames.multiSelect]: multiSelectReducer,
      [actionNames.selectAll]: selectAllReducer,
      [actionNames.clearAll]: clearAllReducer,
    },
    createSelectAction,
    createMultiSelectAction,
    createSelectAllAction,
    createClearAllAction,
  }
}

function fromAttrs(val: okaselect.GenericsAttrs): GenericsProps {
  return { name: val.type, props: val.attrs }
}
function toAttrs(val: GenericsProps): okaselect.GenericsAttrs {
  return { type: val.name, attrs: val.props }
}
