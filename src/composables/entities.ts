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

import { computed, reactive } from 'vue'
import { IdMap } from '/@/models'
import { DeletedInfo, Entities, Entity } from '/@/models/entity'
import { extractMap, reduceToMap } from '/@/utils/commons'
import * as okahistory from 'okahistory'

export function useEntities<T extends Entity>(name: string) {
  const entities: Entities<T> = reactive({ byId: {}, allIds: [] })

  function init(defaultEntities: Entities<T>) {
    entities.byId = { ...defaultEntities.byId }
    entities.allIds = defaultEntities.allIds.concat()
  }

  const actionNames = {
    add: `${name}_ADD`,
    delete: `${name}_DELETE`,
    update: `${name}_UPDATE`,
  }

  const addReducer: okahistory.Reducer<T[], string[]> = {
    getLabel: () => `Add ${name}`,
    redo(items) {
      items.forEach((item) => {
        entities.byId[item.id] = item
        entities.allIds.push(item.id)
      })
      return items.map((item) => item.id)
    },
    undo(ids) {
      ids.forEach((id) => delete entities.byId[id])
      const idMap = reduceToMap(ids, () => true)
      entities.allIds = entities.allIds.filter((id) => !idMap[id])
    },
  }

  function createAddAction(items: T[]): okahistory.Action<T[]> {
    return {
      name: actionNames.add,
      args: items,
    }
  }

  const deleteReducer: okahistory.Reducer<string[], DeletedInfo<T>[]> = {
    getLabel: () => `Delete ${name}`,
    redo(ids) {
      const deletedInfo = ids
        .map((id) => ({
          entity: entities.byId[id],
          index: entities.allIds.indexOf(id),
        }))
        // sort asc by index to splice easily in the undo operation
        .sort((a, b) => a.index - b.index)

      ids.forEach((id) => delete entities.byId[id])
      const map = reduceToMap(ids, () => true)
      entities.allIds = entities.allIds.filter((id) => !map[id])

      return deletedInfo
    },
    undo(deletedInfo) {
      deletedInfo.forEach((info) => {
        entities.byId[info.entity.id] = info.entity
        entities.allIds.splice(info.index, 0, info.entity.id)
      })
    },
  }

  function createDeleteAction(ids: string[]): okahistory.Action<string[]> {
    return {
      name: actionNames.delete,
      args: ids,
    }
  }

  const updateReducer: okahistory.Reducer<IdMap<Partial<T>>, IdMap<T>> = {
    getLabel: () => `Update ${name}`,
    redo: (updatedMap) => {
      const origin = extractMap(entities.byId, updatedMap)
      Object.entries(origin).forEach(
        ([id, val]) => (entities.byId[id] = { ...val, ...updatedMap[id] })
      )
      return origin
    },
    undo: (snapshot) => {
      Object.entries(snapshot).forEach(([id, val]) => (entities.byId[id] = val))
    },
  }

  function createUpdateAction(
    updatedMap: IdMap<Partial<T>>,
    seriesKey?: string
  ): okahistory.Action<IdMap<Partial<T>>> {
    return {
      name: actionNames.update,
      args: updatedMap,
      seriesKey,
    }
  }

  return {
    init,
    entities: computed(() => entities),
    reducers: {
      [actionNames.add]: addReducer,
      [actionNames.delete]: deleteReducer,
      [actionNames.update]: updateReducer,
    },
    createAddAction,
    createDeleteAction,
    createUpdateAction,
  }
}
