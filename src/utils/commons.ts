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

import { getNextName } from '/@/utils/relations'

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

export function mapReduce<T, R>(
  map: { [key: string]: T },
  fn: (t: T, key: string) => R
): { [key: string]: R } {
  return Object.keys(map).reduce<{ [key: string]: R }>((p, c) => {
    p[c] = fn(map[c], c)
    return p
  }, {})
}

export function extractMap<T>(
  origin: { [key: string]: T },
  keyMap: { [key: string]: any }
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
  keyMap: { [key: string]: any }
): { [key: string]: T } {
  return dropMapIfFalse(origin, (_t, key) => keyMap[key] === undefined)
}

export function dropMapIfFalse<T>(
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
    dropMapIfFalse<T>(
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
      p[n] = getNextName(n, allNames)
    } else {
      p[n] = n
    }
    allNames.push(p[n])
    return p
  }, {})
}

export function sortByValue<T extends { [key: string]: any }, K extends string>(
  items: T[],
  key: K
): T[] {
  const orderMap = items
    .map((b) => b[key])
    .sort()
    .reduce<{ [key: string]: number }>((p, c, i) => {
      p[c] = i
      return p
    }, {})
  return items.concat().sort((a, b) => orderMap[a[key]] - orderMap[b[key]])
}

export function sumReduce(
  list: { [key: string]: number }[]
): { [key: string]: number } {
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
