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
  KeyframePoint,
  KeyframeBaseProps,
  getKeyframeBone,
  getKeyframePoint,
} from '/@/models/keyframe'
import { mapReduce } from '/@/utils/commons'
import { interpolateKeyframeProp } from '/@/utils/keyframes/core'

export function getInterpolatedTransformMapByTargetId(
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

function getTransformX(k: KeyframeBase): KeyframePoint | undefined {
  return k.points.translateX
}
function getTransformY(k: KeyframeBase): KeyframePoint | undefined {
  return k.points.translateY
}
function getRotate(k: KeyframeBase): KeyframePoint | undefined {
  return k.points.rotate
}
function getScaleX(k: KeyframeBase): KeyframePoint | undefined {
  return k.points.scaleX
}
function getScaleY(k: KeyframeBase): KeyframePoint | undefined {
  return k.points.scaleY
}

export function getKeyframeDefaultPropsMap<T>(
  val: () => T
): Required<KeyframeBaseProps<T>> {
  return {
    props: {
      translateX: val(),
      translateY: val(),
      rotate: val(),
      scaleX: val(),
      scaleY: val(),
    },
  }
}

export function makeKeyframe(
  frame: number,
  targetId: string,
  targetTransform: Transform,
  options: {
    useTranslate?: boolean
    useRotate?: boolean
    useScale?: boolean
  } = {},
  generateId = false
): KeyframeBone {
  return getKeyframeBone(
    {
      frame,
      targetId,
      points: {
        ...(options.useTranslate
          ? {
              translateX: getKeyframePoint({
                value: targetTransform.translate.x,
              }),
              translateY: getKeyframePoint({
                value: targetTransform.translate.y,
              }),
            }
          : {}),
        ...(options.useRotate
          ? {
              rotate: getKeyframePoint({ value: targetTransform.rotate }),
            }
          : {}),
        ...(options.useScale
          ? {
              scaleX: getKeyframePoint({ value: targetTransform.scale.x }),
              scaleY: getKeyframePoint({ value: targetTransform.scale.y }),
            }
          : {}),
      },
    },
    generateId
  )
}
