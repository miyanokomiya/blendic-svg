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
import { useEntities } from '/@/composables/stores/entities'
import { SelectOptions } from '/@/composables/modes/types'
import { useItemSelectable } from '/@/composables/stores/selectable'
import { HistoryStore } from '/@/composables/stores/history'
import { fromEntityList, toEntityList } from '/@/models/entity'
import { getPlainSvgTree, toBElement } from '/@/utils/elements'

export function createStore(historyStore: HistoryStore) {
  const actorEntities = useEntities<Actor>('Actor')
  const elementEntities = useEntities<BElement>('Element')

  const elementSelectable = useItemSelectable(
    'Element',
    () => elementEntities.entities.value.byId
  )
  const actorSelectable = useItemSelectable(
    'Actor',
    () => actorEntities.entities.value.byId
  )

  historyStore.defineReducers(actorEntities.reducers)
  historyStore.defineReducers(elementEntities.reducers)
  historyStore.defineReducers(actorSelectable.reducers)
  historyStore.defineReducers(elementSelectable.reducers)

  const actors = computed(() => toEntityList(actorEntities.entities.value))
  const lastSelectedActorId = actorSelectable.lastSelectedId
  const lastSelectedActor = computed(() =>
    lastSelectedActorId.value
      ? actorEntities.entities.value.byId[lastSelectedActorId.value]
      : undefined
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

  function initState(
    actors: Actor[],
    elements: BElement[],
    actorSelected: [string, true][],
    elementSelected: [string, true][]
  ) {
    actorEntities.init(fromEntityList(actors))
    elementEntities.init(fromEntityList(elements))
    actorSelectable.restore(actorSelected)
    elementSelectable.restore(elementSelected)
  }

  function exportState() {
    return {
      actors: actors.value,
      elements: toEntityList(elementEntities.entities.value),
      actorSelected: actorSelectable.createSnapshot(),
      elementSelected: elementSelectable.createSnapshot(),
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

    actorEntities.init(fromEntityList([actor]))
    elementEntities.init(fromEntityList([element]))
    actorSelectable.restore([[actor.id, true]])
    elementSelectable.restore([])
  }

  // only one actor is enabled currently
  function importActor(actor: Actor, elements: BElement[]) {
    historyStore.dispatch(
      actorEntities.createDeleteAction(actors.value.map((a) => a.id)),
      [
        actorEntities.createAddAction([actor]),
        elementEntities.createAddAction(elements),
        actorSelectable.createSelectAction(actor.id),
      ]
    ),
      true
  }

  function selectActor(id: string = '') {
    if (!actorSelectable.getSelectHistoryDryRun(id)) return

    historyStore.dispatch(actorSelectable.createSelectAction(id), [
      elementSelectable.createClearAllAction(),
    ]),
      true
  }

  function updateArmatureId(id: string) {
    const actor = lastSelectedActor.value
    if (!actor) return

    historyStore.dispatch(
      actorEntities.createUpdateAction({
        [actor.id]: { armatureId: id },
      })
    )
  }

  function selectElement(id = '', options?: SelectOptions) {
    if (
      !lastSelectedActor.value ||
      !elementSelectable.getSelectHistoryDryRun(id, options?.shift)
    )
      return

    historyStore.dispatch(
      elementSelectable.createSelectAction(id, options?.shift)
    )
  }

  function selectAllElement() {
    if (!lastSelectedActor.value) return
    historyStore.dispatch(elementSelectable.createSelectAllAction(true))
  }

  function updateElement(val: Partial<BElement>) {
    const element = lastSelectedElement.value
    if (!element) return

    historyStore.dispatch(
      elementEntities.createUpdateAction({
        [element.id]: val,
      })
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
