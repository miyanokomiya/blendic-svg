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
      @click.right.prevent
      @mouseup.right.prevent="escape"
      @mouseenter="focus"
      @mousemove.prevent="mousemoveNative"
      @mousedown.left.prevent="downLeft"
      @mouseup.left.prevent="upLeft"
      @mousedown.middle.prevent="downMiddle"
      @mouseup.middle.prevent="upMiddle"
      @keydown.prevent="editKeyDown"
    >
      <slot :scale="scale" :view-origin="viewOrigin" :view-size="viewSize" />
    </svg>
    <PopupMenuList
      v-if="popupMenuList.length > 0 && popupMenuListPosition"
      class="popup-menu-list"
      :popup-menu-list="popupMenuList"
      :style="{
        left: `${popupMenuListPosition.x - 20}px`,
        top: `${popupMenuListPosition.y - 10}px`,
      }"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, watch, computed, PropType } from 'vue'
import {
  PointerMovement,
  usePointerLock,
  useWindow,
} from '../composables/window'
import { provideScale, useCanvas } from '../composables/canvas'
import PopupMenuList from '/@/components/molecules/PopupMenuList.vue'
import { add, IVec2, sub } from 'okageo'
import { useThrottle } from '/@/composables/throttle'
import { isCtrlOrMeta } from '/@/utils/devices'
import { AnimationGraphMode } from '/@/composables/modes/animationGraphMode'

export default defineComponent({
  components: { PopupMenuList },
  props: {
    canvas: {
      type: Object as PropType<ReturnType<typeof useCanvas>>,
      required: true,
    },
    mode: {
      type: Object as PropType<AnimationGraphMode>,
      required: true,
    },
  },
  setup(props) {
    const svg = ref<SVGElement>()
    const wrapper = ref<SVGElement>()

    provideScale(() => props.canvas.scale.value)

    function adjustSvgSize() {
      if (!wrapper.value) return
      const rect = wrapper.value.getBoundingClientRect()
      props.canvas.setViewSize({ width: rect.width, height: rect.height })
    }

    const windowState = useWindow()
    onMounted(adjustSvgSize)
    watch(() => windowState.state.size, adjustSvgSize)

    const popupMenuList = computed(() => props.mode.popupMenuList.value)
    const popupMenuListPosition = ref<IVec2>()
    watch(popupMenuList, () => {
      if (!wrapper.value || !props.canvas.mousePoint.value) return
      const rect = wrapper.value.getBoundingClientRect()
      popupMenuListPosition.value = add(props.canvas.mousePoint.value, {
        x: rect.left,
        y: rect.top,
      })
    })

    const isDownEmpty = ref(false)

    function mousemoveNative(e: MouseEvent) {
      if (!props.canvas.dragInfo.value) return

      props.mode.drag({
        start: props.canvas.viewToCanvas(props.canvas.dragInfo.value.downAt),
        current: props.canvas.viewToCanvas(props.canvas.mousePoint.value),
        ctrl: isCtrlOrMeta(e),
        scale: props.canvas.scale.value,
      })
    }

    function mousemove(arg: PointerMovement) {
      if (props.canvas.viewMovingInfo.value) {
        props.canvas.viewMove()
        return
      }

      if (props.canvas.editStartPoint.value) {
        props.mode.mousemove({
          start: props.canvas.viewToCanvas(props.canvas.editStartPoint.value),
          current: props.canvas.viewToCanvas(props.canvas.mousePoint.value),
          ctrl: arg.ctrl ?? false,
          scale: props.canvas.scale.value,
        })
      }
    }
    const throttleMousemove = useThrottle(mousemove, 1000 / 60, true)
    const pointerLock = usePointerLock({
      onMove: throttleMousemove,
      onGlobalMove: (arg) => {
        if (!svg.value) return
        // adjust in the canvas
        const svgRect = svg.value.getBoundingClientRect()
        props.canvas.setMousePoint(
          sub(arg.p, { x: svgRect.left, y: svgRect.top })
        )
      },
      onEscape: escape,
    })

    watch(
      () => props.mode.command.value,
      (to) => {
        if (to === '') {
          pointerLock.exitPointerLock()
        }
      }
    )

    function escape() {
      props.mode.cancel()
    }

    return {
      scale: computed(() => props.canvas.scale.value),
      viewOrigin: computed(() => props.canvas.viewOrigin.value),
      viewSize: computed(() => props.canvas.viewSize.value),
      viewBox: computed(() => props.canvas.viewBox.value),
      popupMenuList,

      mousemoveNative,
      wheel: (e: WheelEvent) => props.canvas.wheel(e, true),
      downLeft: (e: MouseEvent) => {
        isDownEmpty.value = e.target === svg.value
        props.canvas.downLeft()
        const current = props.canvas.viewToCanvas(props.canvas.mousePoint.value)
        props.mode.drag({
          current,
          start: current,
          ctrl: isCtrlOrMeta(e),
          scale: props.canvas.scale.value,
        })
      },
      upLeft: (e: MouseEvent) => {
        if (e.target === svg.value && isDownEmpty.value) {
          props.mode.clickEmpty()
        } else {
          props.mode.clickAny()
        }

        props.canvas.upLeft()
        props.mode.upLeft()
        isDownEmpty.value = false
      },
      downMiddle: (e: MouseEvent) => {
        props.canvas.downMiddle()
        pointerLock.requestPointerLock(e)
      },
      upMiddle: () => {
        props.canvas.upMiddle()
        pointerLock.exitPointerLock()
      },
      escape,
      editKeyDown: (e: KeyboardEvent) => {
        const { needLock } = props.mode.execKey({
          key: e.key,
          shift: e.shiftKey,
          ctrl: isCtrlOrMeta(e),
        })

        if (needLock) {
          pointerLock.requestPointerLock(e)
          props.canvas.setEditStartPoint(props.canvas.mousePoint.value)
        }
      },

      wrapper,
      svg,
      popupMenuListPosition,
      focus: () => svg.value?.focus(),
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
  outline: none;
  overflow-anchor: none;
}
.popup-menu-list {
  position: fixed;
  z-index: 1;
}
</style>
