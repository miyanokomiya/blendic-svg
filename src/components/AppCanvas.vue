<template>
  <div>
    <svg
      ref="svg"
      tabindex="-1"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
      font-family="sans-serif"
      :viewBox="viewBox"
      :width="viewSize.width"
      :height="viewSize.height"
      @wheel.prevent="wheel"
      @mouseenter="focus"
      @mousemove="mousemove"
      @click.left="clickAny"
      @mousedown.middle.prevent="downMiddle"
      @mouseup.middle.prevent="upMiddle"
      @mouseleave="leave"
      @keydown.tab.exact.prevent="keyDownTab"
      @keydown.g.exact.prevent="editKeyDown('g')"
      @keydown.e.exact.prevent="editKeyDown('e')"
      @keydown.x.exact.prevent="editKeyDown('x')"
      @keydown.a.shift.exact.prevent="editKeyDown('shift-a')"
    >
      <rect
        :x="originalViewBox.x"
        :y="originalViewBox.y"
        :width="originalViewBox.width"
        :height="originalViewBox.height"
        fill="none"
        stroke="black"
        stroke-width="1"
        stroke-dasharray="4 4"
      ></rect>
      <slot />
    </svg>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, reactive, computed } from 'vue'
import { getPointInTarget } from 'okanvas'
import { IVec2, IRectangle, multi, sub, add, getRectCenter } from 'okageo'

export default defineComponent({
  props: {
    originalViewBox: {
      type: Object as PropType<IRectangle>,
      default: () => ({ x: 0, y: 0, width: 600, height: 400 }),
    },
  },
  emits: [
    'mousemove',
    'click-any',
    'click-empty',
    'tab',
    'g',
    'e',
    'x',
    'shift-a',
  ],
  setup(_props, { emit }) {
    const viewSize = reactive({ width: 600, height: 400 })
    const svg = ref<SVGElement>()
    const editStartPoint = ref<IVec2>()
    const mousePoint = ref<IVec2>()
    const scale = ref(1)
    const viewOrigin = ref<IVec2>({ x: 0, y: 0 })
    const viewBox = computed(
      () =>
        `${viewOrigin.value.x} ${viewOrigin.value.y} ${
          viewSize.width * scale.value
        } ${viewSize.height * scale.value}`
    )
    const viewCenter = computed(() =>
      getRectCenter({ x: 0, y: 0, ...viewSize })
    )
    const viewMovingInfo = ref<{ origin: IVec2; downAt: IVec2 }>()

    function viewToCanvas(v: IVec2): IVec2 {
      return multi(v, scale.value)
    }

    return {
      viewSize,
      svg,
      viewBox,
      focus() {
        if (svg.value) svg.value.focus()
      },
      wheel(e: WheelEvent) {
        const origin = mousePoint.value ? mousePoint.value : viewCenter.value
        const beforeOrigin = viewToCanvas(origin)
        scale.value = scale.value * Math.pow(1.1, e.deltaY > 0 ? 1 : -1)
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
      mousemove: (e: MouseEvent) => {
        mousePoint.value = getPointInTarget(e)
        if (viewMovingInfo.value) {
          viewOrigin.value = add(
            viewMovingInfo.value.origin,
            viewToCanvas(sub(viewMovingInfo.value.downAt, mousePoint.value))
          )
        } else {
          if (!editStartPoint.value) return
          emit('mousemove', {
            current: viewToCanvas(mousePoint.value),
            start: viewToCanvas(editStartPoint.value),
          })
        }
      },
      clickAny(e: any) {
        if (e.target === svg.value) {
          editStartPoint.value = undefined
          emit('click-empty')
        } else {
          emit('click-any')
        }
      },
      keyDownTab: () => {
        emit('tab')
      },
      editKeyDown(key: 'g' | 'e' | 'x' | 'shift-a') {
        if (!mousePoint.value) return
        editStartPoint.value = mousePoint.value
        emit(key)
      },
    }
  },
})
</script>

<style lang="scss" scoped>
svg {
  border: solid 1px black;
}
</style>
