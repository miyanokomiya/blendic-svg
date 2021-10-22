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
import { IdMap } from '/@/models'
import {
  dropMap,
  extractMap,
  mapFilterExec,
  mapReduce,
  mergeOrDropMap,
  reduceToMap,
  shallowEqual,
  shiftMergeProps,
} from '/@/utils/commons'
import * as okahistory from 'okahistory'

type PropStatus = 'selected' | 'hidden'

export interface TargetProps {
  id: string
  props: { [key: string]: unknown }
}

export interface TargetPropsState {
  props: { [key: string]: PropStatus }
}

interface RestoreData {
  toUpsert: IdMap<TargetPropsState>
  toDelete: string[]
}

export function useTargetProps(
  name: string,
  getVisibledMap: () => IdMap<unknown>
) {
  const empty = {}
  const selectedStateMap = ref<IdMap<TargetPropsState>>(empty)

  function setSelectedStateMap(val: IdMap<TargetPropsState>) {
    selectedStateMap.value = val
  }

  function restore(snapshot: [string, TargetPropsState][]) {
    setSelectedStateMap(
      snapshot.reduce<IdMap<TargetPropsState>>((p, [id, val]) => {
        p[id] = val
        return p
      }, {})
    )
  }

  function createSnapshot(): [string, TargetPropsState][] {
    return Object.entries(selectedStateMap.value)
  }

  function localRestore(data: RestoreData) {
    selectedStateMap.value = dropMap(
      { ...selectedStateMap.value, ...data.toUpsert },
      reduceToMap(data.toDelete, () => true)
    )
  }

  function init(val: IdMap<TargetPropsState> = {}) {
    setSelectedStateMap(val)
  }

  const actionNames = {
    select: `${name}_SELECT`,
    selectAll: `${name}_SELECT_ALL`,
    filter: `${name}_FILTER`,
    drop: `${name}_DROP`,
    clearAll: `${name}_CLEAR_ALL`,
  }

  function selectDryRun(
    id: string,
    propsState: TargetPropsState,
    shift = false,
    notToggle = false
  ): boolean {
    const size = Object.keys(selectedStateMap.value).length
    if (size === 0) {
      return !!id
    } else if (size === 1) {
      if (
        id &&
        selectedStateMap.value[id] &&
        shallowEqual(selectedStateMap.value[id].props, propsState.props)
      ) {
        return shift && !notToggle
      } else {
        return true
      }
    } else {
      // TODO: check more accurately
      return true
    }
  }

  const selectReducer: okahistory.Reducer<
    {
      id: string
      propsState: TargetPropsState
      shift?: boolean
      notToggle?: boolean
    },
    RestoreData
  > = {
    getLabel: () => `Select ${name}`,
    redo(args) {
      const current = selectedStateMap.value
      const undoData = current[args.id]
        ? { toUpsert: { [args.id]: current[args.id] }, toDelete: [] }
        : { toUpsert: {}, toDelete: [args.id] }

      if (args.shift) {
        const props = args.notToggle
          ? { ...(current[args.id]?.props ?? {}), ...args.propsState.props }
          : shiftMergeProps(current[args.id]?.props, args.propsState.props)
        setSelectedStateMap(
          mergeOrDropMap(current, args.id, props ? { props } : undefined)
        )
      } else {
        setSelectedStateMap(
          mapFilterExec(current, getVisibledMap(), () =>
            args.id ? { [args.id]: args.propsState } : {}
          )
        )
      }
      return undoData
    },
    undo(data) {
      localRestore(data)
    },
  }

  function createSelectAction(
    id: string,
    propsState: TargetPropsState,
    shift = false,
    notToggle = false
  ): okahistory.Action<{
    id: string
    propsState: TargetPropsState
    shift?: boolean
    notToggle?: boolean
  }> {
    return {
      name: actionNames.select,
      args: { id, propsState, shift, notToggle },
    }
  }

  const selectAllReducer: okahistory.Reducer<
    IdMap<TargetProps>,
    IdMap<TargetPropsState>
  > = {
    getLabel: () => `Select ${name}`,
    redo(targetMap) {
      const snapshot = { ...selectedStateMap.value }
      setSelectedStateMap(
        mapReduce({ ...selectedStateMap.value, ...targetMap }, (_, id) =>
          targetMap[id]
            ? mergePropsState(
                getAllSelectedProps(targetMap[id]),
                selectedStateMap.value[id]
              )
            : selectedStateMap.value[id]
        )
      )
      return snapshot
    },
    undo(snapshot) {
      setSelectedStateMap(snapshot)
    },
  }

  function createSelectAllAction(
    targetMap: IdMap<TargetProps>
  ): okahistory.Action<IdMap<TargetProps>> {
    return { name: actionNames.selectAll, args: targetMap }
  }

  const filterReducer: okahistory.Reducer<
    IdMap<unknown>,
    IdMap<TargetPropsState>
  > = {
    getLabel: () => `Filter ${name}`,
    redo(keepIdMap) {
      const snapshot = { ...selectedStateMap.value }
      setSelectedStateMap(
        mapFilterExec(selectedStateMap.value, getVisibledMap(), (map) =>
          extractMap(map, keepIdMap)
        )
      )
      return snapshot
    },
    undo(snapshot) {
      setSelectedStateMap(snapshot)
    },
  }

  function createFilterAction(
    keepIdMap: IdMap<unknown> = {}
  ): okahistory.Action<IdMap<unknown>> {
    return { name: actionNames.filter, args: keepIdMap }
  }

  const dropReducer: okahistory.Reducer<IdMap<unknown>, RestoreData> = {
    getLabel: () => `Drop ${name}`,
    redo(targetMap) {
      const toUpsert = extractMap(selectedStateMap.value, targetMap)
      setSelectedStateMap(dropMap(selectedStateMap.value, targetMap))
      return { toUpsert, toDelete: [] }
    },
    undo(restoreData) {
      localRestore(restoreData)
    },
  }

  function createDropAction(
    targetMap: IdMap<unknown> = {}
  ): okahistory.Action<IdMap<unknown>> {
    return { name: actionNames.drop, args: targetMap }
  }

  const clearAllReducer: okahistory.Reducer<void, IdMap<TargetPropsState>> = {
    getLabel: () => `Select ${name}`,
    redo() {
      const snapshot = { ...selectedStateMap.value }
      setSelectedStateMap({})
      return snapshot
    },
    undo(snapshot) {
      setSelectedStateMap(snapshot)
    },
  }

  function createClearAllAction(): okahistory.Action<void> {
    return { name: actionNames.clearAll, args: undefined }
  }

  return {
    init,
    restore,
    createSnapshot,
    selectedStateMap: computed(() => selectedStateMap.value),
    selectDryRun,

    reducers: {
      [actionNames.select]: selectReducer,
      [actionNames.selectAll]: selectAllReducer,
      [actionNames.filter]: filterReducer,
      [actionNames.drop]: dropReducer,
      [actionNames.clearAll]: clearAllReducer,
    },
    createSelectAction,
    createSelectAllAction,
    createFilterAction,
    createDropAction,
    createClearAllAction,
  }
}

function getAllSelectedProps(target: TargetProps): TargetPropsState {
  return {
    props: mapReduce(target.props, () => 'selected'),
  }
}

function mergePropsState(
  a: TargetPropsState,
  b?: TargetPropsState
): TargetPropsState {
  if (!b) return a
  return {
    props: { ...a.props, ...b.props },
  }
}
