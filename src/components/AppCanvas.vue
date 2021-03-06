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
      @click.left.exact="clickAny"
      @click.left.ctrl.exact="clickAny"
      @click.right.prevent="keyDownEscape"
      @mouseenter="focus"
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
        :x="originalViewBox.x"
        :y="originalViewBox.y"
        :width="originalViewBox.width"
        :height="originalViewBox.height"
        fill="none"
        stroke="black"
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
import {
  defineComponent,
  PropType,
  ref,
  reactive,
  computed,
  watch,
  onMounted,
} from 'vue'
import { getPointInTarget } from 'okanvas'
import { IVec2, IRectangle, multi, sub, add, getRectCenter } from 'okageo'
import { CanvasCommand, CanvasMode, scaleRate } from '/@/models'
import * as helpers from '/@/utils/helpers'
import { useStore } from '../store'
import ScaleMarker from '/@/components/elements/atoms/ScaleMarker.vue'
import CanvasModepanel from '/@/components/molecules/CanvasModepanel.vue'
import CommandExamPanel from '/@/components/molecules/CommandExamPanel.vue'
import CanvasArmatureMenu from '/@/components/molecules/CanvasArmatureMenu.vue'
import { useCanvasStore } from '/@/store/canvas'
import { useWindow } from '../composables/window'
import { useAnimationStore } from '../store/animation'
import { centerizeView } from '../composables/canvas'

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
    'click-any',
    'click-empty',
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
    const viewSize = reactive({ width: 600, height: 400 })
    const svg = ref<SVGElement>()
    const wrapper = ref<SVGElement>()
    const editStartPoint = ref<IVec2>()
    const mousePoint = ref<IVec2>()
    const scale = ref(1)
    const viewOrigin = ref<IVec2>({ x: 0, y: 0 })
    const viewMovingInfo = ref<{ origin: IVec2; downAt: IVec2 }>()

    const store = useStore()
    const canvasStore = useCanvasStore()
    const animationStore = useAnimationStore()

    function viewToCanvas(v: IVec2): IVec2 {
      return add(viewOrigin.value, multi(v, scale.value))
    }

    const selectedBonesOrigin = computed(() => {
      if (canvasStore.state.canvasMode === 'edit') {
        return store.selectedBonesOrigin.value
      } else {
        return animationStore.selectedPosedBoneOrigin.value
      }
    })

    const viewCanvasRect = computed(() => ({
      x: viewOrigin.value.x,
      y: viewOrigin.value.y,
      width: viewSize.width * scale.value,
      height: viewSize.height * scale.value,
    }))

    const viewBox = computed(() => helpers.viewbox(viewCanvasRect.value))

    const viewCenter = computed(() =>
      getRectCenter({ x: 0, y: 0, ...viewSize })
    )

    function initView() {
      const ret = centerizeView(props.originalViewBox, viewSize, 50)
      viewOrigin.value = ret.viewOrigin
      scale.value = ret.scale
    }
    watch(viewSize, initView)

    const gridLineElm = computed(() => {
      if (canvasStore.state.axisGrid === '') return
      if (!editStartPoint.value) return
      return helpers.gridLineElm(
        scale.value,
        canvasStore.state.axisGrid,
        viewCanvasRect.value,
        selectedBonesOrigin.value
      )
    })

    const scaleNaviElm = computed(() => {
      if (!mousePoint.value) return
      if (!['scale', 'rotate'].includes(props.currentCommand)) return
      return {
        origin: selectedBonesOrigin.value,
        current: viewToCanvas(mousePoint.value),
        side: props.currentCommand === 'rotate',
      }
    })

    watch(
      () => props.currentCommand,
      (to) => {
        canvasStore.setAxisGrid('')
        if (to === '') {
          editStartPoint.value = undefined
        }
      }
    )

    function adjustSvgSize() {
      if (!wrapper.value) return
      const rect = wrapper.value.getBoundingClientRect()
      viewSize.width = rect.width
      viewSize.height = rect.height
    }

    const windowState = useWindow()
    onMounted(adjustSvgSize)
    watch(() => windowState.state.size, adjustSvgSize)

    return {
      scale,
      viewSize,
      svg,
      wrapper,
      viewBox,
      gridLineElm,
      scaleNaviElm,
      canvasMode: computed(() => canvasStore.state.canvasMode),
      focus() {
        if (svg.value) svg.value.focus()
      },
      wheel(e: WheelEvent) {
        const origin = mousePoint.value ? mousePoint.value : viewCenter.value
        const beforeOrigin = viewToCanvas(origin)
        scale.value = scale.value * Math.pow(scaleRate, e.deltaY > 0 ? 1 : -1)
        const afterOrigin = viewToCanvas(origin)
        viewOrigin.value = add(viewOrigin.value, sub(beforeOrigin, afterOrigin))
      },
      downMiddle() {
        if (!mousePoint.value) return
        viewMovingInfo.value = {
          origin: { ...viewOrigin.value },
          downAt: { ...mousePoint.value },
        }
      },
      upMiddle() {
        viewMovingInfo.value = undefined
      },
      leave() {
        viewMovingInfo.value = undefined
      },
      mousemove: (e: MouseEvent) => {
        mousePoint.value = getPointInTarget(e)

        if (viewMovingInfo.value) {
          viewOrigin.value = add(
            viewMovingInfo.value.origin,
            multi(
              sub(viewMovingInfo.value.downAt, mousePoint.value),
              scale.value
            )
          )
        } else {
          if (!editStartPoint.value) return
          canvasStore.mousemove({
            current: viewToCanvas(mousePoint.value),
            start: viewToCanvas(editStartPoint.value),
            ctrl: e.ctrlKey,
            scale: scale.value,
          })
        }
      },
      clickAny(e: any) {
        if (e.target === svg.value) {
          editStartPoint.value = undefined
          emit('click-empty')
        } else {
          emit('click-any')
        }
      },
      keyDownTab: () => {
        emit('tab')
      },
      keyDownCtrlTab: () => emit('ctrl-tab'),
      keyDownEscape: () => {
        emit('escape')
      },
      editKeyDown(
        key:
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
      ) {
        if (!mousePoint.value) return

        if (
          (['grab', 'scale'] as CanvasCommand[]).includes(props.currentCommand)
        ) {
          if (key === 'x' || key === 'y') {
            canvasStore.switchAxisGrid(key)
            return
          }
        }

        editStartPoint.value = mousePoint.value
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
</style>
