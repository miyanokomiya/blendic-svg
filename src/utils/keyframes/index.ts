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
  getKeyframePropsMap<T>(
    keyframes: KeyframeBase[]
  ): Required<KeyframeBaseProps<T>>
  getKeyframeDefaultPropsMap<T>(val: () => T): Required<KeyframeBaseProps<T>>
}

export function getKeyframeModule(name: KeyframeName = 'bone'): KeyframeModule {
  switch (name) {
    case 'bone':
      return keyframeBoneModule as any
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

export function getKeyframePropsMap<T>(
  keyframes: KeyframeBase[]
): Required<KeyframeBaseProps<T>> {
  return getKeyframeModule().getKeyframePropsMap(keyframes)
}

export function getKeyframeDefaultPropsMap<T>(
  val: () => T
): Required<KeyframeBaseProps<T>> {
  return getKeyframeModule().getKeyframeDefaultPropsMap(val)
}
