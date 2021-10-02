import { IdMap, toMap } from '/@/models'
import { mapFilter, reduceToMap } from '/@/utils/commons'

export interface Entity {
  id: string
}

export interface Entities<T extends Entity> {
  byId: IdMap<T>
  allIds: string[]
}

export function setEntities<T extends Entity>(
  src: Entities<T>,
  entities: T[]
): void {
  src.byId = toMap(entities)
  src.allIds = entities.map((e) => e.id)
}

export function addEntity<T extends Entity>(src: Entities<T>, entity: T): void {
  src.byId[entity.id] = entity
  src.allIds.push(entity.id)
}

export function updateEntity<T extends Entity>(
  src: Entities<T>,
  entity: T
): void {
  src.byId[entity.id] = entity
}

export function updateEntities<T extends Entity>(
  src: Entities<T>,
  entitiesById: IdMap<T>
): void {
  Object.entries(entitiesById).forEach(([id, val]) => (src.byId[id] = val))
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
): void {
  const deletedMap = reduceToMap(ids, () => true)
  ids.forEach((id) => delete src.byId[id])
  src.allIds = src.allIds.filter((key) => !deletedMap[key])
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
