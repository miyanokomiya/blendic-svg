<!--
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
-->

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
      @click.left.exact="clickAny"
      @click.right.prevent="keyDownEscape"
      @mouseenter="focus"
      @mousedown.left.prevent="downLeft"
      @mouseup.left.prevent="upLeft"
      @mousemove.prevent="mousemove"
      @mousedown.middle.prevent="downMiddle"
      @mouseup.middle.prevent="upMiddle"
      @mouseleave="leave"
      @keydown.escape.exact.prevent="keyDownEscape"
      @keydown.g.exact.prevent="editKeyDown('g')"
      @keydown.x.exact.prevent="editKeyDown('x')"
      @keydown.a.exact.prevent="editKeyDown('a')"
      @keydown.c.ctrl.exact.prevent="editKeyDown('ctrl-c')"
      @keydown.v.ctrl.exact.prevent="editKeyDown('ctrl-v')"
      @keydown.d.shift.exact.prevent="editKeyDown('shift-d')"
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
  emits: [
    'down-left',
    'up-left',
    'mousemove',
    'drag',
    'click-any',
    'click-empty',
    'escape',
    'g',
    'x',
    'a',
    'ctrl-c',
    'ctrl-v',
    'shift-d',
  ],
  setup(props, { emit }) {
    const svg = ref<SVGElement>()
    const wrapper = ref<SVGElement>()

    const canvas = useCanvas({
      scaleMin: 1,
      ignoreNegativeY: true,
      scaleAtFixY: true,
    })

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
      downLeft: () => {
        if (!canvas.mousePoint.value) return
        canvas.downLeft()
        emit('down-left', canvas.viewToCanvas(canvas.mousePoint.value))
      },
      upLeft: () => {
        canvas.upLeft()
        emit('up-left')
      },
      downMiddle: canvas.downMiddle,
      upMiddle: canvas.upMiddle,
      leave: canvas.leave,
      mousemove: (e: MouseEvent) => {
        canvas.mousePoint.value = getPointInTarget(e)

        if (canvas.dragInfo.value) {
          emit('drag', canvas.viewToCanvas(canvas.mousePoint.value))
        } else if (canvas.viewMovingInfo.value) {
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
      editKeyDown(key: 'g' | 'x' | 'a' | 'ctrl-c' | 'ctrl-v' | 'shift-d') {
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
