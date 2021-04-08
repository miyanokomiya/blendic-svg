import { ref } from '@vue/reactivity'
import { computed } from '@vue/runtime-core'
import { IdMap } from '/@/models'
import { HistoryItem } from '/@/store/history'
import { dropMap, extractMap, mapReduce } from '/@/utils/commons'

type PropStatus = 'selected' | 'hidden'

interface TargetProps {
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
    shift = false
  ): HistoryItem {
    return getSelectItem(
      selectedStateMap.value,
      id,
      propsState,
      shift,
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

function getSelectItem(
  state: IdMap<TargetPropsState>,
  id: string,
  propsState: TargetPropsState,
  shift = false,
  setFn: (val: IdMap<TargetPropsState>) => void
): HistoryItem {
  const current = { ...state }

  const redo = () => {
    if (shift) {
      setFn({
        ...current,
        [id]: {
          id,
          props: { ...(current[id]?.props ?? {}), ...propsState.props },
        },
      })
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
