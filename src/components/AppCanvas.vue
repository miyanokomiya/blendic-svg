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
  <div ref="wrapper" class="app-canvas-root">
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
      @mousedown.left.prevent="downLeft"
      @mouseup.left.prevent="upLeft"
      @mousedown.middle.prevent="downMiddle"
      @mouseup.middle.prevent="upMiddle"
      @keydown.prevent="editKeyDown"
    >
      <g v-if="showAxis" :stroke-width="1 * scale" stroke-opacity="0.3">
        <line x1="-20000" x2="20000" stroke="red" />
        <line y1="-20000" y2="20000" stroke="green" />
      </g>
      <line
        v-if="gridLineElm"
        :x1="gridLineElm.from.x"
        :y1="gridLineElm.from.y"
        :x2="gridLineElm.to.x"
        :y2="gridLineElm.to.y"
        :stroke="gridLineElm.stroke"
        :stroke-width="gridLineElm.strokeWidth"
      />
      <slot :scale="scale" />
      <rect
        v-if="dragRectangle"
        :x="dragRectangle.x"
        :y="dragRectangle.y"
        :width="dragRectangle.width"
        :height="dragRectangle.height"
        fill="none"
        stroke="green"
        :stroke-width="2 * scale"
        :stroke-dasharray="`${4 * scale} ${4 * scale}`"
        class="view-only"
      />
      <CursorLine
        v-if="cursorInfo"
        :origin="cursorInfo.origin"
        :current="cursorInfo.current"
      />
    </svg>
    <div class="left-top-space">
      <CanvasModepanel
        class="mode-panel"
        :canvas-mode="canvasMode"
        @change-mode="changeMode"
      />
      <CanvasToolMenuGroups
        v-if="canvasMode === 'edit'"
        class="armature-menu"
        :groups="toolMenuGroupList"
      />
    </div>
    <CommandExamPanel
      class="command-exam-panel"
      :available-command-list="availableCommandList"
    />
    <PopupMenuList
      v-if="popupMenuList.length > 0 && popupMenuListPosition"
      class="popup-menu-list"
      :popup-menu-list="popupMenuList"
      :style="{
        left: `${popupMenuListPosition.x - 20}px`,
        top: `${popupMenuListPosition.y - 10}px`,
      }"
    />
    <GlobalCursor :p="cursor" :rotate="cursorRotate" :cursor="cursorType" />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, computed, watch, onMounted } from 'vue'
import { getRadian, IRectangle, IVec2 } from 'okageo'
import * as helpers from '/@/utils/helpers'
import CanvasModepanel from '/@/components/molecules/CanvasModepanel.vue'
import CommandExamPanel from '/@/components/molecules/CommandExamPanel.vue'
import CanvasToolMenuGroups from '/@/components/molecules/CanvasToolMenuGroups.vue'
import PopupMenuList from '/@/components/molecules/PopupMenuList.vue'
import GlobalCursor from '/@/components/atoms/GlobalCursor.vue'
import CursorLine from '/@/components/elements/atoms/CursorLine.vue'
import { useCanvasStore } from '/@/store/canvas'
import {
  PointerMovement,
  PointerType,
  usePointerLock,
  useWindow,
} from '../composables/window'
import { useSettings } from '/@/composables/settings'
import { centerizeView, provideScale, useCanvas } from '../composables/canvas'
import { useThrottle } from '/@/composables/throttle'
import { isCtrlOrMeta } from '/@/utils/devices'

export default defineComponent({
  components: {
    CanvasModepanel,
    CommandExamPanel,
    CanvasToolMenuGroups,
    PopupMenuList,
    GlobalCursor,
    CursorLine,
  },
  props: {
    originalViewBox: {
      type: Object as PropType<IRectangle>,
      required: true,
    },
  },
  setup(props) {
    const svg = ref<SVGElement>()
    const wrapper = ref<SVGElement>()

    const canvasStore = useCanvasStore()
    const { settings } = useSettings()

    const throttleMousemove = useThrottle(mousemove, 1000 / 60, true)
    const pointerLock = usePointerLock({
      onMove: throttleMousemove,
      onGlobalMove: (arg) => {
        canvas.mousePoint.value = arg.p
      },
      onEscape: escape,
    })
    const canvas = useCanvas()

    function initView() {
      const ret = centerizeView(
        props.originalViewBox,
        canvas.viewSize.value,
        50
      )
      canvas.viewOrigin.value = ret.viewOrigin
      canvas.scale.value = ret.scale
    }
    watch(() => props.originalViewBox, initView)

    const isDownEmpty = ref(false)

    const gridLineElm = computed(() => {
      if (canvasStore.state.axisGrid === '') return
      if (!canvas.editStartPoint.value) return
      return helpers.gridLineElm(
        canvas.scale.value,
        canvasStore.state.axisGrid,
        canvas.viewCanvasRect.value,
        canvasStore.selectedBonesOrigin.value
      )
    })

    watch(
      () => canvasStore.command.value,
      (to) => {
        if (to === '') {
          canvas.editStartPoint.value = undefined
          pointerLock.exitPointerLock()
        }
      }
    )

    function adjustSvgSize() {
      if (!wrapper.value) return
      const rect = wrapper.value.getBoundingClientRect()
      canvas.setViewSize({ width: rect.width, height: rect.height })
    }

    const windowState = useWindow()
    onMounted(adjustSvgSize)
    watch(() => windowState.state.size, adjustSvgSize)

    const popupMenuListPosition = ref<IVec2>()
    const popupMenuList = computed(() => canvasStore.popupMenuList.value)
    watch(popupMenuList, () => {
      popupMenuListPosition.value = canvas.mousePoint.value
    })

    function mousemove(arg: PointerMovement) {
      if (canvas.dragInfo.value) {
        // rect select
      } else if (canvas.viewMovingInfo.value) {
        canvas.viewMove()
      } else {
        if (!canvas.editStartPoint.value) return
        canvasStore.mousemove({
          current: canvas.viewToCanvas(canvas.mousePoint.value),
          start: canvas.viewToCanvas(canvas.editStartPoint.value),
          ctrl: arg.ctrl,
          scale: canvas.scale.value,
        })
      }
    }

    function escape() {
      canvasStore.cancel()
    }

    const cursorInfo = computed(() => {
      if (!['scale', 'rotate'].includes(canvasStore.command.value)) return
      return {
        origin: canvasStore.selectedBonesOrigin.value,
        current: canvas.viewToCanvas(canvas.mousePoint.value),
      }
    })

    const cursorRotate = computed(() => {
      if (!cursorInfo.value) return 0
      return (
        (getRadian(cursorInfo.value.current, cursorInfo.value.origin) * 180) /
        Math.PI
      )
    })

    const cursorType = computed<PointerType>(() => {
      switch (canvasStore.command.value) {
        case 'rotate':
          return 'move-v'
        case 'scale':
          return 'move-h'
        default:
          return 'move'
      }
    })

    const cursor = computed(() => {
      if (['grab', 'rotate', 'scale'].includes(canvasStore.command.value)) {
        return canvas.mousePoint.value
      }
      return undefined
    })

    provideScale(() => canvas.scale.value)

    return {
      showAxis: computed(() => settings.showAxis),
      scale: canvas.scale,
      viewSize: canvas.viewSize,
      svg,
      wrapper,
      viewBox: canvas.viewBox,
      gridLineElm,
      dragRectangle: canvas.dragRectangle,
      canvasMode: computed(() => canvasStore.state.canvasMode),
      popupMenuList,
      popupMenuListPosition,
      focus() {
        svg.value?.focus()
      },
      wheel: canvas.wheel,
      downMiddle(e: Event) {
        pointerLock.requestPointerLock(e)
        canvas.downMiddle()
      },
      upMiddle: canvas.upMiddle,

      downLeft: (e: MouseEvent) => {
        isDownEmpty.value = e.target === svg.value

        if (canvasStore.command.value) return

        // NOTE: rect-select only supports 'edit' and 'pose' modes currently
        if (['edit', 'pose'].includes(canvasStore.state.canvasMode)) {
          canvas.downLeft('rect-select')
        }
      },
      upLeft: (e: MouseEvent) => {
        if (canvas.dragRectangle.value && canvas.isValidDragRectangle.value) {
          canvasStore.rectSelect(canvas.dragRectangle.value, e.shiftKey)
        } else {
          if (e.target === svg.value && isDownEmpty.value) {
            canvasStore.clickEmpty()
          } else {
            canvasStore.clickAny()
          }
        }

        canvas.upLeft()
        isDownEmpty.value = false
      },

      escape,
      editKeyDown(e: KeyboardEvent) {
        const { needLock } = canvasStore.editKeyDown(e.key, {
          shift: e.shiftKey,
          ctrl: isCtrlOrMeta(e),
        })
        if (needLock) {
          pointerLock.requestPointerLock(e)
          canvas.editStartPoint.value = pointerLock.current.value
        }
      },
      changeMode: canvasStore.changeCanvasMode,
      availableCommandList: canvasStore.availableCommandList,
      toolMenuGroupList: canvasStore.toolMenuGroupList,

      cursorInfo,
      cursorRotate,
      cursorType,
      cursor,
    }
  },
})
</script>

<style lang="scss" scoped>
.app-canvas-root {
  position: relative;
}
.left-top-space {
  position: absolute;
  top: 4px;
  left: 4px;
  display: flex;
  align-items: center;

  .armature-menu {
    margin-left: 10px;
  }
}
.command-exam-panel {
  position: absolute;
  top: 24px;
  left: 4px;
}
svg {
  border: solid 1px black;
  user-select: none;
  outline: none;
  overflow-anchor: none;
}
.view-only {
  pointer-events: none;
}
.popup-menu-list {
  position: fixed;
  z-index: 1;
}
</style>
