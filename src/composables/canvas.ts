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

import { ref, reactive, computed } from 'vue'
import { IVec2, multi, sub, add, getRectCenter, IRectangle } from 'okageo'
import * as helpers from '/@/utils/helpers'
import { scaleRate } from '../models'

export interface MoveInfo {
  origin: IVec2
  downAt: IVec2
}

export function useCanvas(
  options: {
    scaleMin?: number
    scaleMax?: number
    ignoreNegativeY?: boolean
    scaleAtFixY?: boolean
  } = {}
) {
  const viewSize = reactive({ width: 600, height: 100 })
  const editStartPoint = ref<IVec2>()
  const mousePoint = ref<IVec2>()
  const scale = ref(1)
  const viewOrigin = ref<IVec2>({ x: 0, y: 0 })
  const viewMovingInfo = ref<MoveInfo>()
  const dragInfo = ref<{}>()

  const viewCanvasRect = computed(() => ({
    x: viewOrigin.value.x,
    y: viewOrigin.value.y,
    width: viewSize.width * scale.value,
    height: viewSize.height * scale.value,
  }))

  const viewCenter = computed(() => getRectCenter({ x: 0, y: 0, ...viewSize }))
  const viewBox = computed(() => helpers.viewbox(viewCanvasRect.value))

  function viewToCanvas(v: IVec2): IVec2 {
    return add(viewOrigin.value, multi(v, scale.value))
  }

  function fixOrigin(origin: IVec2): IVec2 {
    // negative y space is not used
    if (options.ignoreNegativeY) {
      return {
        x: origin.x,
        y: Math.max(origin.y, 0),
      }
    } else {
      return origin
    }
  }

  return {
    viewSize,
    editStartPoint,
    mousePoint,
    scale,
    viewOrigin,
    dragInfo,
    viewMovingInfo,
    viewCenter,
    viewBox,
    viewToCanvas,
    wheel(e: WheelEvent, center = false) {
      const origin =
        !center && mousePoint.value ? mousePoint.value : viewCenter.value
      const beforeOrigin = viewToCanvas(origin)
      scale.value = Math.min(
        Math.max(
          scale.value * Math.pow(scaleRate, e.deltaY > 0 ? 1 : -1),
          options.scaleMin ?? 0
        ),
        options.scaleMax ?? 10
      )

      if (options.scaleAtFixY) {
        viewOrigin.value = add(
          viewOrigin.value,
          sub(beforeOrigin, { ...viewToCanvas(origin), y: beforeOrigin.y })
        )
      } else {
        viewOrigin.value = add(
          viewOrigin.value,
          sub(beforeOrigin, viewToCanvas(origin))
        )
      }
    },
    downLeft() {
      if (!mousePoint.value) return
      dragInfo.value = {}
    },
    upLeft() {
      dragInfo.value = undefined
    },
    downMiddle() {
      if (!mousePoint.value) return
      viewMovingInfo.value = {
        origin: { ...viewOrigin.value },
        downAt: { ...mousePoint.value },
      }
    },
    upMiddle() {
      viewMovingInfo.value = undefined
    },
    leave() {
      viewMovingInfo.value = undefined
    },
    viewMove() {
      if (!viewMovingInfo.value) return
      if (!mousePoint.value) return

      viewOrigin.value = fixOrigin(
        add(
          viewMovingInfo.value.origin,
          multi(sub(viewMovingInfo.value.downAt, mousePoint.value), scale.value)
        )
      )
    },
  }
}

export function centerizeView(
  targetViewSize: {
    width: number
    height: number
  },
  viewSize: {
    width: number
    height: number
  },
  margin = 0
): {
  viewOrigin: IVec2
  scale: number
} {
  const adjustedViewbox = {
    width: viewSize.width - margin,
    height: viewSize.height - margin,
  }
  const rateW = adjustedViewbox.width / targetViewSize.width
  const rateH = adjustedViewbox.height / targetViewSize.height

  if (rateW < rateH) {
    const scale = 1 / rateW
    const m = (-margin * scale) / 2
    return {
      viewOrigin: {
        x: m,
        y:
          m +
          ((targetViewSize.height / scale - adjustedViewbox.height) / 2) *
            scale,
      },
      scale,
    }
  } else {
    const scale = 1 / rateH
    const m = (-margin * scale) / 2
    return {
      viewOrigin: {
        x:
          m +
          ((targetViewSize.width / scale - adjustedViewbox.width) / 2) * scale,
        y: m,
      },
      scale,
    }
  }
}
