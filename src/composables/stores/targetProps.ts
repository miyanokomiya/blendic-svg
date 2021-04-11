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
import { HistoryItem } from '/@/store/history'
import {
  dropMap,
  extractMap,
  mapFilterExec,
  mapReduce,
  mergeOrDropMap,
  shiftMergeProps,
} from '/@/utils/commons'
import { getReplaceItem } from '/@/utils/histories'

type PropStatus = 'selected' | 'hidden'

export interface TargetProps {
  id: string
  props: { [key: string]: any }
}

export interface TargetPropsState {
  props: { [key: string]: PropStatus }
}

export function useTargetProps(getVisibledMap: () => { [id: string]: any }) {
  const empty = {}
  const selectedStateMap = ref<IdMap<TargetPropsState>>(empty)

  function setSelectedStateMap(val: IdMap<TargetPropsState>) {
    selectedStateMap.value = val
  }

  function select(
    id: string,
    propsState: TargetPropsState,
    shift = false,
    notToggle = false
  ): HistoryItem {
    return getSelectItem(
      selectedStateMap.value,
      id,
      propsState,
      getVisibledMap(),
      shift,
      notToggle,
      setSelectedStateMap
    )
  }

  function selectAll(targetMap: IdMap<TargetProps>): HistoryItem {
    return getReplaceItem(
      selectedStateMap.value,
      mapReduce({ ...selectedStateMap.value, ...targetMap }, (_, id) =>
        targetMap[id]
          ? mergePropsState(
              getAllSelectedProps(targetMap[id]),
              selectedStateMap.value[id]
            )
          : selectedStateMap.value[id]
      ),
      setSelectedStateMap
    )
  }

  function filter(keepIdMap: { [id: string]: any } = {}): HistoryItem {
    return getReplaceItem(
      selectedStateMap.value,
      mapFilterExec(selectedStateMap.value, getVisibledMap(), (map) =>
        extractMap(map, keepIdMap)
      ),
      setSelectedStateMap
    )
  }

  function drop(targetMap: { [id: string]: any } = {}): HistoryItem {
    return getReplaceItem(
      selectedStateMap.value,
      dropMap(selectedStateMap.value, targetMap),
      setSelectedStateMap
    )
  }

  function clear(): HistoryItem {
    return getReplaceItem(selectedStateMap.value, {}, setSelectedStateMap)
  }

  return {
    selectedStateMap: computed(() => selectedStateMap.value),
    select,
    selectAll,
    filter,
    drop,
    clear,
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

function getSelectItem(
  state: IdMap<TargetPropsState>,
  id: string,
  propsState: TargetPropsState,
  visibledMap: IdMap<TargetPropsState>,
  shift = false,
  notToggle = false,
  setFn: (val: IdMap<TargetPropsState>) => void
): HistoryItem {
  return {
    name: 'Select',
    undo: () => setFn({ ...state }),
    redo: () => {
      if (shift) {
        const props = notToggle
          ? { ...(state[id]?.props ?? {}), ...propsState.props }
          : shiftMergeProps(state[id]?.props, propsState.props)
        setFn(mergeOrDropMap(state, id, props ? { props } : undefined))
      } else {
        setFn(
          mapFilterExec(state, visibledMap, () =>
            id ? { [id]: propsState } : {}
          )
        )
      }
    },
  }
}
