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

import { IdMap, Transform } from '/@/models'
import {
  KeyframeBase,
  KeyframeBone,
  KeyframeBaseSameRange,
  KeyframePoint,
  KeyframeSelectedState,
  KeyframeBoneProps,
  KeyframeBonePropKey,
} from '/@/models/keyframe'
import { mapReduce } from '/@/utils/commons'
import {
  getNeighborKeyframes,
  interpolateKeyframePoint,
} from '/@/utils/keyframes/core'

export function getInterpolatedTransformMapByBoneId(
  sortedKeyframesMap: IdMap<KeyframeBone[]>,
  frame: number
): IdMap<Transform> {
  return mapReduce(sortedKeyframesMap, (keyframes) =>
    interpolateKeyframe(keyframes, frame)
  )
}

export function interpolateKeyframe(
  sortedKeyframes: KeyframeBone[],
  frame: number
): Transform {
  const translateX =
    interpolateKeyframeProp(sortedKeyframes, frame, getTransformX) ?? 0
  const translateY =
    interpolateKeyframeProp(sortedKeyframes, frame, getTransformY) ?? 0
  const rotate = interpolateKeyframeProp(sortedKeyframes, frame, getRotate) ?? 0
  const scaleX = interpolateKeyframeProp(sortedKeyframes, frame, getScaleX) ?? 1
  const scaleY = interpolateKeyframeProp(sortedKeyframes, frame, getScaleY) ?? 1

  return {
    translate: { x: translateX, y: translateY },
    rotate,
    scale: { x: scaleX, y: scaleY },
    origin: { x: 0, y: 0 },
  }
}

function interpolateKeyframeProp(
  keyframes: KeyframeBone[],
  frame: number,
  getPropFn: (k: KeyframeBone) => KeyframePoint | undefined
): number | undefined {
  const filtered = keyframes.filter((k) => getPropFn(k))
  const neighbors = getNeighborKeyframes(filtered, frame)

  if (neighbors.length === 0) {
    return
  } else if (neighbors.length === 1) {
    return getPropFn(neighbors[0])!.value
  } else {
    return interpolateKeyframePoint(
      {
        frame: neighbors[0].frame,
        keyframePoint: getPropFn(neighbors[0])!,
      },
      {
        frame: neighbors[1].frame,
        keyframePoint: getPropFn(neighbors[1])!,
      },
      frame
    )
  }
}

function getTransformX(k: KeyframeBone): KeyframePoint | undefined {
  return k.points.translateX
}
function getTransformY(k: KeyframeBone): KeyframePoint | undefined {
  return k.points.translateY
}
function getRotate(k: KeyframeBone): KeyframePoint | undefined {
  return k.points.rotate
}
function getScaleX(k: KeyframeBone): KeyframePoint | undefined {
  return k.points.scaleX
}
function getScaleY(k: KeyframeBone): KeyframePoint | undefined {
  return k.points.scaleY
}

export function getAllSelectedState(): KeyframeSelectedState {
  return getKeyframeDefaultPropsMap(() => true)
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
  keyframes: KeyframeBone[]
): Required<KeyframeBoneProps<KeyframeBone[]>> {
  const ret = getKeyframeDefaultPropsMap<KeyframeBone[]>(() => [])

  keyframes.forEach((k) => {
    Object.keys(k.points).forEach((key) => {
      if (k.points[key as KeyframeBonePropKey]) {
        ret.props[key as KeyframeBonePropKey]?.push(k)
      }
    })
  })

  return ret
}

export function getKeyframeDefaultPropsMap<T>(
  val: () => T
): Required<KeyframeBoneProps<T>> {
  return {
    name: 'bone',
    props: {
      translateX: val(),
      translateY: val(),
      rotate: val(),
      scaleX: val(),
      scaleY: val(),
    },
  }
}

export function isSameKeyframePoint(
  a: KeyframePoint,
  b: KeyframePoint
): boolean {
  return a.value === b.value
}

export function getSamePropRangeFrameMapByBoneId(
  keyframeMapByBoneId: IdMap<KeyframeBone[]>
): IdMap<IdMap<KeyframeBaseSameRange>> {
  return Object.keys(keyframeMapByBoneId).reduce<
    IdMap<IdMap<KeyframeBaseSameRange>>
  >((p, boneId) => {
    p[boneId] = keyframeMapByBoneId[boneId].reduce<
      IdMap<KeyframeBaseSameRange>
    >((p, k, i) => {
      p[k.frame] = getSamePropRangeFrameMap(keyframeMapByBoneId[boneId], i)
      return p
    }, {})
    return p
  }, {})
}

export function getSamePropRangeFrameMap(
  keyframes: KeyframeBone[],
  currentIndex: number
): KeyframeBaseSameRange {
  const keyframesFromCurrent = keyframes.slice(currentIndex)
  if (keyframesFromCurrent.length < 1) return { name: 'bone', props: {} }

  const current = keyframesFromCurrent[0]
  const propMap = getKeyframePropsMap(keyframesFromCurrent)
  const ret: KeyframeBaseSameRange = {
    name: 'bone',
    props: {},
  }

  Object.keys(current.points).forEach((key) => {
    ret.props[key] = getSamePropRangeFrame(
      propMap.props[key as KeyframeBonePropKey]!,
      (k) => k.points[key]
    )
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
