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
  <div ref="wrapper" class="graph-canvas-root">
    <FocusableBlock
      @keydown="handleKeydownEvent"
      @copy="onCopy"
      @paste="onPaste"
    >
      <svg
        ref="svg"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        font-family="sans-serif"
        :viewBox="viewBox"
        :width="viewSize.width"
        :height="viewSize.height"
        @wheel.prevent="canvas.wheel"
        @mousedown.prevent="handleDownEvent"
        @mouseup.prevent="handleUpEvent"
        @mousemove="handleNativeMoveEvent"
        @contextmenu.prevent
      >
        <DotBackground
          :x="viewCanvasRect.x"
          :y="viewCanvasRect.y"
          :width="viewCanvasRect.width"
          :height="viewCanvasRect.height"
          :size="40"
          class="view-only"
        />
        <g stroke-width="2" stroke-dasharray="3" stroke="#000">
          <line x1="-20" x2="20" />
          <line y1="-20" y2="20" />
        </g>
        <slot :scale="scale" :view-origin="viewOrigin" :view-size="viewSize" />
        <SelectRectangle
          v-if="draggedRectangle"
          :x="draggedRectangle.x"
          :y="draggedRectangle.y"
          :width="draggedRectangle.width"
          :height="draggedRectangle.height"
          class="view-only"
        />
        <EdgeCutterElm
          v-if="edgeCutter"
          :from="edgeCutter.from"
          :to="edgeCutter.to"
        />
      </svg>
    </FocusableBlock>
    <CommandExamPanel
      class="command-exam-panel"
      :available-command-list="availableCommandList"
    />
    <CanvasToolMenuGroups class="tool-menus" :groups="toolMenuGroupList" />
    <PopupMenuList
      v-if="popupMenuItems.length > 0 && popupMenuListPosition"
      class="popup-menu-list"
      enabled-search
      :popup-menu-list="popupMenuItems"
      :style="{
        left: `${popupMenuListPosition.x - 80}px`,
        top: `${popupMenuListPosition.y - 10}px`,
      }"
    />
  </div>
</template>

<script lang="ts" setup>
import PopupMenuList from '/@/components/molecules/PopupMenuList.vue'
import CommandExamPanel from '/@/components/molecules/CommandExamPanel.vue'
import DotBackground from '/@/components/elements/atoms/DotBackground.vue'
import SelectRectangle from '/@/components/elements/atoms/SelectRectangle.vue'
import EdgeCutterElm from '/@/components/elements/EdgeCutter.vue'
import FocusableBlock from '/@/components/atoms/FocusableBlock.vue'
import CanvasToolMenuGroups from '/@/components/molecules/CanvasToolMenuGroups.vue'
import { onMounted, computed, ref, watch } from 'vue'
import { provideScale, useSvgCanvas } from '../composables/canvas'
import { useCanvasElement } from '/@/composables/canvasElement'
import { useAnimationGraphMode } from '/@/composables/modes/animationGraphMode'
import { useAnimationGraphStore } from '/@/store/animationGraph'
import { getKeyOptions, getMouseOptions, isCtrlOrMeta } from '/@/utils/devices'
import { parseEventTarget } from '/@/composables/modeStates/utils'
import { PointerMovement, usePointerLock } from '/@/composables/window'
import { useThrottle } from '/@/composables/throttle'
import {
  CommandExam,
  PopupMenuItem,
  ToolMenuGroup,
} from '/@/composables/modes/types'
import { IVec2 } from 'okageo'
import { useMenuList } from '/@/composables/menuList'
import { EdgeCutter } from '/@/composables/modeStates/animationGraph/core'

const props = defineProps<{
  canvas: ReturnType<typeof useSvgCanvas>
}>()

const { wrapper, svg, addRootPosition, removeRootPosition } = useCanvasElement(
  () => props.canvas
)

provideScale(() => props.canvas.scale.value)

onMounted(() => {
  props.canvas.adjustToCenter()
})

const popupMenuInfo = ref<{ items: PopupMenuItem[]; point: IVec2 }>()
const popupMenuListPosition = computed(() => {
  return popupMenuInfo.value
    ? addRootPosition(props.canvas.canvasToView(popupMenuInfo.value.point))
    : undefined
})

const throttleMousemove = useThrottle(handleMoveEvent, 1000 / 60, true)
const pointerLock = usePointerLock({
  onMove: throttleMousemove,
  onGlobalMove: (arg) => {
    if (!svg.value) return
    const p = removeRootPosition(arg.p)
    if (!p) return
    props.canvas.setMousePoint(p)
  },
  onEscape: handleEscape,
})

const popupMenuList = useMenuList(
  () =>
    popupMenuInfo.value?.items.map(({ label, children }) => ({
      label,
      children: children?.map(({ label, key, data }) => ({
        label,
        exec: key ? () => handlePopupmenuEvent(key as string, data) : undefined,
      })),
    })) ?? []
)

const toolMenuInfo = ref<ToolMenuGroup[]>([])
const toolMenuGroupList = computed(
  () =>
    toolMenuInfo.value.map(({ label, items }) => ({
      label,
      items: items.map(({ label, key }) => ({
        label,
        exec: key ? () => handlePopupmenuEvent(key!) : undefined,
      })),
    })) ?? []
)

const commandExams = ref<CommandExam[]>()
const edgeCutter = ref<EdgeCutter>()

const graphStore = useAnimationGraphStore()
const mode = useAnimationGraphMode({
  graphStore,
  requestPointerLock: () => {
    if (!svg.value) return
    props.canvas.startMoving()
    pointerLock.requestPointerLockFromElement(svg.value)
  },
  exitPointerLock: () => {
    pointerLock.exitPointerLock()
    props.canvas.endMoving()
  },
  getScale: () => {
    return props.canvas.scale.value
  },
  startEditMovement: () => {
    graphStore.setEditMovement({
      start: props.canvas.viewToCanvas(props.canvas.mousePoint.value),
      current: props.canvas.viewToCanvas(props.canvas.mousePoint.value),
      ctrl: false,
      scale: props.canvas.scale.value,
    })
  },
  startDragging: () => props.canvas.startDragging(),
  getCursorPoint: () =>
    props.canvas.viewToCanvas(props.canvas.mousePoint.value),
  setViewport: (val) => props.canvas.setViewport(val),
  panView: (val) => props.canvas.viewMove(val),
  setRectangleDragging: (val) => props.canvas.setRectangleDragging(val),
  getDraggedRectangle: () => props.canvas.draggedRectangle.value,
  setPopupMenuList: (val) => {
    popupMenuInfo.value = val
    popupMenuList.clearOpened()
  },
  setToolMenuList: (val = []) => (toolMenuInfo.value = val),
  getNodeItemList: () => graphStore.nodeItemList.value,
  setCommandExams: (val) => (commandExams.value = val),
  getEdgeCutter: () => edgeCutter.value,
  setEdgeCutter: (val: EdgeCutter | undefined) => (edgeCutter.value = val),
})

watch(graphStore.selectedNodes, () => {
  mode.sm.handleEvent({ type: 'selection' })
})

watch(graphStore.selectedGraphByType, () => {
  handleEscape()
})

function handleDownEvent(e: MouseEvent) {
  mode.sm.handleEvent({
    type: 'pointerdown',
    target: parseEventTarget(e),
    data: {
      point: props.canvas.viewToCanvas(props.canvas.mousePoint.value),
      options: getMouseOptions(e),
    },
  })
}
function handleUpEvent(e: MouseEvent) {
  props.canvas.endMoving()
  mode.sm.handleEvent({
    type: 'pointerup',
    target: parseEventTarget(e),
    data: {
      point: props.canvas.viewToCanvas(props.canvas.mousePoint.value),
      options: getMouseOptions(e),
    },
  })
}
function handleMoveEvent(e: PointerMovement) {
  if (!props.canvas.editStartPoint.value) return
  mode.sm.handleEvent({
    type: 'pointermove',
    data: {
      start: props.canvas.viewToCanvas(props.canvas.editStartPoint.value),
      current: props.canvas.viewToCanvas(props.canvas.mousePoint.value),
      ctrl: e.ctrl,
      scale: props.canvas.scale.value,
    },
  })
}
function handleNativeMoveEvent(e: MouseEvent) {
  if (props.canvas.dragged.value && props.canvas.editStartPoint.value) {
    mode.sm.handleEvent({
      type: 'pointerdrag',
      data: {
        start: props.canvas.viewToCanvas(props.canvas.editStartPoint.value),
        current: props.canvas.viewToCanvas(props.canvas.mousePoint.value),
        ctrl: isCtrlOrMeta(e),
        scale: props.canvas.scale.value,
      },
    })
  }
}
function handleKeydownEvent(e: KeyboardEvent) {
  mode.sm.handleEvent({
    type: 'keydown',
    data: getKeyOptions(e),
    point: props.canvas.viewToCanvas(props.canvas.mousePoint.value),
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
function handleEscape() {
  mode.sm.handleEvent({
    type: 'keydown',
    data: { key: 'Escape' },
    point: props.canvas.viewToCanvas(props.canvas.mousePoint.value),
  })
}

const scale = computed(() => props.canvas.scale.value)
const viewOrigin = computed(() => props.canvas.viewOrigin.value)
const viewSize = computed(() => props.canvas.viewSize.value)
const viewBox = computed(() => props.canvas.viewBox.value)
const viewCanvasRect = computed(() => props.canvas.viewCanvasRect.value)
const popupMenuItems = computed(() => popupMenuList.list.value)
const availableCommandList = computed(() => commandExams.value ?? [])
const draggedRectangle = computed(() => props.canvas.draggedRectangle.value)
const onCopy = handleCopyEvent
const onPaste = handlePasteEvent
</script>

<style scoped>
.graph-canvas-root {
  position: relative;
  height: 100%;
}
svg {
  background-color: var(--weak-border);
  border: solid 1px var(--strong-border);
}
.tool-menus {
  position: absolute;
  top: 4px;
  left: 4px;
}
.command-exam-panel {
  position: absolute;
  bottom: 4px;
  left: 4px;
}
.popup-menu-list {
  position: fixed;
  z-index: 1;
}
</style>
