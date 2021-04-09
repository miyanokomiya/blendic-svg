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
      @click.left.prevent="clickAny"
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
      @keydown.t.exact.prevent="editKeyDown('t')"
      @keydown.x.exact.prevent="editKeyDown('x')"
      @keydown.y.exact.prevent="editKeyDown('y')"
      @keydown.a.exact.prevent="editKeyDown('a')"
      @keydown.c.ctrl.exact.prevent="editKeyDown('ctrl-c')"
      @keydown.v.ctrl.exact.prevent="editKeyDown('ctrl-v')"
      @keydown.d.shift.exact.prevent="editKeyDown('shift-d')"
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
import {
  defineComponent,
  ref,
  onMounted,
  watch,
  computed,
  PropType,
  provide,
} from 'vue'
import { getPointInTarget } from 'okanvas'
import { useWindow } from '../composables/window'
import { useCanvas } from '../composables/canvas'
import PopupMenuList from '/@/components/molecules/PopupMenuList.vue'
import { add, IVec2 } from 'okageo'
import { KeyframeEditCommand, PopupMenuItem } from '/@/composables/modes/types'
import { useThrottle } from '/@/composables/throttle'
import { isCtrlOrMeta } from '/@/utils/devices'

export default defineComponent({
  components: { PopupMenuList },
  props: {
    canvas: {
      type: Object as PropType<ReturnType<typeof useCanvas>>,
      default: () =>
        useCanvas({
          scaleMin: 1,
          ignoreNegativeY: true,
          scaleAtFixY: true,
        }),
    },
    popupMenuList: {
      type: Array as PropType<PopupMenuItem[]>,
      default: () => [],
    },
    currentCommand: {
      type: String as PropType<KeyframeEditCommand>,
      default: '',
    },
  },
  emits: [
    'down-left',
    'up-left',
    'mousemove',
    'drag',
    'click-any',
    'click-empty',
    'escape',
    'snap',
    'g',
    't',
    'x',
    'a',
    'ctrl-c',
    'ctrl-v',
    'shift-d',
  ],
  setup(props, { emit }) {
    const svg = ref<SVGElement>()
    const wrapper = ref<SVGElement>()

    const canvas = computed(() => {
      return props.canvas
    })

    function adjustSvgSize() {
      if (!wrapper.value) return
      const rect = wrapper.value.getBoundingClientRect()
      canvas.value.setViewSize({ width: rect.width, height: rect.height })
    }

    const windowState = useWindow()
    onMounted(adjustSvgSize)
    watch(() => windowState.state.size, adjustSvgSize)

    const popupMenuListPosition = ref<IVec2>()
    watch(
      () => props.popupMenuList,
      () => {
        if (!wrapper.value || !props.canvas.mousePoint.value) return
        const rect = wrapper.value.getBoundingClientRect()
        popupMenuListPosition.value = add(props.canvas.mousePoint.value, {
          x: rect.left,
          y: rect.top,
        })
      }
    )

    const isDownEmpty = ref(false)
    function clickAny(e: any) {
      if (e.target === svg.value && isDownEmpty.value) {
        canvas.value.editStartPoint.value = undefined
        emit('click-empty')
      } else {
        emit('click-any')
      }
    }

    function mousemove(e: MouseEvent) {
      canvas.value.mousePoint.value = getPointInTarget(e)

      if (canvas.value.dragInfo.value) {
        emit('drag', {
          current: canvas.value.viewToCanvas(canvas.value.mousePoint.value),
          start: canvas.value.viewToCanvas(canvas.value.dragInfo.value.downAt),
        })
      } else if (canvas.value.viewMovingInfo.value) {
        canvas.value.viewMove()
      } else if (canvas.value.editStartPoint.value) {
        emit('mousemove', {
          current: canvas.value.viewToCanvas(canvas.value.mousePoint.value),
          start: canvas.value.viewToCanvas(canvas.value.editStartPoint.value),
          ctrl: isCtrlOrMeta(e),
        })
      }
    }
    const throttleMousemove = useThrottle(mousemove, 1000 / 60, true)

    provide('getScale', () => canvas.value.scale.value)

    return {
      scale: computed(() => canvas.value.scale.value),
      viewOrigin: computed(() => canvas.value.viewOrigin.value),
      viewSize: computed(() => canvas.value.viewSize.value),
      viewBox: computed(() => canvas.value.viewBox.value),

      mousemove: throttleMousemove,
      wheel: (e: WheelEvent) => canvas.value.wheel(e, true),
      downLeft: (e: MouseEvent) => {
        isDownEmpty.value = e.target === svg.value

        if (!canvas.value.mousePoint.value) return
        canvas.value.downLeft()
        const current = canvas.value.viewToCanvas(canvas.value.mousePoint.value)
        emit('down-left', { current, start: current })
      },
      upLeft: () => {
        canvas.value.upLeft()
        emit('up-left')
      },
      downMiddle: () => canvas.value.downMiddle(),
      upMiddle: () => canvas.value.upMiddle(),
      leave: () => canvas.value.leave(),
      editKeyDown: (
        key: 'g' | 't' | 'x' | 'y' | 'a' | 'ctrl-c' | 'ctrl-v' | 'shift-d'
      ) => {
        if (!canvas.value.mousePoint.value) return

        if (props.currentCommand === 'grab') {
          if (key === 'x' || key === 'y') {
            emit('snap', key)
            return
          }
        }

        if (key === 'y') return

        canvas.value.editStartPoint.value = canvas.value.mousePoint.value
        emit(key)
      },

      wrapper,
      svg,
      popupMenuListPosition,
      focus() {
        if (svg.value) svg.value.focus()
      },
      clickAny,
      keyDownEscape: () => {
        emit('escape')
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
  outline: none;
  overflow-anchor: none;
}
.popup-menu-list {
  position: fixed;
  z-index: 1;
}
</style>
