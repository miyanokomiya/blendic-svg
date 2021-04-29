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
      @click.right.prevent
      @mouseup.right.prevent="keyDownEscape"
      @mouseenter="focus"
      @mousedown.left.prevent="downLeft"
      @mouseup.left.prevent="upLeft"
      @mousedown.middle.prevent="downMiddle"
      @mouseup.middle.prevent="upMiddle"
      @mouseleave="leave"
      @keydown.prevent="editKeyDownA"
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
        @delete="execDelete"
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
    <GlobalCursor :p="cursor" />
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  PropType,
  ref,
  computed,
  watch,
  onMounted,
  nextTick,
} from 'vue'
import { IRectangle, IVec2 } from 'okageo'
import { CanvasCommand, CanvasMode } from '/@/composables/modes/types'
import * as helpers from '/@/utils/helpers'
import { useStore } from '../store'
import ScaleMarker from '/@/components/elements/atoms/ScaleMarker.vue'
import CanvasModepanel from '/@/components/molecules/CanvasModepanel.vue'
import CommandExamPanel from '/@/components/molecules/CommandExamPanel.vue'
import CanvasArmatureMenu from '/@/components/molecules/CanvasArmatureMenu.vue'
import PopupMenuList from '/@/components/molecules/PopupMenuList.vue'
import GlobalCursor from '/@/components/atoms/GlobalCursor.vue'
import { useCanvasStore } from '/@/store/canvas'
import {
  PointerMovement,
  usePointerLock,
  useWindow,
} from '../composables/window'
import { useAnimationStore } from '../store/animation'
import { useSettings } from '/@/composables/settings'
import { centerizeView, useCanvas } from '../composables/canvas'
import { useThrottle } from '/@/composables/throttle'
import { isCtrlOrMeta } from '/@/utils/devices'

export default defineComponent({
  components: {
    ScaleMarker,
    CanvasModepanel,
    CommandExamPanel,
    CanvasArmatureMenu,
    PopupMenuList,
    GlobalCursor,
  },
  props: {
    originalViewBox: {
      type: Object as PropType<IRectangle>,
      required: true,
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

    const throttleMousemove = useThrottle(mousemove, 1000 / 60, true)
    const pointerLock = usePointerLock(throttleMousemove, undefined, escape)
    const canvas = useCanvas()

    watch(pointerLock.globalCurrent, (to) => {
      canvas.mousePoint.value = to
    })

    const selectedBonesOrigin = computed(() => {
      if (canvasStore.state.canvasMode === 'edit') {
        return store.selectedBonesOrigin.value
      } else {
        return animationStore.selectedPosedBoneOrigin.value
      }
    })

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

    const gridLineElm = computed(() => {
      if (canvasStore.state.axisGrid === '') return
      if (!canvas.editStartPoint.value) return
      return helpers.gridLineElm(
        canvas.scale.value,
        canvasStore.state.axisGrid,
        canvas.viewCanvasRect.value,
        selectedBonesOrigin.value
      )
    })

    const scaleNaviElm = computed(() => {
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
      emit('escape')
    }

    return {
      showAxis: computed(() => settings.showAxis),
      scale: canvas.scale,
      viewSize: canvas.viewSize,
      svg,
      wrapper,
      viewBox: canvas.viewBox,
      gridLineElm,
      scaleNaviElm,
      dragRectangle: canvas.dragRectangle,
      canvasMode: computed(() => canvasStore.state.canvasMode),
      popupMenuList,
      popupMenuListPosition,
      focus() {
        if (svg.value) svg.value.focus()
      },
      wheel: canvas.wheel,
      downMiddle(e: Event) {
        pointerLock.requestPointerLock(e)
        canvas.downMiddle()
      },
      upMiddle: canvas.upMiddle,
      downLeft: () => {
        if (canvasStore.command.value) return
        if (canvasStore.state.canvasMode === 'object') return
        if (canvasStore.state.canvasMode === 'weight') return
        canvas.downLeft('rect-select')
      },
      upLeft: (e: MouseEvent) => {
        if (!canvasStore.command.value && !canvas.dragInfo.value) return
        if (!['object', 'weight'].includes(canvasStore.state.canvasMode)) {
          if (!canvas.isSomeAction.value) return
        }

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
      keyDownEscape: escape,
      execDelete() {
        emit('x')
      },
      editKeyDownA(e: KeyboardEvent) {
        switch (e.key) {
          case 'Escape':
            emit('escape')
            break
          case 'Tab':
            if (e.shiftKey) {
              emit('ctrl-tab')
            } else {
              emit('tab')
            }
            break
          case 'g':
          case 'r':
          case 's':
          case 'e':
          case 'x':
          case 'y':
          case 'a':
          case 'i':
            emit(e.key)
            break
          case 'A':
            emit('shift-a')
            break
          case 'D':
            emit('shift-d')
            break
          case 'c':
            if (isCtrlOrMeta(e)) {
              emit('ctrl-c')
            }
            break
          case 'v':
            if (isCtrlOrMeta(e)) {
              emit('ctrl-v')
            }
            break
        }

        pointerLock.requestPointerLock(e)
        canvas.editStartPoint.value = pointerLock.current.value

        nextTick().then(() => {
          if (!props.currentCommand) {
            pointerLock.exitPointerLock()
          }
        })
      },
      changeMode(canvasMode: CanvasMode) {
        emit('change-mode', canvasMode)
      },
      availableCommandList: canvasStore.availableCommandList,
      symmetrize() {
        canvasStore.symmetrizeBones()
      },
      cursor: computed(() => {
        if (props.currentCommand === 'grab') {
          return pointerLock.globalCurrent.value
        }
        return undefined
      }),
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
