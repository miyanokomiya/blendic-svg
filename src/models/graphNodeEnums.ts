import { clamp } from 'okageo'

type GraphEnumItem<T extends string> = {
  key: T
  value: number
}

type SPREAD_METHOD_KEY = 'pad' | 'reflect' | 'repeat'
export const SPREAD_METHOD: GraphEnumItem<SPREAD_METHOD_KEY>[] = [
  { key: 'pad', value: 0 },
  { key: 'reflect', value: 1 },
  { key: 'repeat', value: 2 },
]

type CLIP_PATH_UNITS_KEY = 'userSpaceOnUse' | 'objectBoundingBox'
export const CLIP_PATH_UNITS: GraphEnumItem<CLIP_PATH_UNITS_KEY>[] = [
  { key: 'userSpaceOnUse', value: 0 },
  { key: 'objectBoundingBox', value: 1 },
]

export const GraphEnumMap = {
  SPREAD_METHOD,
  CLIP_PATH_UNITS,
}
export type GraphEnumMapKey = keyof typeof GraphEnumMap

export function getGraphValueEnumKey(
  enumKey: GraphEnumMapKey,
  value: number
): string {
  const map: GraphEnumItem<string>[] = GraphEnumMap[enumKey] ?? []
  const v = clamp(0, map.length - 1, Math.floor(value))
  return map.find((item) => item.value === v)?.key ?? ''
}
