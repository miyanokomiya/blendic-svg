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
  <svg
    ref="svg"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="-50 -50 100 100"
    @mousedown="onDown"
  >
    <HueCicle :radius="49" />
    <circle r="40" fill="#fff" />
    <line
      v-if="cursorP"
      :x2="cursorP.x"
      :y2="cursorP.y"
      stroke="#ddd"
      stroke-width="4"
    />
    <circle r="39" fill="#fff" />
  </svg>
</template>

<script lang="ts">
import { getRadian, IVec2, sub } from 'okageo'
import { DragArgs, getPagePosition, useDrag } from 'okanvas'
import { computed, defineComponent, ref } from 'vue'
import { useGlobalMousemove, useGlobalMouseup } from '/@/composables/window'
import { getContinuousRadDiff } from '/@/utils/geometry'
import HueCicle from '/@/components/atoms/HueCicle.vue'
import { useThrottle } from '/@/composables/throttle'

export default defineComponent({
  components: { HueCicle },
  props: {
    modelValue: {
      type: Number,
      default: undefined,
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    function radToP(rad: number) {
      return {
        x: Math.cos(rad) * 50,
        y: Math.sin(rad) * 50,
      }
    }

    const modelRad = computed(() => {
      return (props.modelValue * Math.PI) / 180
    })

    const cursorP = computed(() => {
      if (props.modelValue === undefined) return
      return radToP(modelRad.value)
    })

    const dragged = ref(false)
    const seriesKey = ref<string>()
    const svg = ref<Element>()

    function update(val: number) {
      emit('update:modelValue', val, seriesKey.value)
    }

    function getHueByPoint(pageP: IVec2): number | undefined {
      if (!svg.value) return

      const rect = svg.value.getBoundingClientRect()
      const p = sub(pageP, {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      })
      const rad =
        modelRad.value + getContinuousRadDiff(modelRad.value, getRadian(p))
      return Math.round((rad * 180) / Math.PI)
    }

    function onDrag(arg: DragArgs) {
      const h = getHueByPoint(arg.p)
      if (h === undefined) return
      update(h)
    }
    const throttleDrag = useThrottle(onDrag, 1000 / 60, true)

    const drag = useDrag(throttleDrag)
    useGlobalMousemove(drag.onMove)
    useGlobalMouseup(() => {
      drag.onUp()
      dragged.value = false
      seriesKey.value = undefined
    })

    function onDown(e: MouseEvent) {
      dragged.value = false
      seriesKey.value = `color_${Date.now()}`
      const h = getHueByPoint(getPagePosition(e))
      if (h === undefined) return
      update(h)
      drag.onDown(e)
    }

    return { cursorP, svg, onDown }
  },
})
</script>
