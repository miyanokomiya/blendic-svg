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

Copyright (C) 2022, Tomoya Komiyama.
*/

import { AnimationCanvasStateContext } from '/@/composables/modeStates/animationCanvas/core'
import { IdMap } from '/@/models'
import { KeyframeBase } from '/@/models/keyframe'
import { getKeyframe } from '/@/utils/keyframes'

export function duplicateKeyframes(
  ctx: Pick<
    AnimationCanvasStateContext,
    'getKeyframes' | 'getSelectedKeyframes' | 'generateUuid' | 'setTmpKeyframes'
  >
) {
  const keyframes = ctx.getKeyframes()
  const duplicated = Object.keys(ctx.getSelectedKeyframes()).reduce<
    IdMap<KeyframeBase>
  >((p, srcId) => {
    const src = keyframes[srcId]
    if (src) {
      const id = ctx.generateUuid()
      p[id] = getKeyframe({ ...src, id })
    }
    return p
  }, {})

  ctx.setTmpKeyframes(duplicated)
}
