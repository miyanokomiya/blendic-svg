import { defineComponent, ref, reactive, computed, onMounted, watch } from 'vue'
import { IVec2, multi, sub, add, getRectCenter } from 'okageo'
import * as helpers from '/@/utils/helpers'

export function useCanvas(
  options: { scaleMin?: number; scaleMax?: number } = {}
) {
  const viewSize = reactive({ width: 600, height: 100 })
  const editStartPoint = ref<IVec2>()
  const mousePoint = ref<IVec2>()
  const scale = ref(1)
  const viewOrigin = ref<IVec2>({ x: 0, y: 0 })
  const viewMovingInfo = ref<{ origin: IVec2; downAt: IVec2 }>()

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

  return {
    viewSize,
    editStartPoint,
    mousePoint,
    scale,
    viewOrigin,
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
          scale.value * Math.pow(1.1, e.deltaY > 0 ? 1 : -1),
          options.scaleMin ?? 0
        ),
        options.scaleMax ?? 10
      )
      const afterOrigin = viewToCanvas(origin)
      viewOrigin.value = add(viewOrigin.value, sub(beforeOrigin, afterOrigin))
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

      viewOrigin.value = add(
        viewMovingInfo.value.origin,
        multi(sub(viewMovingInfo.value.downAt, mousePoint.value), scale.value)
      )
    },
  }
}
