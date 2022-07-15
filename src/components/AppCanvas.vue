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
    <FocusableBlock
      @keydown="handleKeydownEvent"
      @copy="handleCopyEvent"
      @paste="handlePasteEvent"
    >
      <svg
        ref="svg"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        font-family="sans-serif"
        :viewBox="viewBox"
        :width="viewSize.width"
        :height="viewSize.height"
        :class="{ 'picking-bone': pickingBone }"
        @wheel.prevent="wheel"
        @mousedown.prevent="handleDownEvent"
        @mouseup.prevent="handleUpEvent"
        @mousemove="handleNativeMoveEvent"
        @contextmenu.prevent
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
          :stroke="gridLineElm.color"
          :stroke-width="2 * scale"
        />
        <slot :scale="scale" />
        <SelectRectangle
          v-if="dragRectangle"
          :x="dragRectangle.x"
          :y="dragRectangle.y"
          :width="dragRectangle.width"
          :height="dragRectangle.height"
          class="view-only"
        />
        <CursorLine
          v-if="cursorInfo"
          :origin="cursorInfo.origin"
          :current="cursorInfo.current"
        />
      </svg>
    </FocusableBlock>
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
      :available-command-list="commandExamList"
    />
    <PopupMenuList
      v-if="popupMenuItems.length > 0 && popupMenuListPosition"
      class="popup-menu-list"
      :popup-menu-list="popupMenuItems"
      :style="{
        left: `${popupMenuListPosition.x - 20}px`,
        top: `${popupMenuListPosition.y - 10}px`,
      }"
    />
    <GlobalCursor :p="cursor" :rotate="cursorRotate" :cursor="cursorType" />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, watch, onMounted } from 'vue'
import { getRadian, IRectangle } from 'okageo'
import * as helpers from '/@/utils/helpers'
import CanvasModepanel from '/@/components/molecules/CanvasModepanel.vue'
import CommandExamPanel from '/@/components/molecules/CommandExamPanel.vue'
import CanvasToolMenuGroups from '/@/components/molecules/CanvasToolMenuGroups.vue'
import PopupMenuList from '/@/components/molecules/PopupMenuList.vue'
import GlobalCursor from '/@/components/atoms/GlobalCursor.vue'
import CursorLine from '/@/components/elements/atoms/CursorLine.vue'
import SelectRectangle from '/@/components/elements/atoms/SelectRectangle.vue'
import FocusableBlock from '/@/components/atoms/FocusableBlock.vue'
import { useCanvasStore } from '/@/store/canvas'
import {
  PointerMovement,
  PointerType,
  usePointerLock,
  useWindow,
} from '../composables/window'
import { useSettings } from '/@/composables/settings'
import {
  centerizeView,
  provideScale,
  useSvgCanvas,
} from '../composables/canvas'
import { useThrottle } from '/@/composables/throttle'
import { useCanvasElement } from '/@/composables/canvasElement'
import { useCanvasStateMachine } from '/@/composables/modes/canvasStateMachine'
import { useStore } from '/@/store'
import { CanvasMode } from '/@/composables/modes/types'
import { parseEventTarget } from '/@/composables/modeStates/utils'
import { getKeyOptions, getMouseOptions, isCtrlOrMeta } from '/@/utils/devices'
import { useMenuList } from '/@/composables/menuList'
import { useAnimationStore } from '/@/store/animation'
import { useElementStore } from '/@/store/element'
import { Rectangle } from 'okanvas'

export default defineComponent({
  components: {
    CanvasModepanel,
    CommandExamPanel,
    CanvasToolMenuGroups,
    PopupMenuList,
    GlobalCursor,
    CursorLine,
    SelectRectangle,
    FocusableBlock,
  },
  props: {
    originalViewBox: {
      type: Object as PropType<IRectangle | undefined>,
      default: undefined,
    },
  },
  setup(props) {
    const indexStore = useStore()
    const canvasStore = useCanvasStore()
    const animationStore = useAnimationStore()
    const elementStore = useElementStore()
    const { settings } = useSettings()
    const canvas = useSvgCanvas()

    const { wrapper, svg, addRootPosition, removeRootPosition } =
      useCanvasElement(() => canvas)

    provideScale(() => canvas.scale.value)

    const throttleMousemove = useThrottle(handleMoveEvent, 1000 / 60, true)
    const pointerLock = usePointerLock({
      onMove: throttleMousemove,
      onGlobalMove: (arg) => {
        if (!svg.value) return
        const p = removeRootPosition(arg.p)
        if (!p) return
        canvas.setMousePoint(p)
      },
      onEscape: () => {
        mode.sm.handleEvent({
          type: 'keydown',
          data: { key: 'Escape' },
          point: canvas.viewToCanvas(canvas.mousePoint.value),
        })
      },
    })

    const mode = useCanvasStateMachine({
      indexStore,
      canvasStore,
      animationStore,
      elementStore,

      requestPointerLock: () => {
        if (!svg.value) return
        canvas.startMoving()
        pointerLock.requestPointerLockFromElement(svg.value)
      },
      exitPointerLock: () => {
        pointerLock.exitPointerLock()
        canvas.endMoving()
      },

      setViewport: (rect: Rectangle) => {
        canvas.setViewport(rect)
      },
      panView: (val) => canvas.viewMove(val),
      startDragging: () => canvas.startDragging(),
      setRectangleDragging: (val) => canvas.setRectangleDragging(val),
      getDraggedRectangle: () => canvas.draggedRectangle.value,
    })

    canvasStore.setEventDispatcher(mode.sm.handleEvent)

    watch(canvasStore.canvasMode, (to) => {
      mode.sm.handleEvent({ type: 'state', data: { name: to } })
    })
    watch(
      [
        indexStore.lastSelectedArmature,
        indexStore.selectedBones,
        elementStore.selectedElements,
      ],
      () => {
        mode.sm.handleEvent({ type: 'selection' })
      }
    )

    function initView() {
      if (!props.originalViewBox) return

      const ret = centerizeView(
        props.originalViewBox,
        canvas.viewSize.value,
        150
      )
      canvas.viewOrigin.value = ret.viewOrigin
      canvas.scale.value = ret.scale
    }
    watch(() => props.originalViewBox, initView)
    onMounted(initView)

    const gridLineElm = computed(() => {
      if (!canvas.editStartPoint.value) return
      if (!canvasStore.axisGridLine.value) return

      return {
        ...helpers.gridLineElm(
          canvasStore.axisGridLine.value.origin,
          canvasStore.axisGridLine.value.vec,
          canvas.viewCanvasRect.value
        ),
        color: canvasStore.axisGridLine.value.axis === 'x' ? 'red' : 'green',
      }
    })

    function adjustSvgSize() {
      if (!wrapper.value) return
      const rect = wrapper.value.getBoundingClientRect()
      canvas.setViewSize({ width: rect.width, height: rect.height })
    }

    const windowState = useWindow()
    onMounted(adjustSvgSize)
    watch(() => windowState.state.size, adjustSvgSize)

    const popupMenuListPosition = computed(() => {
      return canvasStore.popupMenuInfo.value
        ? addRootPosition(
            canvas.canvasToView(canvasStore.popupMenuInfo.value.point)
          )
        : undefined
    })
    const popupMenuList = useMenuList(
      () =>
        canvasStore.popupMenuInfo.value?.items.map(
          ({ label, children, key, data }) => ({
            label,
            exec: key
              ? () => handlePopupmenuEvent(key as string, data)
              : undefined,
            children: children?.map(({ label, key, data }) => ({
              label,
              exec: key ? () => handlePopupmenuEvent(key, data) : undefined,
            })),
          })
        ) ?? []
    )

    const toolMenuGroupList = computed(
      () =>
        canvasStore.toolMenuGroupList.value.map(({ label, items }) => ({
          label,
          items: items.map(({ label, key }) => ({
            label,
            exec: key ? () => handlePopupmenuEvent(key!) : undefined,
          })),
        })) ?? []
    )

    const cursorInfo = computed(() => {
      if (!['scale', 'rotate'].includes(canvasStore.editTransformType.value))
        return
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
      switch (canvasStore.editTransformType.value) {
        case 'rotate':
          return 'move-v'
        case 'scale':
          return 'move-h'
        default:
          return 'move'
      }
    })

    const cursor = computed(() => {
      return canvasStore.editTransformType.value
        ? addRootPosition(canvas.mousePoint.value)
        : undefined
    })

    const pickingBone = computed(() => !!indexStore.bonePicker.value)

    function handleDownEvent(e: MouseEvent) {
      mode.sm.handleEvent({
        type: 'pointerdown',
        target: parseEventTarget(e),
        data: {
          point: canvas.viewToCanvas(canvas.mousePoint.value),
          options: getMouseOptions(e),
        },
      })
    }
    function handleUpEvent(e: MouseEvent) {
      canvas.endMoving()
      mode.sm.handleEvent({
        type: 'pointerup',
        target: parseEventTarget(e),
        data: {
          point: canvas.viewToCanvas(canvas.mousePoint.value),
          options: getMouseOptions(e),
        },
      })
    }
    function handleMoveEvent(e: PointerMovement) {
      if (!canvas.editStartPoint.value) return
      mode.sm.handleEvent({
        type: 'pointermove',
        data: {
          start: canvas.viewToCanvas(canvas.editStartPoint.value),
          current: canvas.viewToCanvas(canvas.mousePoint.value),
          ctrl: e.ctrl,
          scale: canvas.scale.value,
        },
      })
    }
    function handleNativeMoveEvent(e: MouseEvent) {
      if (canvas.dragged.value && canvas.editStartPoint.value) {
        mode.sm.handleEvent({
          type: 'pointerdrag',
          data: {
            start: canvas.viewToCanvas(canvas.editStartPoint.value),
            current: canvas.viewToCanvas(canvas.mousePoint.value),
            ctrl: isCtrlOrMeta(e),
            scale: canvas.scale.value,
          },
        })
      }
    }
    function handleKeydownEvent(e: KeyboardEvent) {
      mode.sm.handleEvent({
        type: 'keydown',
        data: getKeyOptions(e),
        point: canvas.viewToCanvas(canvas.mousePoint.value),
      })
    }
    function handlePopupmenuEvent(
      key: string,
      data: { [key: string]: string } = {}
    ) {
      mode.sm.handleEvent({ type: 'popupmenu', data: { key, ...data } })
    }
    function handleCopyEvent(e: ClipboardEvent) {
      mode.sm.handleEvent({ type: 'copy', nativeEvent: e })
    }
    function handlePasteEvent(e: ClipboardEvent) {
      mode.sm.handleEvent({ type: 'paste', nativeEvent: e })
    }
    function handleChangeMode(name: CanvasMode) {
      canvasStore.changeCanvasMode(name)
    }

    return {
      viewCanvasRect: computed(() => canvas.viewCanvasRect.value),
      showAxis: computed(() => settings.showAxis),
      scale: canvas.scale,
      viewSize: canvas.viewSize,
      svg,
      wrapper,
      viewBox: canvas.viewBox,
      gridLineElm,
      dragRectangle: canvas.draggedRectangle,
      canvasMode: canvasStore.canvasMode,
      popupMenuItems: computed(() => popupMenuList.list.value),
      popupMenuListPosition,
      wheel: canvas.wheel,

      changeMode: handleChangeMode,
      commandExamList: canvasStore.commandExamList,
      toolMenuGroupList,

      cursorInfo,
      cursorRotate,
      cursorType,
      cursor,
      pickingBone,

      handleDownEvent,
      handleUpEvent,
      handleMoveEvent,
      handleNativeMoveEvent,
      handleKeydownEvent,
      handleCopyEvent,
      handlePasteEvent,
    }
  },
})
</script>

<style scoped>
.app-canvas-root {
  position: relative;
}
.left-top-space {
  position: absolute;
  top: 4px;
  left: 4px;
  display: flex;
  align-items: center;
}
.armature-menu {
  margin-left: 10px;
}
.command-exam-panel {
  position: absolute;
  top: 24px;
  left: 4px;
}
svg {
  border: solid 1px var(--strong-border);
}
.popup-menu-list {
  position: fixed;
  z-index: 1;
}
.picking-bone {
  background-color: var(--weak-border);
}
</style>
