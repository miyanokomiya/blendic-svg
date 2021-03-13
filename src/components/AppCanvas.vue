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
    <!-- ctrl+tab cannot work -->
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
      @click.right.prevent="keyDownEscape"
      @mouseenter="focus"
      @mousedown.left.prevent="downLeft"
      @mouseup.left.prevent="upLeft"
      @mousemove.prevent="mousemove"
      @mousedown.middle.prevent="downMiddle"
      @mouseup.middle.prevent="upMiddle"
      @mouseleave="leave"
      @keydown.escape.exact.prevent="keyDownEscape"
      @keydown.tab.exact.prevent="keyDownTab"
      @keydown.tab.shift.exact.prevent="keyDownCtrlTab"
      @keydown.g.exact.prevent="editKeyDown('g')"
      @keydown.s.exact.prevent="editKeyDown('s')"
      @keydown.r.exact.prevent="editKeyDown('r')"
      @keydown.e.exact.prevent="editKeyDown('e')"
      @keydown.x.exact.prevent="editKeyDown('x')"
      @keydown.y.exact.prevent="editKeyDown('y')"
      @keydown.a.exact.prevent="editKeyDown('a')"
      @keydown.a.shift.exact.prevent="editKeyDown('shift-a')"
      @keydown.i.exact.prevent="editKeyDown('i')"
      @keydown.c.ctrl.exact.prevent="editKeyDown('ctrl-c')"
      @keydown.v.ctrl.exact.prevent="editKeyDown('ctrl-v')"
      @keydown.d.shift.exact.prevent="editKeyDown('shift-d')"
    >
      <rect
        v-if="showViewbox"
        :x="originalViewBox.x"
        :y="originalViewBox.y"
        :width="originalViewBox.width"
        :height="originalViewBox.height"
        fill="none"
        stroke="#777"
        :stroke-width="1 * scale"
        :stroke-dasharray="`${4 * scale} ${4 * scale}`"
      ></rect>
      <line
        v-if="gridLineElm"
        :x1="gridLineElm.from.x"
        :y1="gridLineElm.from.y"
        :x2="gridLineElm.to.x"
        :y2="gridLineElm.to.y"
        :stroke="gridLineElm.stroke"
        :stroke-width="gridLineElm.strokeWidth"
      ></line>
      <slot :scale="scale" />
      <ScaleMarker
        v-if="scaleNaviElm"
        :origin="scaleNaviElm.origin"
        :current="scaleNaviElm.current"
        :scale="scale"
        :side="scaleNaviElm.side"
      />
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
    </svg>
    <div class="left-top-space">
      <CanvasModepanel
        class="mode-panel"
        :canvas-mode="canvasMode"
        @change-mode="changeMode"
      />
      <CanvasArmatureMenu
        v-if="canvasMode === 'edit'"
        class="armature-menu"
        @symmetrize="symmetrize"
        @delete="editKeyDown('x')"
      />
    </div>
    <CommandExamPanel
      class="command-exam-panel"
      :available-command-list="availableCommandList"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, computed, watch, onMounted } from 'vue'
import { getPointInTarget } from 'okanvas'
import { IRectangle } from 'okageo'
import { CanvasCommand, CanvasMode } from '/@/models'
import * as helpers from '/@/utils/helpers'
import { useStore } from '../store'
import ScaleMarker from '/@/components/elements/atoms/ScaleMarker.vue'
import CanvasModepanel from '/@/components/molecules/CanvasModepanel.vue'
import CommandExamPanel from '/@/components/molecules/CommandExamPanel.vue'
import CanvasArmatureMenu from '/@/components/molecules/CanvasArmatureMenu.vue'
import { useCanvasStore } from '/@/store/canvas'
import { useWindow } from '../composables/window'
import { useAnimationStore } from '../store/animation'
import { useSettings } from '/@/composables/settings'
import { centerizeView, useCanvas } from '../composables/canvas'
import { isCtrlOrMeta } from '/@/utils/devices'

type KeyType =
  | 'g'
  | 's'
  | 'r'
  | 'e'
  | 'x'
  | 'y'
  | 'a'
  | 'shift-a'
  | 'i'
  | 'ctrl-c'
  | 'ctrl-v'
  | 'shift-d'

export default defineComponent({
  components: {
    ScaleMarker,
    CanvasModepanel,
    CommandExamPanel,
    CanvasArmatureMenu,
  },
  props: {
    originalViewBox: {
      type: Object as PropType<IRectangle>,
      default: () => ({ x: 0, y: 0, width: 600, height: 400 }),
    },
    currentCommand: {
      type: String as PropType<CanvasCommand>,
      default: '',
    },
  },
  emits: [
    'change-mode',
    'escape',
    'tab',
    'ctrl-tab',
    'g',
    's',
    'r',
    'e',
    'x',
    'y',
    'a',
    'shift-a',
    'i',
    'ctrl-c',
    'ctrl-v',
    'shift-d',
  ],
  setup(props, { emit }) {
    const svg = ref<SVGElement>()
    const wrapper = ref<SVGElement>()

    const store = useStore()
    const canvasStore = useCanvasStore()
    const animationStore = useAnimationStore()
    const { settings } = useSettings()
    const canvas = useCanvas()

    const selectedBonesOrigin = computed(() => {
      if (canvasStore.state.canvasMode === 'edit') {
        return store.selectedBonesOrigin.value
      } else {
        return animationStore.selectedPosedBoneOrigin.value
      }
    })

    const viewCanvasRect = computed(() => ({
      x: canvas.viewOrigin.value.x,
      y: canvas.viewOrigin.value.y,
      width: canvas.viewSize.width * canvas.scale.value,
      height: canvas.viewSize.height * canvas.scale.value,
    }))

    function initView() {
      const ret = centerizeView(props.originalViewBox, canvas.viewSize, 50)
      canvas.viewOrigin.value = ret.viewOrigin
      canvas.scale.value = ret.scale
    }
    watch(canvas.viewSize, initView)

    const gridLineElm = computed(() => {
      if (canvasStore.state.axisGrid === '') return
      if (!canvas.editStartPoint.value) return
      return helpers.gridLineElm(
        canvas.scale.value,
        canvasStore.state.axisGrid,
        viewCanvasRect.value,
        selectedBonesOrigin.value
      )
    })

    const scaleNaviElm = computed(() => {
      if (!canvas.mousePoint.value) return
      if (!['scale', 'rotate'].includes(props.currentCommand)) return
      return {
        origin: selectedBonesOrigin.value,
        current: canvas.viewToCanvas(canvas.mousePoint.value),
        side: props.currentCommand === 'rotate',
      }
    })

    watch(
      () => props.currentCommand,
      (to) => {
        canvasStore.setAxisGrid('')
        if (to === '') {
          canvas.editStartPoint.value = undefined
        }
      }
    )

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
      showViewbox: computed(() => settings.showViewbox),
      scale: canvas.scale,
      viewSize: computed(() => canvas.viewSize),
      svg,
      wrapper,
      viewBox: canvas.viewBox,
      gridLineElm,
      scaleNaviElm,
      dragRectangle: canvas.dragRectangle,
      canvasMode: computed(() => canvasStore.state.canvasMode),
      focus() {
        if (svg.value) svg.value.focus()
      },
      wheel: canvas.wheel,
      downMiddle: canvas.downMiddle,
      upMiddle: canvas.upMiddle,
      downLeft: () => {
        if (!canvas.mousePoint.value) return
        if (canvasStore.command.value) return
        if (canvasStore.state.canvasMode === 'object') return
        if (canvasStore.state.canvasMode === 'weight') return
        canvas.downLeft('rect-select')
      },
      upLeft: (e: MouseEvent) => {
        if (!canvas.isSomeAction.value) return

        if (
          canvas.dragRectangle.value &&
          (Math.abs(canvas.dragRectangle.value.width) > 0 ||
            Math.abs(canvas.dragRectangle.value.height) > 0)
        ) {
          canvasStore.rectSelect(canvas.dragRectangle.value, e.shiftKey)
        } else {
          if (e.target === svg.value) {
            canvas.editStartPoint.value = undefined
            canvasStore.clickEmpty()
          } else {
            canvasStore.clickAny()
          }
        }
        canvas.upLeft()
      },
      leave: canvas.leave,
      mousemove: (e: MouseEvent) => {
        canvas.mousePoint.value = getPointInTarget(e)

        if (canvas.dragInfo.value) {
          // rect select
        } else if (canvas.viewMovingInfo.value) {
          canvas.viewMove()
        } else {
          if (!canvas.editStartPoint.value) return
          canvasStore.mousemove({
            current: canvas.viewToCanvas(canvas.mousePoint.value),
            start: canvas.viewToCanvas(canvas.editStartPoint.value),
            ctrl: isCtrlOrMeta(e),
            scale: canvas.scale.value,
          })
        }
      },
      keyDownTab: () => {
        emit('tab')
      },
      keyDownCtrlTab: () => emit('ctrl-tab'),
      keyDownEscape: () => {
        emit('escape')
      },
      editKeyDown(key: KeyType) {
        if (!canvas.mousePoint.value) return

        if (
          (['grab', 'scale'] as CanvasCommand[]).includes(props.currentCommand)
        ) {
          if (key === 'x' || key === 'y') {
            canvasStore.switchAxisGrid(key)
            return
          }
        }

        canvas.editStartPoint.value = canvas.mousePoint.value
        emit(key)
      },
      changeMode(canvasMode: CanvasMode) {
        emit('change-mode', canvasMode)
      },
      availableCommandList: canvasStore.availableCommandList,
      symmetrize() {
        canvasStore.symmetrizeBones()
      },
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
}
.view-only {
  pointer-events: none;
}
</style>
