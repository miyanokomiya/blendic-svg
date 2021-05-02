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

import { computed, ref } from 'vue'
import { useListState } from '../composables/listState'
import { Actor, BElement, IdMap, toMap } from '../models'
import { extractMap, mapReduce, toList } from '../utils/commons'
import { useHistoryStore } from './history'
import { HistoryItem } from '/@/composables/stores/history'
import { flatElementTree } from '/@/utils/elements'

const historyStore = useHistoryStore()

const actorsState = useListState<Actor>('Actor')
const selectedElements = ref<IdMap<boolean>>({})
const lastSelectedElementId = ref<string>()

const lastSelectedActor = computed(() => {
  return actorsState.lastSelectedItem.value
})

const elementMap = computed(() =>
  toMap(lastSelectedActor.value?.elements ?? [])
)

const nativeElementMap = computed(() => {
  if (!lastSelectedActor.value) return {}
  return toMap(flatElementTree([lastSelectedActor.value.svgTree]))
})

const lastSelectedElement = computed(() => {
  if (!lastSelectedElementId.value) return
  return elementMap.value[lastSelectedElementId.value]
})

const lastSelectedNativeElement = computed(() => {
  if (!lastSelectedElementId.value) return
  return nativeElementMap.value[lastSelectedElementId.value]
})

const selectedElementCount = computed(() => {
  return Object.keys(selectedElements.value).length
})

function initState(actors: Actor[]) {
  actorsState.state.list = actors
  if (actors.length > 0) {
    actorsState.state.lastSelectedId = actors[0].id
    actorsState.state.selectedMap = { [actors[0].id]: true }
  }
}

function importActor(actor: Actor) {
  const item = getImportActorItem(actor)
  item.redo()
  historyStore.push(item)
}

function selectElement(id = '', shift = false) {
  if (!id && Object.keys(selectedElements.value).length === 0) return
  if (
    !shift &&
    id === lastSelectedElementId.value &&
    selectedElementCount.value === 1
  )
    return

  const item = getSelectItem(id, shift)
  item.redo()
  historyStore.push(item)
}

function selectAllElement() {
  if (Object.keys(elementMap.value).length === 0) return

  if (selectedElementCount.value === Object.keys(elementMap.value).length) {
    selectElement('')
  } else {
    const item = getSelectAllItem()
    item.redo()
    historyStore.push(item)
  }
}

function updateArmatureId(id: string) {
  if (!lastSelectedActor.value) return

  const item = getUpdateArmatureIdItem(id)
  item.redo()
  historyStore.push(item)
}

function updateElement(val: Partial<BElement>) {
  if (!lastSelectedElement.value) return

  const item = getUpdateElementItem(val)
  item.redo()
  historyStore.push(item)
}

export function useElementStore() {
  return {
    initState,
    importActor,
    actors: computed(() => actorsState.state.list),
    lastSelectedActor,
    lastSelectedElement,
    lastSelectedNativeElement,

    updateArmatureId,
    updateElement,

    selectedElements,
    selectElement,
    selectAllElement,
  }
}
export type ElementStore = ReturnType<typeof useElementStore>

export function getSelectItem(id: string, shift = false): HistoryItem {
  const current = { ...selectedElements.value }
  const currentLast = lastSelectedElementId.value

  const redo = () => {
    if (shift) {
      if (selectedElements.value[id]) {
        delete selectedElements.value[id]
        if (lastSelectedElementId.value === id) {
          lastSelectedElementId.value = ''
        }
      } else {
        selectedElements.value[id] = true
        lastSelectedElementId.value = id
      }
    } else {
      selectedElements.value = id ? { [id]: true } : {}
      lastSelectedElementId.value = id
    }

    if (!lastSelectedElementId.value && selectedElementCount.value > 0) {
      lastSelectedElementId.value = Object.keys(selectedElements.value)[0]
    }
  }
  return {
    name: 'Select Element',
    undo: () => {
      selectedElements.value = { ...current }
      lastSelectedElementId.value = currentLast
    },
    redo,
  }
}

export function getSelectAllItem(): HistoryItem {
  const current = { ...selectedElements.value }
  const currentLast = lastSelectedElementId.value

  const redo = () => {
    selectedElements.value = mapReduce(elementMap.value, () => true)
    lastSelectedElementId.value = Object.keys(elementMap)[0] ?? ''
  }
  return {
    name: 'Select All Element',
    undo: () => {
      selectedElements.value = { ...current }
      lastSelectedElementId.value = currentLast
    },
    redo,
  }
}

export function getUpdateArmatureIdItem(id: string): HistoryItem {
  const current = lastSelectedActor.value!.armatureId
  const currentElements = elementMap.value

  const redo = () => {
    lastSelectedActor.value!.armatureId = id
    lastSelectedActor.value!.elements = lastSelectedActor.value!.elements.map(
      (e) => ({ ...e, boneId: '' })
    )
  }
  return {
    name: 'Update Parent',
    undo: () => {
      lastSelectedActor.value!.armatureId = current
      lastSelectedActor.value!.elements = toList(currentElements)
    },
    redo,
  }
}

export function getUpdateElementItem(val: Partial<BElement>): HistoryItem {
  const current = extractMap(elementMap.value, selectedElements.value)

  const redo = () => {
    lastSelectedActor.value!.elements = toList({
      ...elementMap.value,
      ...mapReduce(current, (e) => ({ ...e, ...val })),
    })
  }
  return {
    name: 'Update Parent',
    undo: () => {
      lastSelectedActor.value!.elements = toList({
        ...elementMap.value,
        ...current,
      })
    },
    redo,
  }
}

export function getImportActorItem(actor: Actor): HistoryItem {
  const current = actorsState.state.list.concat()
  const lastSelectedId = actorsState.state.lastSelectedId
  const selectedMap = { ...actorsState.state.selectedMap }

  const redo = () => {
    actorsState.state.list = [actor]
    actorsState.state.lastSelectedId = actor.id
    actorsState.state.selectedMap = { [actor.id]: true }
  }
  return {
    name: 'Import Actor',
    undo: () => {
      actorsState.state.list = current.concat()
      actorsState.state.lastSelectedId = lastSelectedId
      actorsState.state.selectedMap = { ...selectedMap }
    },
    redo,
  }
}
