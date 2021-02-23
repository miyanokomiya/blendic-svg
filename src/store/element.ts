import { computed, ref } from 'vue'
import { useListState } from '../composables/listState'
import { Actor, IdMap } from '../models'
import { HistoryItem, useHistoryStore } from './history'

const historyStore = useHistoryStore()

const actorsState = useListState<Actor>('Actor')
const selectedElements = ref<IdMap<boolean>>({})

const lastSelectedActor = computed(() => {
  return actorsState.lastSelectedItem.value
})

function initState(actors: Actor[]) {
  actorsState.state.list = actors
  if (actors.length > 0) {
    actorsState.state.lastSelectedId = actors[0].id
    actorsState.state.selectedMap = { [actors[0].id]: true }
  }
}

function selectElement(id = '', shift = false) {
  const item = getSelectItem(id, shift)
  item.redo()
  historyStore.push(item)
}

export function useElementStore() {
  return {
    initState,
    actors: computed(() => actorsState.state.list),
    lastSelectedActor,

    selectedElements,
    selectElement,
  }
}

export function getSelectItem(id: string, shift = false): HistoryItem {
  const current = { ...selectedElements.value }
  const redo = () => {
    if (shift) {
      if (selectedElements.value[id]) {
        delete selectedElements.value[id]
      } else {
        selectedElements.value[id] = true
      }
    } else {
      selectedElements.value = id ? { [id]: true } : {}
    }
  }
  return {
    name: 'Select Element',
    undo: () => {
      selectedElements.value = { ...current }
    },
    redo,
  }
}
