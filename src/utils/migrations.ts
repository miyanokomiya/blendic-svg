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

function isOldKeyframe(k: OldKeyframe | KeyframeBone): k is OldKeyframe {
  return !!(k as any).transform
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

// 0.0.0 -> 0.1.0
export function migrateKeyframe(k: OldKeyframe | KeyframeBone): KeyframeBone {
  if (!isOldKeyframe(k)) return getKeyframeBone(k)

  return getKeyframeBone({
    id: k.id,
    frame: k.frame,
    boneId: k.boneId,
    ...toTransformMap(k.transform),
  })
}
