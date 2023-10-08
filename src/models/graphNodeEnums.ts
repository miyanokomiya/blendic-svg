import { clamp } from 'okageo'
import { Linecap, Linejoin } from '/@/models'

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

type SPACE_UNITS_KEY = 'userSpaceOnUse' | 'objectBoundingBox'
export const SPACE_UNITS: GraphEnumItem<SPACE_UNITS_KEY>[] = [
  { key: 'userSpaceOnUse', value: 0 },
  { key: 'objectBoundingBox', value: 1 },
]

export const LINECAP: GraphEnumItem<Linecap>[] = [
  { key: 'butt', value: 0 },
  { key: 'round', value: 1 },
  { key: 'square', value: 2 },
]

export const LINEJOIN: GraphEnumItem<Linejoin>[] = [
  { key: 'arcs', value: 0 },
  { key: 'round', value: 1 },
  { key: 'bevel', value: 2 },
  { key: 'miter', value: 3 },
  { key: 'miter-clip', value: 4 },
]

export const GraphEnumMap = {
  SPREAD_METHOD,
  SPACE_UNITS,
  LINECAP,
  LINEJOIN,
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
