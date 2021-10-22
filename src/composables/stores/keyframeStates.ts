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

import { ref } from '@vue/reactivity'
import { computed } from '@vue/runtime-core'
import { IdMap } from '/@/models'
import { KeyframeSelectedState } from '/@/models/keyframe'
import {
  dropMap,
  extractMap,
  hasSameProps,
  mapFilterExec,
  mapReduce,
  mergeOrDropMap,
  pickAnyItem,
  reduceToMap,
  shiftMergeProps,
} from '/@/utils/commons'
import * as okahistory from 'okahistory'

export interface TargetProps {
  id: string
  points: { [key: string]: unknown }
}

type Snapshot = [string, KeyframeSelectedState][]

interface LocalRestoreData {
  toUpsert: IdMap<KeyframeSelectedState>
  toDelete: string[]
  lastSelectedId: string
}

interface LocalSnapshot {
  map: IdMap<KeyframeSelectedState>
  lastSelectedId: string
}

export function useKeyframeStates(
  name: string,
  getVisibledMap: () => IdMap<TargetProps>
) {
  const empty = {}
  const selectedStateMap = ref<IdMap<KeyframeSelectedState>>(empty)
  const lastSelectedId = ref('')

  function restore(snapshot: Snapshot) {
    lastSelectedId.value =
      snapshot.length > 0 ? snapshot[snapshot.length - 1][0] : ''
    setSelectedStateMap(
      snapshot.reduce<IdMap<KeyframeSelectedState>>((p, [id, val]) => {
        p[id] = val
        return p
      }, {})
    )
  }

  function createSnapshot(): Snapshot {
    const lastId = lastSelectedId.value
    const snapshot = Object.entries(selectedStateMap.value)
    return lastId
      ? snapshot
          .filter(([id]) => id !== lastId)
          .concat([[lastId, selectedStateMap.value[lastId]]])
      : snapshot
  }

  function setSelectedStateMap(val: IdMap<KeyframeSelectedState>) {
    selectedStateMap.value = val
  }

  function localRestore(data: LocalRestoreData) {
    selectedStateMap.value = dropMap(
      { ...selectedStateMap.value, ...data.toUpsert },
      reduceToMap(data.toDelete, () => true)
    )
    lastSelectedId.value = data.lastSelectedId
  }

  function init(val: IdMap<KeyframeSelectedState> = {}) {
    setSelectedStateMap(val)
    const keys = Object.keys(val)
    lastSelectedId.value = keys.length > 0 ? keys[0] : ''
  }

  const actionNames = {
    select: `${name}_SELECT`,
    multiSelect: `${name}_MULTI_SELECT`,
    selectAll: `${name}_SELECT_ALL`,
    filter: `${name}_FILTER`,
    drop: `${name}_DROP`,
    clearAll: `${name}_CLEAR_ALL`,
  }

  const selectReducer: okahistory.Reducer<
    {
      id: string
      propsState: KeyframeSelectedState
      shift?: boolean
    },
    LocalRestoreData
  > = {
    getLabel: () => `Select ${name}`,
    redo(args) {
      const current = selectedStateMap.value
      const undoData = {
        lastSelectedId: lastSelectedId.value,
        ...(current[args.id]
          ? { toUpsert: { [args.id]: current[args.id] }, toDelete: [] }
          : { toUpsert: {}, toDelete: [args.id] }),
      }

      if (args.shift) {
        const props = shiftMergeProps(
          current[args.id]?.props,
          args.propsState.props
        )
        setSelectedStateMap(
          mergeOrDropMap(current, args.id, props ? { props } : undefined)
        )
        lastSelectedId.value = props ? args.id : ''
      } else {
        setSelectedStateMap(
          mapFilterExec(current, getVisibledMap(), () =>
            args.id ? { [args.id]: args.propsState } : {}
          )
        )
        lastSelectedId.value = args.id
      }

      return undoData
    },
    undo(data) {
      localRestore(data)
    },
  }

  function createSelectAction(
    id: string,
    propsState: KeyframeSelectedState,
    shift = false
  ): okahistory.Action<{
    id: string
    propsState: KeyframeSelectedState
    shift?: boolean
  }> {
    return { name: actionNames.select, args: { id, propsState, shift } }
  }

  const multiSelectReducer: okahistory.Reducer<
    {
      selectedTargetMap: IdMap<TargetProps>
      shift?: boolean
    },
    LocalSnapshot
  > = {
    getLabel: () => `Select ${name}`,
    redo(args) {
      const snapshot = {
        map: { ...selectedStateMap.value },
        lastSelectedId: lastSelectedId.value,
      }

      if (args.shift) {
        if (
          isAllExistStatesSelected(
            selectedStateMap.value,
            args.selectedTargetMap
          )
        ) {
          // clear all if all targets have been selected already
          setSelectedStateMap(
            dropMap(selectedStateMap.value, args.selectedTargetMap)
          )
          lastSelectedId.value = ''
        } else {
          setSelectedStateMap({
            ...selectedStateMap.value,
            ...mapReduce(args.selectedTargetMap, getAllSelectedProps),
          })
          lastSelectedId.value = pickAnyItem(args.selectedTargetMap)?.id ?? ''
        }
      } else {
        setSelectedStateMap({
          ...dropMap(selectedStateMap.value, getVisibledMap()),
          ...mapReduce(args.selectedTargetMap, getAllSelectedProps),
        })
        lastSelectedId.value = pickAnyItem(args.selectedTargetMap)?.id ?? ''
      }

      return snapshot
    },
    undo(snapshot) {
      setSelectedStateMap(snapshot.map)
      lastSelectedId.value = snapshot.lastSelectedId
    },
  }

  function createMultiSelectAction(
    selectedTargetMap: IdMap<TargetProps>,
    shift = false
  ): okahistory.Action<{
    selectedTargetMap: IdMap<TargetProps>
    shift?: boolean
  }> {
    return { name: actionNames.multiSelect, args: { selectedTargetMap, shift } }
  }

  const selectAllReducer: okahistory.Reducer<
    IdMap<TargetProps>,
    LocalSnapshot
  > = {
    getLabel: () => `Select ${name}`,
    redo(targetMap) {
      const snapshot = {
        map: { ...selectedStateMap.value },
        lastSelectedId: lastSelectedId.value,
      }
      const invisibled = dropMap(selectedStateMap.value, getVisibledMap())
      setSelectedStateMap(
        mapReduce({ ...targetMap, ...invisibled }, (_, id) =>
          targetMap[id]
            ? mergePropsState(
                getAllSelectedProps(targetMap[id]),
                selectedStateMap.value[id]
              )
            : selectedStateMap.value[id]
        )
      )
      lastSelectedId.value = Object.keys(targetMap)[0] ?? ''
      return snapshot
    },
    undo(snapshot) {
      setSelectedStateMap(snapshot.map)
      lastSelectedId.value = snapshot.lastSelectedId
    },
  }

  function createSelectAllAction(
    targetMap: IdMap<TargetProps>
  ): okahistory.Action<IdMap<TargetProps>> {
    return { name: actionNames.selectAll, args: targetMap }
  }

  const filterReducer: okahistory.Reducer<IdMap<unknown>, LocalSnapshot> = {
    getLabel: () => `Filter ${name}`,
    redo(keepIdMap) {
      const snapshot = {
        map: { ...selectedStateMap.value },
        lastSelectedId: lastSelectedId.value,
      }
      setSelectedStateMap(
        mapFilterExec(selectedStateMap.value, getVisibledMap(), (map) =>
          extractMap(map, keepIdMap)
        )
      )
      return snapshot
    },
    undo(snapshot) {
      setSelectedStateMap(snapshot.map)
      lastSelectedId.value = snapshot.lastSelectedId
    },
  }

  function createFilterAction(
    keepIdMap: IdMap<unknown> = {}
  ): okahistory.Action<IdMap<unknown>> {
    return { name: actionNames.filter, args: keepIdMap }
  }

  const dropReducer: okahistory.Reducer<IdMap<unknown>, LocalRestoreData> = {
    getLabel: () => `Drop ${name}`,
    redo(targetMap) {
      const currentLastId = lastSelectedId.value
      const toUpsert = extractMap(selectedStateMap.value, targetMap)
      setSelectedStateMap(dropMap(selectedStateMap.value, targetMap))
      if (targetMap[lastSelectedId.value]) {
        lastSelectedId.value = ''
      }
      return { toUpsert, toDelete: [], lastSelectedId: currentLastId }
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

  const clearAllReducer: okahistory.Reducer<void, LocalSnapshot> = {
    getLabel: () => `Select ${name}`,
    redo() {
      const snapshot = {
        map: { ...selectedStateMap.value },
        lastSelectedId: lastSelectedId.value,
      }
      setSelectedStateMap({})
      lastSelectedId.value = ''
      return snapshot
    },
    undo(snapshot) {
      setSelectedStateMap(snapshot.map)
      lastSelectedId.value = snapshot.lastSelectedId
    },
  }

  function createClearAllAction(): okahistory.Action<void> {
    return { name: actionNames.clearAll, args: undefined }
  }

  return {
    init,
    selectedStateMap: computed(() => selectedStateMap.value),
    lastSelectedId: computed(() => lastSelectedId.value),

    restore,
    createSnapshot,

    reducers: {
      [actionNames.select]: selectReducer,
      [actionNames.multiSelect]: multiSelectReducer,
      [actionNames.selectAll]: selectAllReducer,
      [actionNames.filter]: filterReducer,
      [actionNames.drop]: dropReducer,
      [actionNames.clearAll]: clearAllReducer,
    },
    createSelectAction,
    createMultiSelectAction,
    createSelectAllAction,
    createFilterAction,
    createDropAction,
    createClearAllAction,
  }
}

function getAllSelectedProps(target: TargetProps): KeyframeSelectedState {
  return { props: mapReduce(target.points, () => true) }
}

function mergePropsState(
  a: KeyframeSelectedState,
  b?: KeyframeSelectedState
): KeyframeSelectedState {
  if (!b) return a
  return { props: { ...a.props, ...b.props } }
}

function isAllExistSelected(
  target: TargetProps,
  state?: KeyframeSelectedState
): boolean {
  if (!state) return false
  return hasSameProps(
    mapReduce(target.points, () => true),
    state.props
  )
}

function isAllExistStatesSelected(
  state: IdMap<KeyframeSelectedState>,
  selectedTargetMap: { [id: string]: TargetProps } = {}
): boolean {
  if (Object.keys(state).length === 0) return false
  return Object.keys(selectedTargetMap).every((id) =>
    isAllExistSelected(selectedTargetMap[id], state[id])
  )
}
