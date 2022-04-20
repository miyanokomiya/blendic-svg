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
    <FocusableBlock @keydown="editKeyDown" @copy="onCopy" @paste="onPaste">
      <svg
        ref="svg"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        font-family="sans-serif"
        :viewBox="viewBox"
        :width="viewSize.width"
        :height="viewSize.height"
        @wheel.prevent="wheel"
        @mousedown.middle.prevent="downMiddle"
        @mouseup.middle.prevent="upMiddle"
      >
        <DotBackground
          :x="viewCanvasRect.x"
          :y="viewCanvasRect.y"
          :width="viewCanvasRect.width"
          :height="viewCanvasRect.height"
          :size="40"
          class="view-only"
        />
        <g :stroke-width="2 * scale" stroke="#000">
          <line x1="-20" x2="20" />
          <line y1="-20" y2="20" />
        </g>
        <slot :scale="scale" :view-origin="viewOrigin" :view-size="viewSize" />
        <SelectRectangle
          v-if="dragRectangle"
          :x="dragRectangle.x"
          :y="dragRectangle.y"
          :width="dragRectangle.width"
          :height="dragRectangle.height"
          class="view-only"
        />
      </svg>
    </FocusableBlock>
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
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, computed, PropType } from 'vue'
import { provideScale, useCanvas } from '../composables/canvas'
import PopupMenuList from '/@/components/molecules/PopupMenuList.vue'
import CommandExamPanel from '/@/components/molecules/CommandExamPanel.vue'
import DotBackground from '/@/components/elements/atoms/DotBackground.vue'
import SelectRectangle from '/@/components/elements/atoms/SelectRectangle.vue'
import FocusableBlock from '/@/components/atoms/FocusableBlock.vue'
import { useCanvasElement } from '/@/composables/canvasElement'

export default defineComponent({
  components: {
    PopupMenuList,
    CommandExamPanel,
    DotBackground,
    SelectRectangle,
    FocusableBlock,
  },
  props: {
    canvas: {
      type: Object as PropType<ReturnType<typeof useCanvas>>,
      required: true,
    },
  },
  emits: ['keydown'],
  setup(props, { emit }) {
    const { wrapper, svg, addRootPosition } = useCanvasElement(
      () => props.canvas
    )

    provideScale(() => props.canvas.scale.value)

    onMounted(() => {
      props.canvas.adjustToCenter()
    })

    const popupMenuList = computed(() => [])
    const popupMenuListPosition = computed(() => {
      return addRootPosition(props.canvas.canvasToView({ x: 0, y: 0 }))
    })

    return {
      editKeyDown: (e: KeyboardEvent) => {
        emit('keydown', e)
      },
      onCopy: (_e: ClipboardEvent) => {},
      onPaste: (_e: ClipboardEvent) => {},

      scale: computed(() => props.canvas.scale.value),
      viewOrigin: computed(() => props.canvas.viewOrigin.value),
      viewSize: computed(() => props.canvas.viewSize.value),
      viewBox: computed(() => props.canvas.viewBox.value),
      viewCanvasRect: computed(() => props.canvas.viewCanvasRect.value),
      popupMenuList,

      wheel: props.canvas.wheel,
      downMiddle: () => {
        props.canvas.downMiddle()
      },
      upMiddle: () => {
        props.canvas.upMiddle()
      },
      wrapper,
      svg,
      availableCommandList: computed(() => []),
      popupMenuListPosition,
      dragRectangle: computed(() => props.canvas.dragRectangle.value),
    }
  },
})
</script>

<style scoped>
.timeline-canvas-root {
  position: relative;
  height: 100%;
}
svg {
  background-color: #aaa;
  border: solid 1px black;
}
.command-exam-panel {
  position: absolute;
  top: 0;
  left: 4px;
}
.popup-menu-list {
  position: fixed;
  z-index: 1;
}
</style>
