<template>
  <div>
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
      @mouseenter="focus"
      @mousemove.prevent="mousemove"
      @mousedown.middle.prevent="downMiddle"
      @mouseup.middle.prevent="upMiddle"
      @mouseleave="leave"
      @keydown.tab.exact.prevent="keyDownTab"
      @keydown.g.exact.prevent="editKeyDown('g')"
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
    </svg>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, reactive, computed, watch } from 'vue'
import { getPointInTarget } from 'okanvas'
import { IVec2, IRectangle, multi, sub, add, getRectCenter } from 'okageo'
import { CanvasCommand } from '/@/models'
import * as helpers from '/@/utils/helpers'

export default defineComponent({
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
    'tab',
    'g',
    'e',
    'x',
    'y',
    'shift-a',
  ],
  setup(props, { emit }) {
    const viewSize = reactive({ width: 600, height: 400 })
    const svg = ref<SVGElement>()
    const editStartPoint = ref<IVec2>()
    const mousePoint = ref<IVec2>()
    const scale = ref(1)
    const viewOrigin = ref<IVec2>({ x: 0, y: 0 })
    const viewMovingInfo = ref<{ origin: IVec2; downAt: IVec2 }>()
    const axisGrid = ref<'' | 'x' | 'y'>('')

    function viewToCanvas(v: IVec2): IVec2 {
      return multi(v, scale.value)
    }

    const viewCanvasRect = computed(() => ({
      x: viewOrigin.value.x,
      y: viewOrigin.value.y,
      width: viewSize.width * scale.value,
      height: viewSize.height * scale.value,
    }))

    const viewBox = computed(
      () =>
        `${viewCanvasRect.value.x} ${viewCanvasRect.value.y} ${viewCanvasRect.value.width} ${viewCanvasRect.value.height}`
    )

    const viewCenter = computed(() =>
      getRectCenter({ x: 0, y: 0, ...viewSize })
    )

    const gridLineElm = computed(() => {
      if (axisGrid.value === '') return
      if (!editStartPoint.value) return
      return helpers.gridLineElm(
        scale.value,
        axisGrid.value,
        viewCanvasRect.value,
        editStartPoint.value
      )
    })

    watch(
      () => props.currentCommand,
      (to) => {
        if (to === '') {
          editStartPoint.value = undefined
          axisGrid.value = ''
        }
      }
    )

    return {
      viewSize,
      svg,
      viewBox,
      gridLineElm,
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
            viewToCanvas(sub(viewMovingInfo.value.downAt, mousePoint.value))
          )
        } else {
          if (!editStartPoint.value) return

          if (axisGrid.value === 'x') {
            mousePoint.value = {
              x: mousePoint.value.x,
              y: editStartPoint.value.y,
            }
          } else if (axisGrid.value === 'y') {
            mousePoint.value = {
              x: editStartPoint.value.x,
              y: mousePoint.value.y,
            }
          }

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
      editKeyDown(key: 'g' | 'e' | 'x' | 'y' | 'shift-a') {
        if (!mousePoint.value) return
        if (([''] as CanvasCommand[]).includes(props.currentCommand)) {
          editStartPoint.value = mousePoint.value
          emit(key)
        } else if (
          (['grab'] as CanvasCommand[]).includes(props.currentCommand)
        ) {
          if (key === 'x') axisGrid.value = axisGrid.value === 'x' ? '' : 'x'
          else if (key === 'y')
            axisGrid.value = axisGrid.value === 'y' ? '' : 'y'
        }
      },
    }
  },
})
</script>

<style lang="scss" scoped>
svg {
  border: solid 1px black;
  user-select: none;
}
</style>
