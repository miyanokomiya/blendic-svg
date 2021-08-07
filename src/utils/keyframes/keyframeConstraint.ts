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
  KeyframePoint,
  KeyframeBaseProps,
  getKeyframePoint,
  KeyframeConstraintPropKey,
  KeyframeConstraint,
  getKeyframeConstraint,
} from '/@/models/keyframe'
import { mapReduce } from '/@/utils/commons'
import { interpolateKeyframeProp } from '/@/utils/keyframes/core'
import { BoneConstraint } from '/@/utils/constraints/index'
import { clamp } from 'okageo'

export function getInterpolatedConstraintMap(
  constraintMap: IdMap<BoneConstraint>,
  sortedKeyframesMap: IdMap<KeyframeConstraint[]>,
  frame: number
): IdMap<BoneConstraint> {
  const interpolatedOptionMap = getInterpolatedOptionMapByTargetId(
    sortedKeyframesMap,
    frame
  )

  return mapReduce(constraintMap, (c) => {
    if (!interpolatedOptionMap[c.id]) return c
    return { ...c, option: { ...c.option, ...interpolatedOptionMap[c.id] } }
  })
}

export function getInterpolatedOptionMapByTargetId(
  sortedKeyframesMap: IdMap<KeyframeConstraint[]>,
  frame: number
): IdMap<{ influence: number }> {
  return mapReduce(sortedKeyframesMap, (keyframes) =>
    interpolateKeyframe(keyframes, frame)
  )
}

export function interpolateKeyframe(
  sortedKeyframes: KeyframeConstraint[],
  frame: number
): { influence: number } {
  const influence = clamp(
    0,
    1,
    interpolateKeyframeProp(sortedKeyframes, frame, getInfluence) ?? 1
  )

  return {
    influence,
  }
}

function getInfluence(k: KeyframeBase): KeyframePoint | undefined {
  return k.points.influence
}

export function getKeyframeDefaultPropsMap<T>(
  val: () => T
): Required<KeyframeBaseProps<T>> {
  return {
    props: {
      influence: val(),
    },
  }
}

export function makeKeyframe(
  frame: number,
  targetId: string,
  target: BoneConstraint,
  keys: Partial<
    {
      [key in KeyframeConstraintPropKey]: boolean
    }
  > = {},
  generateId = false
): KeyframeConstraint {
  return getKeyframeConstraint(
    {
      frame,
      targetId,
      points: {
        ...(keys.influence
          ? {
              influence: getKeyframePoint({
                value: target.option.influence,
              }),
            }
          : {}),
      },
    },
    generateId
  )
}
