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
  KeyframeBaseProps,
  KeyframeName,
  KeyframeSelectedState,
} from '/@/models/keyframe'
import * as keyframeBoneModule from '/@/utils/keyframes/keyframeBone'

interface KeyframeModule {
  getInterpolatedTransformMapByBoneId(
    sortedKeyframesMap: IdMap<KeyframeBase[]>,
    frame: number
  ): IdMap<Transform>
  interpolateKeyframe(sortedKeyframes: KeyframeBase[], frame: number): Transform
  getAllSelectedState(): KeyframeSelectedState
  getInversedSelectedState(k?: KeyframeSelectedState): KeyframeSelectedState
  inversedSelectedState(
    k: KeyframeSelectedState,
    target: KeyframeSelectedState
  ): KeyframeSelectedState
  isAllSelected(k?: KeyframeSelectedState): boolean
  isAnySelected(k?: KeyframeSelectedState): boolean
  isAllExistSelected(keyframe: KeyframeBase, k?: KeyframeSelectedState): boolean
  splitKeyframeBySelected(
    keyframe: KeyframeBase,
    state: KeyframeSelectedState
  ): { selected?: KeyframeBase; notSelected?: KeyframeBase }
  mergeKeyframes(src: KeyframeBase, override: KeyframeBase): KeyframeBase
  deleteKeyframeByProp(
    keyframe: KeyframeBase,
    selectedState?: KeyframeSelectedState
  ): KeyframeBase | undefined
  getKeyframePropsMap(keyframes: KeyframeBase[]): Required<KeyframeBaseProps>
  getKeyframeDefaultPropsMap<T>(val: () => T): Required<KeyframeBaseProps>
}

function getKeyframeModule(name: KeyframeName = 'bone'): KeyframeModule {
  switch (name) {
    case 'bone':
      return keyframeBoneModule
  }
}

export function getInterpolatedTransformMapByBoneId(
  sortedKeyframesMap: IdMap<KeyframeBase[]>,
  frame: number
): IdMap<Transform> {
  return getKeyframeModule().getInterpolatedTransformMapByBoneId(
    sortedKeyframesMap,
    frame
  )
}

export function interpolateKeyframe(
  sortedKeyframes: KeyframeBase[],
  frame: number
): Transform {
  return getKeyframeModule().interpolateKeyframe(sortedKeyframes, frame)
}

export function getAllSelectedState(): KeyframeSelectedState {
  return getKeyframeModule().getAllSelectedState()
}

export function getInversedSelectedState(
  k?: KeyframeSelectedState
): KeyframeSelectedState {
  return getKeyframeModule().getInversedSelectedState(k)
}

export function inversedSelectedState(
  k: KeyframeSelectedState,
  target: KeyframeSelectedState
): KeyframeSelectedState {
  return getKeyframeModule().inversedSelectedState(k, target)
}

export function isAllSelected(k?: KeyframeSelectedState): boolean {
  return getKeyframeModule().isAllSelected(k)
}

export function isAnySelected(k?: KeyframeSelectedState): boolean {
  return getKeyframeModule().isAnySelected(k)
}

export function isAllExistSelected(
  keyframe: KeyframeBase,
  k?: KeyframeSelectedState
): boolean {
  return getKeyframeModule().isAllExistSelected(keyframe, k)
}

export function splitKeyframeBySelected(
  keyframe: KeyframeBase,
  state: KeyframeSelectedState
): { selected?: KeyframeBase; notSelected?: KeyframeBase } {
  return getKeyframeModule().splitKeyframeBySelected(keyframe, state)
}

export function mergeKeyframes(
  src: KeyframeBase,
  override: KeyframeBase
): KeyframeBase {
  return getKeyframeModule().mergeKeyframes(src, override)
}

export function deleteKeyframeByProp(
  keyframe: KeyframeBase,
  selectedState?: KeyframeSelectedState
): KeyframeBase | undefined {
  return getKeyframeModule().deleteKeyframeByProp(keyframe, selectedState)
}

export function getKeyframePropsMap(
  keyframes: KeyframeBase[]
): Required<KeyframeBaseProps> {
  return getKeyframeModule().getKeyframePropsMap(keyframes)
}

export function getKeyframeDefaultPropsMap<T>(
  val: () => T
): Required<KeyframeBaseProps> {
  return getKeyframeModule().getKeyframeDefaultPropsMap(val)
}
