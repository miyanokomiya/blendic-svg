<template>
  <div ref="wrapper" class="timeline-canvas-root">
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
      @click.left="clickAny"
      @click.right.prevent="keyDownEscape"
      @mouseenter="focus"
      @mousemove.prevent="mousemove"
      @mousedown.middle.prevent="downMiddle"
      @mouseup.middle.prevent="upMiddle"
      @mouseleave="leave"
      @keydown.escape.exact.prevent="keyDownEscape"
      @keydown.g.exact.prevent="editKeyDown('g')"
      @keydown.x.exact.prevent="editKeyDown('x')"
    >
      <slot :scale="scale" :view-origin="viewOrigin" :view-size="viewSize" />
    </svg>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, watch, computed } from 'vue'
import { getPointInTarget } from 'okanvas'
import { useWindow } from '../composables/window'
import { useCanvas } from '../composables/canvas'

export default defineComponent({
  emits: ['mousemove', 'click-any', 'click-empty', 'escape', 'g', 'x'],
  setup(props, { emit }) {
    const svg = ref<SVGElement>()
    const wrapper = ref<SVGElement>()

    const canvas = useCanvas({ scaleMin: 1 })

    function adjustSvgSize() {
      if (!wrapper.value) return
      const rect = wrapper.value.getBoundingClientRect()
      canvas.viewSize.width = rect.width
      canvas.viewSize.height = rect.height
    }

    const windowState = useWindow()
    onMounted(adjustSvgSize)
    watch(() => windowState.state.size, adjustSvgSize)

    return {
      scale: canvas.scale,
      viewOrigin: canvas.viewOrigin,
      viewSize: computed(() => canvas.viewSize),
      wrapper,
      svg,
      viewBox: canvas.viewBox,
      focus() {
        if (svg.value) svg.value.focus()
      },
      wheel: (e: WheelEvent) => canvas.wheel(e, true),
      downMiddle: canvas.downMiddle,
      upMiddle: canvas.upMiddle,
      leave: canvas.leave,
      mousemove: (e: MouseEvent) => {
        canvas.mousePoint.value = getPointInTarget(e)

        if (canvas.viewMovingInfo.value) {
          canvas.viewMove()
        } else if (canvas.editStartPoint.value) {
          emit('mousemove', {
            current: canvas.viewToCanvas(canvas.mousePoint.value),
            start: canvas.viewToCanvas(canvas.editStartPoint.value),
          })
        }
      },
      clickAny(e: any) {
        if (e.target === svg.value) {
          canvas.editStartPoint.value = undefined
          emit('click-empty')
        } else {
          emit('click-any')
        }
      },
      keyDownEscape: () => {
        emit('escape')
      },
      editKeyDown(key: 'g' | 'x') {
        if (!canvas.mousePoint.value) return

        canvas.editStartPoint.value = canvas.mousePoint.value
        emit(key)
      },
    }
  },
})
</script>

<style lang="scss" scoped>
.timeline-canvas-root {
  position: relative;
  height: 100%;
}
svg {
  border: solid 1px black;
  user-select: none;
}
</style>
