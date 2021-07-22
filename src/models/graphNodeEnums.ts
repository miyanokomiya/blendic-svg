import { clamp } from '/@/utils/geometry'

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

export const GraphEnumMap = {
  SPREAD_METHOD,
}
export type GraphEnumMapKey = keyof typeof GraphEnumMap

export function getGraphValueEnumKey(
  enumKey: GraphEnumMapKey,
  value: number
): string {
  const map = GraphEnumMap[enumKey] ?? []
  const v = clamp(0, map.length - 1, Math.floor(value))
  return map.find((item) => item.value === v)?.key ?? ''
}
