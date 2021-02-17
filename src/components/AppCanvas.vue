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
      @click.left="clickAny"
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
      @keydown.a.shift.exact.prevent="editKeyDown('shift-a')"
    >
      <rect
        :x="originalViewBox.x"
        :y="originalViewBox.y"
        :width="originalViewBox.width"
        :height="originalViewBox.height"
        fill="none"
        stroke="black"
        stroke-width="1"
        stroke-dasharray="4 4"
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
      <slot />
      <ScaleMarker
        v-if="scaleNaviElm"
        :origin="scaleNaviElm.origin"
        :current="scaleNaviElm.current"
        :scale="scale"
        :side="scaleNaviElm.side"
      />
    </svg>
    <div class="help">
      <p>Mode: {{ canvasMode }}</p>
    </div>
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
import { CanvasCommand } from '/@/models'
import * as helpers from '/@/utils/helpers'
import { useStore } from '../store'
import ScaleMarker from '/@/components/elements/atoms/ScaleMarker.vue'
import { useCanvasStore } from '/@/store/canvas'
import { useWindow } from '../composables/window'
import { useAnimationStore } from '../store/Animation'

export default defineComponent({
  components: { ScaleMarker },
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
    'mousemove',
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
    'shift-a',
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

    const selectedBornsOrigin = computed(() => {
      if (canvasStore.state.canvasMode === 'edit') {
        return store.selectedBornsOrigin.value
      } else {
        return animationStore.selectedPosedBornOrigin.value
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

    const gridLineElm = computed(() => {
      if (canvasStore.state.axisGrid === '') return
      if (!editStartPoint.value) return
      return helpers.gridLineElm(
        scale.value,
        canvasStore.state.axisGrid,
        viewCanvasRect.value,
        selectedBornsOrigin.value
      )
    })

    const scaleNaviElm = computed(() => {
      if (!mousePoint.value) return
      if (!['scale', 'rotate'].includes(props.currentCommand)) return
      return {
        origin: selectedBornsOrigin.value,
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
        scale.value = scale.value * Math.pow(1.1, e.deltaY > 0 ? 1 : -1)
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
          emit('mousemove', {
            current: viewToCanvas(mousePoint.value),
            start: viewToCanvas(editStartPoint.value),
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
      editKeyDown(key: 'g' | 's' | 'r' | 'e' | 'x' | 'y' | 'shift-a') {
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
    }
  },
})
</script>

<style lang="scss" scoped>
.app-canvas-root {
  position: relative;
}
.help {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
}
svg {
  border: solid 1px black;
  user-select: none;
}
</style>
