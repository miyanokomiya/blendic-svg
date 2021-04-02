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

import { IdMap } from '/@/models'
import {
  KeyframeBase,
  KeyframeBaseProps,
  KeyframeBaseSameRange,
  KeyframeName,
  KeyframePoint,
  KeyframeSelectedState,
} from '/@/models/keyframe'
import { extractMap, mapReduce } from '/@/utils/commons'
import * as keyframeBoneModule from '/@/utils/keyframes/keyframeBone'

interface KeyframeModule {
  getKeyframeDefaultPropsMap<T>(val: () => T): Required<KeyframeBaseProps<T>>
  // normalizeCurves(keyframe: KeyframeBase): KeyframeBase
}

export function getKeyframeModule(name: KeyframeName): KeyframeModule {
  switch (name) {
    case 'bone':
      return keyframeBoneModule
  }
}

export function getAllSelectedState(
  keyframe: KeyframeBase
): KeyframeSelectedState {
  const map = getKeyframeDefaultPropsMap(() => true, keyframe.name)
  return {
    ...map,
    props: extractMap(map.props, keyframe.points),
  }
}

// export function normalizeCurves(keyframe: KeyframeBase): KeyframeBase {
//   return getKeyframeModule(keyframe.name).normalizeCurves(keyframe)
// }

export function inversedSelectedState(
  k: KeyframeSelectedState,
  target: KeyframeSelectedState
): KeyframeSelectedState {
  const ret: KeyframeSelectedState = { name: k.name, props: {} }

  Object.keys({ ...k.props, ...target.props }).forEach((key) => {
    if (
      (target.props[key] && !k.props[key]) ||
      (!target.props[key] && k.props[key])
    ) {
      ret.props[key] = true
    }
  })

  return ret
}

export function isAnySelected(k?: KeyframeSelectedState): boolean {
  if (!k) return false
  return Object.values(k.props).some((v) => v)
}

export function isAllExistSelected(
  keyframe: KeyframeBase,
  k?: KeyframeSelectedState
): boolean {
  if (!k) return false
  return Object.keys(keyframe.points).every((key) => k.props[key])
}

export function splitKeyframeBySelected(
  keyframe: KeyframeBase,
  state: KeyframeSelectedState
): { selected?: KeyframeBase; notSelected?: KeyframeBase } {
  if (isAllExistSelected(keyframe, state)) {
    return { selected: keyframe }
  }
  if (!isAnySelected(state)) {
    return { notSelected: keyframe }
  }

  const selected = { ...keyframe, points: { ...keyframe.points } }
  const notSelected = { ...keyframe, points: { ...keyframe.points } }

  Object.keys(keyframe.points).forEach((key) => {
    if (state.props[key]) {
      delete notSelected.points[key]
    } else {
      delete selected.points[key]
    }
  })

  return {
    selected,
    notSelected,
  }
}

export function mergeKeyframes(
  src: KeyframeBase,
  override: KeyframeBase
): KeyframeBase {
  const ret = { ...override, points: { ...override.points } }

  Object.keys(src.points).forEach((key) => {
    if (src.points[key] && !override.points[key]) {
      ret.points[key] = src.points[key]
    }
  })

  return ret
}

export function deleteKeyframeByProp(
  keyframe: KeyframeBase,
  selectedState?: KeyframeSelectedState
): KeyframeBase | undefined {
  if (!selectedState) return keyframe
  if (isAllExistSelected(keyframe, selectedState)) return

  const ret = { ...keyframe, points: { ...keyframe.points } }

  Object.keys(keyframe.points).forEach((key) => {
    if (selectedState.props[key]) {
      delete ret.points[key]
    }
  })

  return ret
}

export function getKeyframePropsMap(
  keyframes: KeyframeBase[],
  name: KeyframeName = 'bone'
): Required<KeyframeBaseProps<KeyframeBase[]>> {
  const ret = getKeyframeDefaultPropsMap<KeyframeBase[]>(() => [], name)

  keyframes.forEach((k) => {
    Object.keys(k.points).forEach((key) => {
      if (k.points[key]) {
        ret.props[key]?.push(k)
      }
    })
  })

  return ret
}

export function getKeyframeDefaultPropsMap<T>(
  val: () => T,
  name: KeyframeName = 'bone'
): Required<KeyframeBaseProps<T>> {
  return getKeyframeModule(name).getKeyframeDefaultPropsMap(val)
}

export function getSamePropRangeFrameMapById(
  keyframeMap: IdMap<KeyframeBase[]>
): IdMap<IdMap<KeyframeBaseSameRange>> {
  return Object.keys(keyframeMap).reduce<IdMap<IdMap<KeyframeBaseSameRange>>>(
    (p, id) => {
      p[id] = keyframeMap[id].reduce<IdMap<KeyframeBaseSameRange>>(
        (p, k, i) => {
          p[k.frame] = {
            name: k.name,
            props: getSamePropRangeFrameMap(keyframeMap[id], i),
          }
          return p
        },
        {}
      )
      return p
    },
    {}
  )
}

export function getSamePropRangeFrameMap(
  keyframes: KeyframeBase[],
  currentIndex: number
): KeyframeBaseSameRange['props'] {
  const keyframesFromCurrent = keyframes.slice(currentIndex)
  if (keyframesFromCurrent.length < 1) return {}

  const current = keyframesFromCurrent[0]
  const propMap = getKeyframePropsMap(keyframesFromCurrent, current.name)
  const ret: KeyframeBaseSameRange['props'] = {}

  Object.keys(current.points).forEach((key) => {
    ret[key] = getSamePropRangeFrame(propMap.props[key]!, (k) => k.points[key])
  })

  return ret
}

function getSamePropRangeFrame(
  keyframes: KeyframeBase[],
  getValue: (k: KeyframeBase) => KeyframePoint | undefined
): number {
  if (keyframes.length < 2) return 0

  const current = keyframes[0]
  const after = keyframes[1]
  const currentValue = getValue(current)
  const afterValue = getValue(after)
  if (
    currentValue &&
    afterValue &&
    isSameKeyframePoint(currentValue, afterValue)
  ) {
    return after.frame - current.frame
  } else {
    return 0
  }
}

export function isSameKeyframePoint(
  a: KeyframePoint,
  b: KeyframePoint
): boolean {
  return a.value === b.value
}

export function batchUpdatePoints(
  keyframeMap: IdMap<KeyframeBase>,
  selectedStateMap: IdMap<KeyframeSelectedState>,
  updateFn: (p: KeyframePoint) => KeyframePoint
): IdMap<KeyframeBase> {
  return mapReduce(keyframeMap, (keyframe, id) => {
    const selectedState = selectedStateMap[id]
    if (!selectedState) return keyframe
    return updatePoints(keyframe, selectedState, updateFn)
  })
}

export function updatePoints(
  keyframe: KeyframeBase,
  selectedState: KeyframeSelectedState,
  updateFn: (p: KeyframePoint) => KeyframePoint
): KeyframeBase {
  return {
    ...keyframe,
    points: mapReduce(keyframe.points, (p, key) => {
      return selectedState.props[key] ? updateFn(p) : p
    }),
  }
}
