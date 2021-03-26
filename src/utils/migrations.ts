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

import { Transform } from '/@/models'
import {
  getKeyframeBone,
  getKeyframePoint,
  KeyframeBone,
  KeyframePoint,
} from '/@/models/keyframe'

interface OldKeyframe {
  id: string
  frame: number
  transform: Transform
  boneId: string
}

interface OldKeyframe2 {
  id: string
  frame: number
  boneId: string
  translateX?: KeyframePoint
  translateY?: KeyframePoint
  rotate?: KeyframePoint
  scaleX?: KeyframePoint
  scaleY?: KeyframePoint
}

function isOldKeyframe(
  k: OldKeyframe | OldKeyframe2 | KeyframeBone
): k is OldKeyframe {
  return !!(k as any).transform
}

function isOldKeyframe2(k: OldKeyframe2 | KeyframeBone): k is OldKeyframe2 {
  return !(k as any).points
}

function toTransformMap(
  t: Transform
): {
  translateX: KeyframePoint
  translateY: KeyframePoint
  rotate: KeyframePoint
  scaleX: KeyframePoint
  scaleY: KeyframePoint
} {
  return {
    translateX: getKeyframePoint({ value: t.translate.x }),
    translateY: getKeyframePoint({ value: t.translate.y }),
    rotate: getKeyframePoint({ value: t.rotate }),
    scaleX: getKeyframePoint({ value: t.scale.x }),
    scaleY: getKeyframePoint({ value: t.scale.y }),
  }
}

// 0.0.0 -> 0.1.0 -> 0.2.0
export function migrateKeyframe(
  k: OldKeyframe | OldKeyframe2 | KeyframeBone
): KeyframeBone {
  if (isOldKeyframe(k)) {
    return migrateKeyframe1(k)
  }
  if (isOldKeyframe2(k)) {
    return migrateKeyframe2(k)
  }
  return k
}

// 0.0.0 -> 0.2.0
function migrateKeyframe1(k: OldKeyframe): KeyframeBone {
  return getKeyframeBone({
    id: k.id,
    frame: k.frame,
    boneId: k.boneId,
    points: {
      ...toTransformMap(k.transform),
    },
  })
}

// 0.1.0 -> 0.2.0
function migrateKeyframe2(k: OldKeyframe2): KeyframeBone {
  const { id, frame, boneId, ...points } = k
  const ret = getKeyframeBone()
  ret.id = id ?? ret.id
  ret.frame = frame ?? ret.frame
  ret.boneId = boneId ?? ret.boneId
  ret.points = points ?? ret.points
  return ret
}
