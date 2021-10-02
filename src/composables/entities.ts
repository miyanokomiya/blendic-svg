import { reactive } from 'vue'
import { HistoryItem } from '/@/composables/stores/history'
import { IdMap, toMap } from '/@/models'
import { Entities, Entity } from '/@/models/entity'
import { extractMap, reduceToMap } from '/@/utils/commons'

export function useEntities<T extends Entity>(name: string) {
  const entities: Entities<T> = reactive({ byId: {}, allIds: [] })

  function init(defaultEntities: Entities<T>) {
    entities.byId = { ...defaultEntities.byId }
    entities.allIds = defaultEntities.allIds.concat()
  }

  function getAddItemsHistory(items: T[]): HistoryItem {
    return {
      name: `Add ${name}`,
      undo: () => {
        items.forEach((item) => delete entities.byId[item.id])
        const ids = toMap(items)
        entities.allIds = entities.allIds.filter((id) => !ids[id])
      },
      redo: () => {
        items.forEach((item) => {
          entities.byId[item.id] = item
          entities.allIds.push(item.id)
        })
      },
    }
  }

  function getDeleteItemsHistory(ids: string[]): HistoryItem {
    const deletedInfo = ids
      .map((id) => ({
        entity: entities.byId[id],
        index: entities.allIds.indexOf(id),
      }))
      // sort asc by index to splice easily in the undo operation
      .sort((a, b) => a.index - b.index)

    return {
      name: `Delete ${name}`,
      undo: () => {
        deletedInfo.forEach((info) => {
          entities.byId[info.entity.id] = info.entity
          entities.allIds.splice(info.index, 0, info.entity.id)
        })
      },
      redo: () => {
        ids.forEach((id) => delete entities.byId[id])
        const map = reduceToMap(ids, () => true)
        entities.allIds = entities.allIds.filter((id) => !map[id])
      },
    }
  }

  function getUpdateItemHistory(
    updatedMap: IdMap<Partial<T>>,
    seriesKey?: string
  ): HistoryItem {
    const beforeUpdated = extractMap(entities.byId, updatedMap)

    return {
      name: `Update ${name}`,
      undo: () => {
        Object.entries(beforeUpdated).forEach(
          ([id, val]) => (entities.byId[id] = val)
        )
      },
      redo: () => {
        Object.entries(beforeUpdated).forEach(
          ([id, val]) => (entities.byId[id] = { ...val, ...updatedMap[id] })
        )
      },
      seriesKey,
    }
  }

  return {
    init,
    getEntities: () => entities,
    getAddItemsHistory,
    getDeleteItemsHistory,
    getUpdateItemHistory,
  }
}
