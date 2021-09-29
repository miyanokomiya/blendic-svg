import { IdMap, toMap } from '/@/models'
import { mapFilter, reduceToMap } from '/@/utils/commons'

export interface Entity {
  id: string
}

export interface Entities<T extends Entity> {
  byId: IdMap<T>
  allIds: string[]
}

export function addEntity<T extends Entity>(
  src: Entities<T>,
  entity: T
): Entities<T> {
  return {
    byId: { ...src.byId, [entity.id]: entity },
    allIds: [...src.allIds, entity.id],
  }
}

export function updateEntity<T extends Entity>(
  src: Entities<T>,
  entity: T
): Entities<T> {
  return {
    byId: {
      ...src.byId,
      [entity.id]: entity,
    },
    allIds: src.allIds,
  }
}

export function updateEntities<T extends Entity>(
  src: Entities<T>,
  entitiesById: IdMap<T>
): Entities<T> {
  return {
    byId: { ...src.byId, ...entitiesById },
    allIds: src.allIds,
  }
}

export function removeEntity<T extends Entity>(
  src: Entities<T>,
  id: string
): Entities<T> {
  return {
    byId: mapFilter(src.byId, (_, key) => key !== id),
    allIds: src.allIds.filter((key) => key !== id),
  }
}

export function removeEntities<T extends Entity>(
  src: Entities<T>,
  ids: string[]
): Entities<T> {
  const targets = reduceToMap(ids, () => true)
  const allIds = src.allIds.filter((key) => !targets[key])
  return {
    byId: allIds.reduce<Entities<T>['byId']>((p, key) => {
      p[key] = src.byId[key]
      return p
    }, {}),
    allIds,
  }
}

export function toEntityList<T extends Entity>(src: Entities<T>): T[] {
  return src.allIds.map((id) => src.byId[id])
}

export function fromEntityList<T extends Entity>(list: T[]): Entities<T> {
  return {
    byId: toMap(list),
    allIds: list.map((item) => item.id),
  }
}
