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
import { useValueStore } from '/@/composables/stores/valueStore'
import { IdMap } from '/@/models'
import { KeyframeSelectedState } from '/@/models/keyframe'
import { HistoryItem } from '/@/store/history'
import {
  dropMap,
  extractMap,
  mapFilterExec,
  mapReduce,
  pickAnyItem,
} from '/@/utils/commons'
import { convolute } from '/@/utils/histories'
import { getAllSelectedState, isAllExistSelected } from '/@/utils/keyframes'

type PropStatus = boolean

export interface TargetProps {
  id: string
  points: { [key: string]: any }
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
    selectedMap: IdMap<TargetProps>,
    shift = false
  ): HistoryItem {
    return convolute(
      getSelectListItem(
        selectedStateMap.value,
        selectedMap,
        getVisibledMap(),
        shift,
        setSelectedStateMap
      ),
      [lastSelectedId.setState(pickAnyItem(selectedMap)?.id ?? '')]
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

  function filter(keepIdMap: { [id: string]: any } = {}): HistoryItem {
    return convolute(
      getReplaceItem(
        selectedStateMap.value,
        mapFilterExec(selectedStateMap.value, getVisibledMap(), (map) => {
          return extractMap(map, keepIdMap)
        }),
        setSelectedStateMap
      ),
      [lastSelectedId.setState(Object.keys(keepIdMap)[0] ?? '')]
    )
  }

  function drop(dropIdMap: { [id: string]: any } = {}): HistoryItem {
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
  return {
    props: mapReduce(target.points, () => true),
  }
}

function mergePropsState(
  a: KeyframeSelectedState,
  b?: KeyframeSelectedState
): KeyframeSelectedState {
  if (!b) return a

  return {
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

  // toggle boolean if updated map has only one key
  // e.g.  a = { x: true, y: false }, b = { x: true, y: true }
  // => expected to be     { x: true, y: true }
  // =>          not to be { x: false, y: true }
  const ignoretoggle = Object.keys(b).length > 1

  // set all false if current and next map have all same props with true value
  let shouldtoggleAllFalse = true

  const ret = Object.keys({
    ...a,
    ...b,
  }).reduce<{ [key: string]: PropStatus }>((p, c) => {
    if (a[c] && b[c] && !ignoretoggle) return p

    shouldtoggleAllFalse = shouldtoggleAllFalse && a[c] && b[c]

    p[c] = a[c] ?? b[c]
    return p
  }, {})

  if (shouldtoggleAllFalse) {
    return {}
  } else {
    return ret
  }
}

function getSelectItem(
  state: IdMap<KeyframeSelectedState>,
  id: string,
  propsState: KeyframeSelectedState,
  visibledMap: IdMap<TargetProps>,
  shift = false,
  setFn: (val: IdMap<KeyframeSelectedState>) => void
): HistoryItem {
  const current = { ...state }

  const redo = () => {
    if (shift) {
      const props = shiftMergeProps(current[id]?.props ?? {}, propsState.props)
      const next = {
        ...current,
        [id]: {
          props,
        },
      }

      if (Object.keys(props).length === 0) delete next[id]
      setFn(next)
    } else {
      setFn({
        ...(id ? { [id]: propsState } : {}),
        ...dropMap(state, visibledMap),
      })
    }
  }
  return {
    name: 'Select Keyframe',
    undo: () => {
      setFn({ ...current })
    },
    redo,
  }
}

function getSelectListItem(
  state: IdMap<KeyframeSelectedState>,
  selectedMap: { [id: string]: any } = {},
  visibledMap: { [id: string]: any } = {},
  shift = false,
  setFn: (val: IdMap<KeyframeSelectedState>) => void
): HistoryItem {
  const current = { ...state }

  const redo = () => {
    const ids = Object.keys(selectedMap)

    if (shift) {
      const dropIds: IdMap<boolean> = {}
      const idMap: IdMap<KeyframeSelectedState> = {}
      ids.forEach((id) => {
        if (isAllExistSelected(selectedMap[id], state[id])) {
          dropIds[id] = true
        } else {
          idMap[id] = getAllSelectedProps(selectedMap[id])
        }
      })
      setFn(dropMap({ ...state, ...idMap }, dropIds))
    } else {
      const idMap = ids.reduce<IdMap<KeyframeSelectedState>>((p, id) => {
        p[id] = getAllSelectedState(selectedMap[id])
        return p
      }, {})
      setFn({
        ...dropMap(state, visibledMap),
        ...idMap,
      })
    }
  }
  return {
    name: 'Select Keyframe',
    undo: () => {
      setFn({ ...current })
    },
    redo,
  }
}

function getReplaceItem(
  state: IdMap<KeyframeSelectedState>,
  next: IdMap<KeyframeSelectedState>,
  setFn: (val: IdMap<KeyframeSelectedState>) => void
): HistoryItem {
  const current = { ...state }

  const redo = () => {
    setFn(next)
  }
  return {
    name: 'Select Keyframe',
    undo: () => {
      setFn({ ...current })
    },
    redo,
  }
}
