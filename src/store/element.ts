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

import { computed } from 'vue'
import { Actor, BElement, getActor, toMap } from '../models'
import { useHistoryStore } from './history'
import { useEntities } from '/@/composables/entities'
import { SelectOptions } from '/@/composables/modes/types'
import { useItemSelectable } from '/@/composables/selectable'
import { HistoryStore } from '/@/composables/stores/history'
import { fromEntityList, toEntityList } from '/@/models/entity'
import { getPlainSvgTree, toBElement } from '/@/utils/elements'
import { convolute } from '/@/utils/histories'

export function createStore(historyStore: HistoryStore) {
  const actorEntities = useEntities<Actor>('Actor')
  const actors = computed(() => toEntityList(actorEntities.entities.value))
  const actorSelectable = useItemSelectable(
    'Actor',
    () => actorEntities.entities.value.byId
  )
  const lastSelectedActorId = actorSelectable.lastSelectedId
  const lastSelectedActor = computed(() =>
    lastSelectedActorId.value
      ? actorEntities.entities.value.byId[lastSelectedActorId.value]
      : undefined
  )

  const elementEntities = useEntities<BElement>('Element')
  const elementSelectable = useItemSelectable(
    'Element',
    () => elementEntities.entities.value.byId
  )
  const selectedElements = elementSelectable.selectedMap
  const lastSelectedElementId = elementSelectable.lastSelectedId
  const elementMap = computed(() => {
    const byId = elementEntities.entities.value.byId
    return toMap(lastSelectedActor.value?.elements.map((id) => byId[id]) ?? [])
  })
  const lastSelectedElement = computed(() => {
    if (!lastSelectedElementId.value) return
    return elementMap.value[lastSelectedElementId.value]
  })

  function initState(actors: Actor[], elements: BElement[]) {
    actorEntities.init(fromEntityList(actors))
    if (actors.length > 0) {
      actorSelectable.getSelectHistory(actors[0].id).redo()
    } else {
      actorSelectable.getClearAllHistory().redo()
    }
    elementEntities.init(fromEntityList(elements))
    elementSelectable.getClearAllHistory().redo()
  }

  function exportState() {
    return {
      actors: actors.value,
      elements: toEntityList(elementEntities.entities.value),
    }
  }

  function createDefaultEntities() {
    const svgTree = getPlainSvgTree()
    const element = toBElement(svgTree)
    const actor = getActor({
      id: 'initial-actor',
      armatureId: 'initial-armature',
      svgTree,
      elements: [element.id],
    })

    actorEntities.getAddItemsHistory([actor]).redo()
    actorSelectable.getSelectHistory(actor.id).redo()
    elementEntities.getAddItemsHistory([element]).redo()
  }

  // only one actor is enabled currently
  function importActor(actor: Actor, elements: BElement[]) {
    historyStore.push(
      convolute(
        actorEntities.getDeleteItemsHistory(actors.value.map((a) => a.id)),
        [
          actorEntities.getAddItemsHistory([actor]),
          elementEntities.getAddItemsHistory(elements),
          actorSelectable.getSelectHistory(actor.id),
        ]
      ),
      true
    )
  }

  function selectActor(id: string = '') {
    if (lastSelectedActorId.value === id) return

    historyStore.push(
      convolute(
        id
          ? actorSelectable.getSelectHistory(id)
          : actorSelectable.getClearAllHistory(),
        [elementSelectable.getClearAllHistory()]
      ),
      true
    )
  }

  function updateArmatureId(id: string) {
    const actor = lastSelectedActor.value
    if (!actor) return

    historyStore.push(
      actorEntities.getUpdateItemHistory({
        [actor.id]: { armatureId: id },
      }),
      true
    )
  }

  function selectElement(id = '', options?: SelectOptions) {
    if (
      !lastSelectedActor.value ||
      !elementSelectable.getSelectHistoryDryRun(id, options?.shift)
    )
      return

    historyStore.push(
      elementSelectable.getSelectHistory(id, options?.shift),
      true
    )
  }

  function selectAllElement() {
    if (!lastSelectedActor.value) return
    historyStore.push(elementSelectable.getSelectAllHistory(true), true)
  }

  function updateElement(val: Partial<BElement>) {
    const element = lastSelectedElement.value
    if (!element) return

    historyStore.push(
      elementEntities.getUpdateItemHistory({
        [element.id]: val,
      }),
      true
    )
  }

  return {
    actors,
    lastSelectedActor,

    elementMap,
    selectedElements,
    lastSelectedElement,

    initState,
    exportState,
    createDefaultEntities,
    importActor,

    selectActor,
    updateArmatureId,

    selectElement,
    selectAllElement,
    updateElement,
  }
}

export type ElementStore = ReturnType<typeof createStore>

const store = createStore(useHistoryStore())
export function useElementStore() {
  return store
}
