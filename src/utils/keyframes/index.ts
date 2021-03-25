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
  KeyframeSelectedState,
} from '/@/models/keyframe'
import { mapReduce } from '/@/utils/commons'
import * as keyframeBoneModule from '/@/utils/keyframes/keyframeBone'

export function getInterpolatedTransformMapByBoneId(
  sortedKeyframesMap: IdMap<KeyframeBone[]>,
  frame: number
): IdMap<Transform> {
  return mapReduce(sortedKeyframesMap, (keyframes) =>
    interpolateKeyframeBone(keyframes, frame)
  )
}

export function interpolateKeyframeBone(
  sortedKeyframes: KeyframeBone[],
  frame: number
): Transform {
  return keyframeBoneModule.interpolateKeyframeBone(sortedKeyframes, frame)
}

export function getAllSelectedState(): KeyframeSelectedState {
  return keyframeBoneModule.getAllSelectedState()
}

export function getInversedSelectedState(
  k?: KeyframeSelectedState
): KeyframeSelectedState {
  return keyframeBoneModule.getInversedSelectedState(k)
}

export function inversedSelectedState(
  k: KeyframeSelectedState,
  target: KeyframeSelectedState
): KeyframeSelectedState {
  return keyframeBoneModule.inversedSelectedState(k, target)
}

export function isAllSelected(k?: KeyframeSelectedState): boolean {
  return keyframeBoneModule.isAllSelected(k)
}

export function isAnySelected(k?: KeyframeSelectedState): boolean {
  return keyframeBoneModule.isAnySelected(k)
}

export function isAllExistSelected(
  keyframe: KeyframeBone,
  k?: KeyframeSelectedState
): boolean {
  return keyframeBoneModule.isAllExistSelected(keyframe, k)
}

export function splitKeyframeBoneBySelected(
  keyframe: KeyframeBone,
  state: KeyframeSelectedState
): { selected?: KeyframeBone; notSelected?: KeyframeBone } {
  return keyframeBoneModule.splitKeyframeBoneBySelected(keyframe, state)
}

export function mergeKeyframeBones(
  src: KeyframeBone,
  override: KeyframeBone
): KeyframeBone {
  return keyframeBoneModule.mergeKeyframeBones(src, override)
}

export function deleteKeyframeBoneByProp(
  keyframe: KeyframeBone,
  selectedState?: KeyframeSelectedState
): KeyframeBone | undefined {
  return keyframeBoneModule.deleteKeyframeBoneByProp(keyframe, selectedState)
}

export function getKeyframeBonePropsMap(
  keyframes: KeyframeBone[]
): Required<KeyframeBoneProps<KeyframeBone[]>> {
  return keyframeBoneModule.getKeyframeBonePropsMap(keyframes)
}

export function getKeyframeBoneDefaultPropsMap<T>(
  val: () => T
): Required<KeyframeBoneProps<T>> {
  return keyframeBoneModule.getKeyframeBoneDefaultPropsMap(val)
}
