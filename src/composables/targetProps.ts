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
import { dropMap, extractMap, mapReduce } from '/@/utils/commons'

type PropStatus = 'selected' | 'hidden'

export interface TargetProps {
  id: string
  props: { [key: string]: any }
}

export interface TargetPropsState {
  id: string
  props: { [key: string]: PropStatus }
}

export function useTargetProps() {
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
      shift,
      notToggle,
      setSelectedStateMap
    )
  }

  function selectAll(targetMap: IdMap<TargetProps>): HistoryItem {
    return getReplaceItem(
      selectedStateMap.value,
      mapReduce({ ...selectedStateMap.value, ...targetMap }, (_, id) =>
        mergePropsState(
          getAllSelectedProps(targetMap[id]),
          selectedStateMap.value[id]
        )
      ),
      setSelectedStateMap
    )
  }

  function filter(targetMap: { [id: string]: any } = {}): HistoryItem {
    return getReplaceItem(
      selectedStateMap.value,
      extractMap(selectedStateMap.value, targetMap),
      setSelectedStateMap
    )
  }

  function clear(targetMap: { [id: string]: any } = {}): HistoryItem {
    return getReplaceItem(
      selectedStateMap.value,
      dropMap(selectedStateMap.value, targetMap),
      setSelectedStateMap
    )
  }

  return {
    selectedStateMap: computed(() => selectedStateMap.value),
    select,
    selectAll,
    filter,
    clear,
  }
}

function getAllSelectedProps(target: TargetProps): TargetPropsState {
  return {
    id: target.id,
    props: mapReduce(target.props, () => 'selected'),
  }
}

function mergePropsState(
  a: TargetPropsState,
  b?: TargetPropsState
): TargetPropsState {
  if (!b) return a

  return {
    id: a.id,
    props: {
      ...a.props,
      ...b.props,
    },
  }
}

function shiftMergeProps(
  a: { [key: string]: PropStatus },
  b?: { [key: string]: PropStatus }
): { [key: string]: PropStatus } {
  if (!b) return a

  return Object.keys({
    ...a,
    ...b,
  }).reduce<{ [key: string]: PropStatus }>((p, c) => {
    if (a[c] === 'selected' && b[c] === 'selected') return p

    p[c] = a[c] ?? b[c]
    return p
  }, {})
}

function getSelectItem(
  state: IdMap<TargetPropsState>,
  id: string,
  propsState: TargetPropsState,
  shift = false,
  notToggle = false,
  setFn: (val: IdMap<TargetPropsState>) => void
): HistoryItem {
  const current = { ...state }

  const redo = () => {
    if (shift) {
      const props = notToggle
        ? { ...(current[id]?.props ?? {}), ...propsState.props }
        : shiftMergeProps(current[id]?.props ?? {}, propsState.props)
      const next = {
        ...current,
        [id]: {
          id,
          props,
        },
      }

      if (Object.keys(props).length === 0) delete next[id]
      setFn(next)
    } else {
      setFn(id ? { [id]: propsState } : {})
    }
  }
  return {
    name: 'Select',
    undo: () => {
      setFn({ ...current })
    },
    redo,
  }
}

function getReplaceItem(
  state: IdMap<TargetPropsState>,
  next: IdMap<TargetPropsState>,
  setFn: (val: IdMap<TargetPropsState>) => void
): HistoryItem {
  const current = { ...state }

  const redo = () => {
    setFn(next)
  }
  return {
    name: 'Replace',
    undo: () => {
      setFn({ ...current })
    },
    redo,
  }
}
