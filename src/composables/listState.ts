import { reactive, computed, watch } from 'vue'
import { HistoryItem, useHistoryStore } from '../store/history'
import { getOriginPartial, IdMap, toMap } from '/@/models'

interface State<T extends { id: string }> {
  label: string
  list: T[]
  lastSelectedId: string
  selectedMap: IdMap<boolean>
}

const historyStore = useHistoryStore()

export function useListState<T extends { id: string }>(label: string) {
  const state = reactive<State<T>>({
    label,
    list: [] as T[],
    lastSelectedId: '',
    selectedMap: {} as IdMap<boolean>,
  })

  const lastSelectedIndex = computed(() =>
    state.list.findIndex(
      (a) =>
        a.id === state.lastSelectedId && state.selectedMap[state.lastSelectedId]
    )
  )

  const itemMap = computed(() => toMap(state.list))

  const lastSelectedItem = computed(() =>
    lastSelectedIndex.value !== -1
      ? state.list[lastSelectedIndex.value]
      : undefined
  )

  watch(
    () => state.selectedMap,
    () => {
      if (!state.selectedMap[state.lastSelectedId]) {
        state.lastSelectedId = ''
      }
    }
  )

  watch(
    () => itemMap.value,
    () => {
      // unselect unexisted armatures
      state.selectedMap = Object.keys(state.selectedMap).reduce<IdMap<boolean>>(
        (m, id) => {
          return itemMap.value[id]
            ? {
                ...m,
                [id]: state.selectedMap[id],
              }
            : m
        },
        {}
      )
    }
  )

  function selectItem(id: string) {
    if (state.lastSelectedId === id) return

    const item = getSelectItem(state, id)
    item.redo()
    historyStore.push(item)
  }
  function addItem<T extends { id: string }>(val: T) {
    const item = getAddItem(state, val as any) // FIXME tsserver worning
    item.redo()
    historyStore.push(item)
  }
  function deleteItem() {
    if (lastSelectedIndex.value === -1) return

    const item = getDeleteItem(state, lastSelectedIndex.value)
    item.redo()
    historyStore.push(item)
  }
  function updateItem<T extends { id: string }>(val: Partial<T>) {
    if (lastSelectedIndex.value === -1) return

    const item = getUpdateItem(state, val as any, lastSelectedIndex.value) // FIXME tsserver worning
    item.redo()
    historyStore.push(item)
  }

  return {
    state,
    itemMap,
    lastSelectedIndex,
    lastSelectedItem,
    selectItem,
    addItem,
    deleteItem,
    updateItem,
  }
}

export function getSelectItem<T extends { id: string }>(
  state: State<T>,
  id: string
): HistoryItem {
  const current = { ...state.selectedMap }
  const currentLast = state.lastSelectedId
  const redo = () => {
    state.selectedMap = id ? { [id]: true } : {}
    state.lastSelectedId = id
  }
  return {
    name: `Select ${state.label}`,
    undo: () => {
      state.selectedMap = { ...current }
      state.lastSelectedId = currentLast
    },
    redo,
  }
}

export function getAddItem<T extends { id: string }>(
  state: State<T>,
  item: T
): HistoryItem {
  const index = state.list.length
  const selectItem = getSelectItem(state, item.id)

  const redo = () => {
    state.list.push(item)
    selectItem.redo()
  }
  return {
    name: `Add ${state.label}`,
    undo: () => {
      state.list.splice(index, 1)
      selectItem.undo()
    },
    redo,
  }
}

export function getDeleteItem<T extends { id: string }>(
  state: State<T>,
  lastSelectedIndex: number
): HistoryItem {
  const current = { ...state.list[lastSelectedIndex]! }
  const index = lastSelectedIndex
  const selectItem = getSelectItem(state, '')

  const redo = () => {
    state.list.splice(index, 1)
  }
  return {
    name: `Delete ${state.label}`,
    undo: () => {
      state.list.splice(index, 0, current)
      selectItem.undo()
    },
    redo,
  }
}
function getUpdateItem<T extends { id: string }>(
  state: State<T>,
  updated: Partial<T>,
  lastSelectedIndex: number
): HistoryItem {
  const current = getOriginPartial(state.list[lastSelectedIndex], updated)

  const redo = () => {
    state.list[lastSelectedIndex] = {
      ...state.list[lastSelectedIndex],
      ...updated,
    }
  }
  return {
    name: `Update ${state.label}`,
    undo: () => {
      state.list[lastSelectedIndex] = {
        ...state.list[lastSelectedIndex],
        ...current,
      }
    },
    redo,
  }
}
