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
