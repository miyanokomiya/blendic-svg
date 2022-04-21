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

import { ref, computed, Ref, provide, inject } from 'vue'
import { IVec2, multi, sub, add, getRectCenter, IRectangle } from 'okageo'
import * as helpers from '/@/utils/helpers'
import { scaleRate } from '../models'
import { getNormalRectangle } from '/@/utils/geometry'
import { Size } from 'okanvas'
import { EditMovement } from '/@/composables/modes/types'

export interface MoveInfo {
  origin: IVec2
  downAt: IVec2
}

export type Dragtype = '' | 'rect-select'

export function useCanvas(
  options: {
    scaleMin?: number
    scaleMax?: number
    ignoreNegativeY?: boolean
    scaleAtFixY?: boolean
    scale?: Ref<number>
    viewOrigin?: Ref<IVec2>
    viewSize?: Ref<Size>
  } = {}
) {
  const scale = options.scale ?? ref(1)
  const viewOrigin = options.viewOrigin ?? ref<IVec2>({ x: 0, y: 0 })

  const viewSize = options.viewSize ?? ref<Size>({ width: 600, height: 100 })
  function setViewSize(val: Size) {
    viewSize.value = val
  }

  const viewMovingInfo = ref<MoveInfo>()
  const dragInfo = ref<{ dragType: Dragtype; downAt: IVec2 }>()

  const editStartPoint = ref<IVec2>()
  function setEditStartPoint(val?: IVec2) {
    editStartPoint.value = val
  }

  const mousePoint = ref<IVec2>({ x: 0, y: 0 })
  function setMousePoint(val: IVec2) {
    mousePoint.value = val
  }

  const viewDragRectangle = computed<IRectangle | undefined>(() => {
    if (
      !mousePoint.value ||
      !dragInfo.value ||
      dragInfo.value.dragType !== 'rect-select'
    )
      return
    const diff = sub(mousePoint.value, dragInfo.value.downAt)
    return getNormalRectangle({
      ...dragInfo.value.downAt,
      width: diff.x,
      height: diff.y,
    })
  })
  const dragRectangle = computed<IRectangle | undefined>(() => {
    if (!viewDragRectangle.value) return
    return {
      ...viewToCanvas(viewDragRectangle.value),
      width: viewDragRectangle.value.width * scale.value,
      height: viewDragRectangle.value.height * scale.value,
    }
  })
  const isValidDragRectangle = computed(() => {
    return (
      dragRectangle.value &&
      (Math.abs(dragRectangle.value.width) > 0 ||
        Math.abs(dragRectangle.value.height) > 0)
    )
  })

  const viewCanvasRect = computed(() => ({
    x: viewOrigin.value.x,
    y: viewOrigin.value.y,
    width: viewSize.value.width * scale.value,
    height: viewSize.value.height * scale.value,
  }))

  const viewCenter = computed(() =>
    getRectCenter({ x: 0, y: 0, ...viewSize.value })
  )
  const viewBox = computed(() => helpers.viewbox(viewCanvasRect.value))

  function viewToCanvas(v: IVec2): IVec2 {
    return add(viewOrigin.value, multi(v, scale.value))
  }

  function canvasToView(v: IVec2): IVec2 {
    return multi(sub(v, viewOrigin.value), 1 / scale.value)
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
    setViewSize,
    editStartPoint,
    setEditStartPoint,
    mousePoint,
    setMousePoint,
    scale,
    viewOrigin,

    dragRectangle,
    isValidDragRectangle,
    dragInfo,

    viewMovingInfo,
    viewCenter,
    viewBox,
    viewCanvasRect,
    viewToCanvas,
    canvasToView,
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
    downLeft(dragType: Dragtype = '') {
      if (!mousePoint.value) return
      dragInfo.value = { dragType, downAt: mousePoint.value }
    },
    upLeft() {
      dragInfo.value = undefined
    },
    downMiddle() {
      if (!mousePoint.value) return
      setEditStartPoint()
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
    adjustToCenter() {
      const size = viewSize.value
      const ret = centerizeView(size, size)
      viewOrigin.value = sub(
        ret.viewOrigin,
        multi({ x: size.width, y: size.height }, 1 / 2)
      )
      scale.value = ret.scale
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

export function provideScale(getScale: () => number) {
  provide('getScale', getScale)
}

export function injectScale(): () => number {
  return inject<() => number>('getScale', () => 1)
}

export function useGetBBox() {
  const scale = computed(injectScale())

  return (dom: SVGGraphicsElement) => {
    // getBBox does not exist in some environments e.g. jsdom
    if (dom.getBBox) return dom.getBBox()

    const size = dom.getBoundingClientRect()
    return {
      width: size.width * scale.value,
      height: size.height * scale.value,
    }
  }
}

export function useSvgCanvas(
  options: {
    scaleMin?: number
    scaleMax?: number
    ignoreNegativeY?: boolean
    scaleAtFixY?: boolean
    scale?: Ref<number>
    viewOrigin?: Ref<IVec2>
    viewSize?: Ref<Size>
  } = {}
) {
  const scale = options.scale ?? ref(1)
  const viewOrigin = options.viewOrigin ?? ref<IVec2>({ x: 0, y: 0 })

  const viewSize = options.viewSize ?? ref<Size>({ width: 600, height: 100 })
  function setViewSize(val: Size) {
    viewSize.value = val
  }

  const moveType = ref<'move' | 'drag'>()
  const dragged = computed(() => moveType.value === 'drag')

  const editStartPoint = ref<IVec2>()
  const editStartViewOrigin = ref<IVec2>()
  function endMoving() {
    moveType.value = undefined
  }
  function startMoving() {
    moveType.value = 'move'
    editStartPoint.value = mousePoint.value
    editStartViewOrigin.value = viewOrigin.value
  }
  function startDragging() {
    moveType.value = 'drag'
    editStartPoint.value = mousePoint.value
    editStartViewOrigin.value = viewOrigin.value
  }

  const mousePoint = ref<IVec2>({ x: 0, y: 0 })
  function setMousePoint(val: IVec2) {
    mousePoint.value = val
  }

  const viewCanvasRect = computed(() => ({
    x: viewOrigin.value.x,
    y: viewOrigin.value.y,
    width: viewSize.value.width * scale.value,
    height: viewSize.value.height * scale.value,
  }))

  const viewCenter = computed(() =>
    getRectCenter({ x: 0, y: 0, ...viewSize.value })
  )
  const viewBox = computed(() => helpers.viewbox(viewCanvasRect.value))

  const rectangleDragged = ref(false)
  function setRectangleDragging(val = false) {
    rectangleDragged.value = val
  }

  const viewDraggedRectangle = computed<IRectangle | undefined>(() => {
    if (!rectangleDragged.value || !mousePoint.value || !editStartPoint.value)
      return

    const diff = sub(mousePoint.value, editStartPoint.value)
    return getNormalRectangle({
      ...editStartPoint.value,
      width: diff.x,
      height: diff.y,
    })
  })
  const draggedRectangle = computed<IRectangle | undefined>(() => {
    if (!viewDraggedRectangle.value) return
    return {
      ...viewToCanvas(viewDraggedRectangle.value),
      width: viewDraggedRectangle.value.width * scale.value,
      height: viewDraggedRectangle.value.height * scale.value,
    }
  })

  function viewToCanvas(v: IVec2): IVec2 {
    return add(viewOrigin.value, multi(v, scale.value))
  }

  function canvasToView(v: IVec2): IVec2 {
    return multi(sub(v, viewOrigin.value), 1 / scale.value)
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
    setViewSize,
    editStartPoint,
    mousePoint,
    setMousePoint,
    scale,
    viewOrigin,

    dragged,
    endMoving,
    startMoving,
    startDragging,

    viewCenter,
    viewBox,
    viewCanvasRect,
    viewToCanvas,
    canvasToView,
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
    viewMove(editMovement: EditMovement) {
      if (!editStartViewOrigin.value) return
      viewOrigin.value = fixOrigin(
        add(
          editStartViewOrigin.value,
          sub(editMovement.start, editMovement.current)
        )
      )
    },
    adjustToCenter() {
      const size = viewSize.value
      const ret = centerizeView(size, size)
      viewOrigin.value = sub(
        ret.viewOrigin,
        multi({ x: size.width, y: size.height }, 1 / 2)
      )
      scale.value = ret.scale
    },

    setRectangleDragging,
    draggedRectangle,
  }
}
