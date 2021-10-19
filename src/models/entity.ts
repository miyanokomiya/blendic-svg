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

import { IdMap, toMap } from '/@/models'
import { mapFilter, reduceToMap } from '/@/utils/commons'

export interface Entity {
  id: string
}

export type DeletedInfo<T> = { entity: T; index: number }

export type RestoreData<T> = {
  created: string[]
  updated: T[]
  deleted: DeletedInfo<T>[]
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

export function replaceEntities<T extends Entity>(
  src: Entities<T>,
  val: T[],
  targets: { [id: string]: true } | string[]
): RestoreData<T> {
  const _targets = Array.isArray(targets)
    ? reduceToMap(targets, () => true)
    : targets

  const replaced = toMap(val)
  const restoreData: RestoreData<T> = {
    created: [],
    updated: [],
    deleted: [],
  }

  src.allIds.forEach((id, index) => {
    if (!_targets[id]) return

    if (replaced[id]) {
      // update
      restoreData.updated.push(src.byId[id])
      src.byId[id] = replaced[id]
    } else {
      // delete
      restoreData.deleted.push({
        entity: src.byId[id],
        index,
      })
      delete src.byId[id]
    }
  })

  const deletedIds = toMap(restoreData.deleted.map((d) => d.entity))
  src.allIds = src.allIds.filter((id) => !deletedIds[id])

  const created = val.filter((v) => !src.byId[v.id])
  const createIds = created.map((v) => v.id)

  Object.assign(src.byId, toMap(created))
  src.allIds.push(...createIds)
  restoreData.created.push(...createIds)

  return restoreData
}

export function restoreEntities<T extends Entity>(
  src: Entities<T>,
  restoreData: RestoreData<T>
): void {
  restoreData.created.forEach((id) => {
    delete src.byId[id]
  })
  const created = reduceToMap(restoreData.created, () => true)
  src.allIds = src.allIds.filter((id) => !created[id])

  restoreData.deleted
    .concat()
    // should sort to splice correctly
    .sort((a, b) => a.index - b.index)
    .forEach((d) => {
      src.byId[d.entity.id] = d.entity
      src.allIds.splice(d.index, 0, d.entity.id)
    })

  restoreData.updated.forEach((u) => {
    src.byId[u.id] = u
  })
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
