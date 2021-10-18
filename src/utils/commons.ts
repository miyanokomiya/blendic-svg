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

import { v4 } from 'uuid'
import { IdMap, toMap } from '/@/models'
import { getNotDuplicatedName } from '/@/utils/relations'

export function toKeyMap<T extends object>(
  list: T[],
  key: string | number
): { [key: string]: T } {
  return list.reduce<{ [key: string]: T }>((p, c: any) => {
    const k = c[key]
    p[k] = c
    return p
  }, {})
}

export function toKeyListMap<T extends object>(
  list: T[],
  key: string | number
): { [key: string]: T[] } {
  const map: { [key: string]: T[] } = {}
  list.forEach((c: any) => {
    if (map[c[key]]) {
      map[c[key]].push(c)
    } else {
      map[c[key]] = [c]
    }
  })
  return map
}

export function flatKeyListMap<T>(map: { [key: string]: T[] }): T[] {
  return Object.keys(map).flatMap((k) => map[k])
}

export function toList<T>(map: { [key: string]: T }): T[] {
  return Object.keys(map).map((key) => map[key])
}

export function mapReduce<T, R, K extends string>(
  map: { [key in K]?: T },
  fn: (t: T, key: K) => R
): { [key in K]: R } {
  return Object.keys(map).reduce<any>((p, c) => {
    p[c] = fn((map as any)[c], c as K)
    return p
  }, {})
}

export function extractMap<T>(
  origin: { [key: string]: T },
  keyMap: { [key: string]: unknown }
): { [key: string]: T } {
  return Object.keys(keyMap).reduce<{ [key: string]: T }>((p, c) => {
    if (origin[c] !== undefined) {
      p[c] = origin[c]
    }
    return p
  }, {})
}

export function dropMap<T>(
  origin: { [key: string]: T },
  keyMap: { [key: string]: unknown }
): { [key: string]: T } {
  return mapFilter(origin, (_t, key) => keyMap[key] === undefined)
}

export function mapFilter<T>(
  origin: { [key: string]: T },
  checkFn: (t: T, key: string) => boolean
): { [key: string]: T } {
  return Object.keys(origin).reduce<{ [key: string]: T }>((p, c) => {
    if (checkFn(origin[c], c)) {
      p[c] = origin[c]
    }
    return p
  }, {})
}

export function mergeListByKey<T extends object>(
  src: T[],
  override: T[],
  key: string
): T[] {
  return toList({
    ...toKeyMap<T>(src, key),
    ...toKeyMap<T>(override, key),
  })
}

export function dropListByKey<T extends object>(
  src: T[],
  drop: T[],
  key: string,
  inverse = false
): T[] {
  const srcMap = toKeyMap<T>(src, key)
  const dropMap = toKeyMap<T>(drop, key)
  return toList(
    mapFilter<T>(
      srcMap,
      (s, id) => ((s as any)[key] === (dropMap[id] as any)?.[key]) === inverse
    )
  )
}

export function getParentIdPath(
  itemMap: { [id: string]: { id: string; parentId: string } },
  from: string,
  preventId = ''
): string[] {
  const b = itemMap[from]
  if (!b || !itemMap[b.parentId] || preventId === b.parentId) {
    return []
  } else {
    return [...getParentIdPath(itemMap, b.parentId, preventId), b.parentId]
  }
}

export function getTreeIdPath(
  idMap: IdMap<{ id: string; parentId: string }>,
  a: string,
  b: string
): string[] {
  const aPath = getParentIdPath(idMap, a)
  const aIndex = aPath.findIndex((id) => id === b)
  if (aIndex !== -1) {
    return [...aPath.slice(aIndex), a]
  }

  const bPath = getParentIdPath(idMap, b)
  const bIndex = bPath.findIndex((id) => id === a)
  if (bIndex !== -1) {
    return [...bPath.slice(bIndex), b]
  }

  return [a, b]
}

export function hasLeftRightName(name: string): '' | 'r' | 'R' | 'l' | 'L' {
  if (/\.r\.?/.test(name)) {
    return 'r'
  } else if (/\.R\.?/.test(name)) {
    return 'R'
  } else if (/\.l\.?/.test(name)) {
    return 'l'
  } else if (/\.L\.?/.test(name)) {
    return 'L'
  } else {
    return ''
  }
}

const symmetrizedNameMap = {
  '': '',
  r: 'l',
  R: 'L',
  l: 'r',
  L: 'R',
}

export function symmetrizeName(name: string): string {
  const d = hasLeftRightName(name)
  if (!symmetrizedNameMap[d]) return name
  return name.replace(`.${d}`, `.${symmetrizedNameMap[d]}`)
}

export function getUnduplicatedNameMap(
  originalNames: string[],
  newNames: string[]
): { [name: string]: string } {
  const allNames = originalNames.concat()
  return newNames.reduce<{ [name: string]: string }>((p, n) => {
    if (allNames.includes(n)) {
      p[n] = getNotDuplicatedName(n, allNames)
    } else {
      p[n] = n
    }
    allNames.push(p[n])
    return p
  }, {})
}

export function sortByValue<
  K extends string,
  T extends { [key in K]: string | number }
>(items: T[], key: K): T[] {
  const orderMap = items
    .map((b) => b[key])
    .sort()
    .reduce<{ [key: string]: number }>((p, c, i) => {
      p[c] = i
      return p
    }, {})
  return items.concat().sort((a, b) => orderMap[a[key]] - orderMap[b[key]])
}

export function sumReduce(list: { [key: string]: number }[]): {
  [key: string]: number
} {
  return list.reduce<{ [key: string]: number }>((p, c) => {
    return sumMap(p, c)
  }, {})
}

export function sumMap(
  a: { [key: string]: number },
  b: { [key: string]: number }
): { [key: string]: number } {
  return Object.keys(b).reduce(
    (p, c) => {
      if (p[c]) {
        p[c] += b[c]
      } else {
        p[c] = b[c]
      }
      return p
    },
    { ...a }
  )
}

export function regenerateIdMap<T extends { id: string }>(
  src: IdMap<T>
): IdMap<T> {
  return toMap(toList(src).map((item) => ({ ...item, id: v4() })))
}

export function pickAnyItem<T>(map: { [key: string]: T }): T | undefined {
  const ids = Object.keys(map)
  return ids.length > 0 ? map[ids[0]] : undefined
}

export function mapFilterExec<T>(
  srcMap: { [key: string]: T },
  targetMap: { [key: string]: unknown },
  fn: (map: { [key: string]: T }) => { [key: string]: T }
): { [key: string]: T } {
  return {
    ...dropMap(srcMap, targetMap),
    ...fn(extractMap(srcMap, targetMap)),
  }
}

export function hasSameProps<T extends { [key: string]: unknown }>(
  a: T,
  b: T
): boolean {
  const aKeys = Object.keys(a)
  const bKeys = Object.keys(b)

  if (aKeys.length !== bKeys.length) return false
  return aKeys.every((key) => a[key] === b[key])
}

export function shiftMergeProps<T>(
  a?: { [key: string]: T },
  b?: { [key: string]: T },
  compareFn: (v1: T, v2: T) => boolean = (v1, v2) => v1 === v2
): { [key: string]: T } | undefined {
  if (!a) return b
  if (!b) return a

  // toggle boolean if updated map has only one key
  // e.g.  a = { x: true, y: false }, b = { x: true, y: true }
  // => expected to be     { x: true, y: true }
  // =>          not to be { x: false, y: true }
  const ignoretoggle = Object.keys(b).length > 1

  // set all false if current and next map have all same props with true value
  let shouldtoggleAllFalse = true

  const ret = Object.keys({ ...a, ...b }).reduce<{ [key: string]: T }>(
    (p, c) => {
      if (compareFn(a[c], b[c]) && !ignoretoggle) return p

      shouldtoggleAllFalse =
        shouldtoggleAllFalse && !!a[c] && !!b[c] && compareFn(a[c], b[c])

      p[c] = b[c] ?? a[c]
      return p
    },
    {}
  )

  if (shouldtoggleAllFalse) {
    return
  } else {
    return ret
  }
}

export function mergeOrDropMap<T>(
  src: IdMap<T>,
  key: string,
  value?: T
): IdMap<T> {
  return value ? { ...src, [key]: value } : dropMap(src, { [key]: true })
}

export function uniq<T>(src: T[]): T[] {
  return Array.from(new Set(src))
}

export function resetId<T extends { id: string }>(src: T): T {
  return {
    ...src,
    id: v4(),
  }
}

export function getFirstProp<A extends string, T extends { [key in A]: K }, K>(
  src: T[],
  key: A,
  defaultValue: K
): K {
  const first = src[0]
  if (!first) return defaultValue
  return first[key] as K
}

export function splitList<T>(
  list: T[],
  checkfn: (item: T) => boolean = (item) => !!item
): [trueList: T[], falseList: T[]] {
  const t: T[] = []
  const f: T[] = []
  list.forEach((item) => {
    if (checkfn(item)) {
      t.push(item)
    } else {
      f.push(item)
    }
  })
  return [t, f]
}

export function reduceToMap<T>(ids: string[], fn: (id: string) => T): IdMap<T> {
  return ids.reduce<IdMap<T>>((p, c) => {
    p[c] = fn(c)
    return p
  }, {})
}

export function shallowEqual(
  a: { [key: string]: any },
  b: { [key: string]: any }
): boolean {
  const aEntries = Object.entries(a)
  const bEntries = Object.entries(b)

  return (
    aEntries.length === bEntries.length &&
    aEntries.every(([key, val]) => val === b[key])
  )
}
