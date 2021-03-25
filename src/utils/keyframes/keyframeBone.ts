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
  KeyframeBone,
  KeyframeBoneProps,
  KeyframeBoneSameRange,
  KeyframePoint,
  KeyframeSelectedState,
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
  return k.translateX
}
function getTransformY(k: KeyframeBone): KeyframePoint | undefined {
  return k.translateY
}
function getRotate(k: KeyframeBone): KeyframePoint | undefined {
  return k.rotate
}
function getScaleX(k: KeyframeBone): KeyframePoint | undefined {
  return k.scaleX
}
function getScaleY(k: KeyframeBone): KeyframePoint | undefined {
  return k.scaleY
}

export function getAllSelectedState(): KeyframeSelectedState {
  return getKeyframeDefaultPropsMap(() => true)
}

export function getInversedSelectedState(
  k?: KeyframeSelectedState
): KeyframeSelectedState {
  if (!k) return getAllSelectedState()

  const ret: KeyframeSelectedState = {}
  if (!k.translateX) ret.translateX = true
  if (!k.translateY) ret.translateY = true
  if (!k.rotate) ret.rotate = true
  if (!k.scaleX) ret.scaleX = true
  if (!k.scaleY) ret.scaleY = true
  return ret
}

export function inversedSelectedState(
  k: KeyframeSelectedState,
  target: KeyframeSelectedState
): KeyframeSelectedState {
  const ret: KeyframeSelectedState = {}
  if (
    (target.translateX && !k.translateX) ||
    (!target.translateX && k.translateX)
  ) {
    ret.translateX = true
  }
  if (
    (target.translateY && !k.translateY) ||
    (!target.translateY && k.translateY)
  ) {
    ret.translateY = true
  }
  if ((target.rotate && !k.rotate) || (!target.rotate && k.rotate)) {
    ret.rotate = true
  }
  if ((target.scaleX && !k.scaleX) || (!target.scaleX && k.scaleX)) {
    ret.scaleX = true
  }
  if ((target.scaleY && !k.scaleY) || (!target.scaleY && k.scaleY)) {
    ret.scaleY = true
  }
  return ret
}

export function isAllSelected(k?: KeyframeSelectedState): boolean {
  if (!k) return false
  if (!k.translateX) return false
  if (!k.translateY) return false
  if (!k.rotate) return false
  if (!k.scaleX) return false
  if (!k.scaleY) return false
  return true
}

export function isAnySelected(k?: KeyframeSelectedState): boolean {
  if (!k) return false
  if (k.translateX) return true
  if (k.translateY) return true
  if (k.rotate) return true
  if (k.scaleX) return true
  if (k.scaleY) return true
  return false
}

export function isAllExistSelected(
  keyframe: KeyframeBone,
  k?: KeyframeSelectedState
): boolean {
  if (!k) return false
  if (!k.translateX && keyframe.translateX) return false
  if (!k.translateY && keyframe.translateY) return false
  if (!k.rotate && keyframe.rotate) return false
  if (!k.scaleX && keyframe.scaleX) return false
  if (!k.scaleY && keyframe.scaleY) return false
  return true
}

export function splitKeyframeBySelected(
  keyframe: KeyframeBone,
  state: KeyframeSelectedState
): { selected?: KeyframeBone; notSelected?: KeyframeBone } {
  if (isAllExistSelected(keyframe, state)) {
    return { selected: keyframe }
  }
  if (!isAnySelected(state)) {
    return { notSelected: keyframe }
  }

  const selected = { ...keyframe }
  const notSelected = { ...keyframe }

  if (state.translateX) {
    delete notSelected.translateX
  } else {
    delete selected.translateX
  }
  if (state.translateY) {
    delete notSelected.translateY
  } else {
    delete selected.translateY
  }
  if (state.rotate) {
    delete notSelected.rotate
  } else {
    delete selected.rotate
  }
  if (state.scaleX) {
    delete notSelected.scaleX
  } else {
    delete selected.scaleX
  }
  if (state.scaleY) {
    delete notSelected.scaleY
  } else {
    delete selected.scaleY
  }
  return {
    selected,
    notSelected,
  }
}

export function mergeKeyframes(
  src: KeyframeBone,
  override: KeyframeBone
): KeyframeBone {
  const ret = { ...override }
  if (src.translateX && !override.translateX) ret.translateX = src.translateX
  if (src.translateY && !override.translateY) ret.translateY = src.translateY
  if (src.rotate && !override.rotate) ret.rotate = src.rotate
  if (src.scaleX && !override.scaleX) ret.scaleX = src.scaleX
  if (src.scaleY && !override.scaleY) ret.scaleY = src.scaleY
  return ret
}

export function deleteKeyframeByProp(
  keyframe: KeyframeBone,
  selectedState?: KeyframeSelectedState
): KeyframeBone | undefined {
  if (!selectedState) return keyframe
  if (isAllExistSelected(keyframe, selectedState)) return

  const ret = { ...keyframe }
  if (selectedState.translateX) delete ret.translateX
  if (selectedState.translateY) delete ret.translateY
  if (selectedState.rotate) delete ret.rotate
  if (selectedState.scaleX) delete ret.scaleX
  if (selectedState.scaleY) delete ret.scaleY
  return ret
}

export function getKeyframePropsMap(
  keyframes: KeyframeBone[]
): Required<KeyframeBoneProps<KeyframeBone[]>> {
  const ret = getKeyframeDefaultPropsMap<KeyframeBone[]>(() => [])

  keyframes.forEach((k) => {
    if (k.translateX) ret.translateX.push(k)
    if (k.translateY) ret.translateY.push(k)
    if (k.rotate) ret.rotate.push(k)
    if (k.scaleX) ret.scaleX.push(k)
    if (k.scaleY) ret.scaleY.push(k)
  })

  return ret
}

export function getKeyframeDefaultPropsMap<T>(
  val: () => T
): Required<KeyframeBoneProps<T>> {
  return {
    translateX: val(),
    translateY: val(),
    rotate: val(),
    scaleX: val(),
    scaleY: val(),
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
): IdMap<IdMap<KeyframeBoneSameRange>> {
  return Object.keys(keyframeMapByBoneId).reduce<
    IdMap<IdMap<KeyframeBoneSameRange>>
  >((p, boneId) => {
    p[boneId] = keyframeMapByBoneId[boneId].reduce<
      IdMap<KeyframeBoneSameRange>
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
): KeyframeBoneSameRange {
  const keyframesFromCurrent = keyframes.slice(currentIndex)
  const current = keyframesFromCurrent[0]
  if (keyframesFromCurrent.length < 2)
    return { ...getKeyframeDefaultPropsMap(() => 0), all: 0 }

  const propMap = getKeyframePropsMap(keyframesFromCurrent)
  const translateX = current.translateX
    ? getSamePropRangeFrame(propMap.translateX, (k) => k.translateX)
    : 0
  const translateY = current.translateY
    ? getSamePropRangeFrame(propMap.translateY, (k) => k.translateY)
    : 0
  const rotate = current.rotate
    ? getSamePropRangeFrame(propMap.rotate, (k) => k.rotate)
    : 0
  const scaleX = current.scaleX
    ? getSamePropRangeFrame(propMap.scaleX, (k) => k.scaleX)
    : 0
  const scaleY = current.scaleY
    ? getSamePropRangeFrame(propMap.scaleY, (k) => k.scaleY)
    : 0

  return {
    all: [translateY, rotate, scaleX, scaleY].reduce(
      (p, c) => Math.min(p, c),
      translateX
    ),
    translateX,
    translateY,
    rotate,
    scaleX,
    scaleY,
  }
}

function getSamePropRangeFrame(
  keyframes: KeyframeBone[],
  getValue: (k: KeyframeBone) => KeyframePoint | undefined
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
