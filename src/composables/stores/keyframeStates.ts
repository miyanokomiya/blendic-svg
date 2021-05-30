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
import { HistoryItem } from '/@/composables/stores/history'
import { useValueStore } from '/@/composables/stores/valueStore'
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
  shiftMergeProps,
} from '/@/utils/commons'
import { convolute, getReplaceItem } from '/@/utils/histories'

export interface TargetProps {
  id: string
  points: { [key: string]: unknown }
}

export function useKeyframeStates(getVisibledMap: () => IdMap<TargetProps>) {
  const empty = {}
  const selectedStateMap = ref<IdMap<KeyframeSelectedState>>(empty)
  const lastSelectedId = useValueStore('', () => '')

  function setSelectedStateMap(val: IdMap<KeyframeSelectedState>) {
    selectedStateMap.value = val
  }

  function select(
    id: string,
    propsState: KeyframeSelectedState,
    shift = false
  ): HistoryItem {
    return convolute(
      getSelectItem(
        selectedStateMap.value,
        id,
        propsState,
        getVisibledMap(),
        shift,
        setSelectedStateMap
      ),
      [lastSelectedId.setState(id)]
    )
  }

  function selectList(
    selectedTargetMap: IdMap<TargetProps>,
    shift = false
  ): HistoryItem {
    return convolute(
      getSelectListItem(
        selectedStateMap.value,
        selectedTargetMap,
        getVisibledMap(),
        shift,
        setSelectedStateMap
      ),
      [lastSelectedId.setState(pickAnyItem(selectedTargetMap)?.id ?? '')]
    )
  }

  function selectAll(targetMap: IdMap<TargetProps>): HistoryItem {
    return convolute(
      getReplaceItem(
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
      ),
      [lastSelectedId.setState(Object.keys(targetMap)[0] ?? '')]
    )
  }

  function filter(keepIdMap: { [id: string]: unknown } = {}): HistoryItem {
    return convolute(
      getReplaceItem(
        selectedStateMap.value,
        mapFilterExec(selectedStateMap.value, getVisibledMap(), (map) =>
          extractMap(map, keepIdMap)
        ),
        setSelectedStateMap
      ),
      [lastSelectedId.setState(Object.keys(keepIdMap)[0] ?? '')]
    )
  }

  function drop(dropIdMap: { [id: string]: unknown } = {}): HistoryItem {
    return convolute(
      getReplaceItem(
        selectedStateMap.value,
        dropMap(selectedStateMap.value, dropIdMap),
        setSelectedStateMap
      ),
      [lastSelectedId.setState('')]
    )
  }

  function clear(): HistoryItem {
    return convolute(
      getReplaceItem(selectedStateMap.value, {}, setSelectedStateMap),
      [lastSelectedId.setState('')]
    )
  }

  return {
    selectedStateMap: computed(() => selectedStateMap.value),
    lastSelectedId: lastSelectedId.state,
    select,
    selectList,
    selectAll,
    filter,
    drop,
    clear,
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

function getSelectItem(
  state: IdMap<KeyframeSelectedState>,
  id: string,
  propsState: KeyframeSelectedState,
  visibledMap: IdMap<TargetProps>,
  shift = false,
  setFn: (val: IdMap<KeyframeSelectedState>) => void
): HistoryItem {
  return {
    name: 'Select Keyframe',
    undo: () => setFn({ ...state }),
    redo: () => {
      if (shift) {
        const props = shiftMergeProps(state[id]?.props, propsState.props)
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

function getSelectListItem(
  state: IdMap<KeyframeSelectedState>,
  selectedTargetMap: { [id: string]: TargetProps } = {},
  visibledMap: { [id: string]: unknown } = {},
  shift = false,
  setFn: (val: IdMap<KeyframeSelectedState>) => void
): HistoryItem {
  return {
    name: 'Select Keyframe',
    undo: () => setFn({ ...state }),
    redo: () => {
      if (shift) {
        if (isAllExistStatesSelected(state, selectedTargetMap)) {
          // clear all if all targets have been selected already
          setFn(dropMap(state, selectedTargetMap))
        } else {
          setFn({
            ...state,
            ...mapReduce(selectedTargetMap, getAllSelectedProps),
          })
        }
      } else {
        setFn({
          ...dropMap(state, visibledMap),
          ...mapReduce(selectedTargetMap, getAllSelectedProps),
        })
      }
    },
  }
}
