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
  <div ref="el" class="slider-wrapper">
    <div class="slider-background" :style="{ transform: `scaleX(${rate})` }" />
    <input
      ref="inputEl"
      v-model="draftValue"
      type="text"
      :disabled="disabled"
      @change="input"
      @focus="onFocus"
      @blur="onBlur"
    />
    <div
      v-if="!focused && !disabled"
      class="slider-forward"
      @mouseup="onUpForward"
      @mousedown="onDown"
    />
  </div>
</template>

<script lang="ts">
import { useDrag } from 'okanvas'
import { computed, defineComponent, PropType, ref, watchEffect } from 'vue'
import { useGlobalMousemove, useGlobalMouseup } from '/@/composables/window'
import { clamp, logRound } from '/@/utils/geometry'

export default defineComponent({
  props: {
    modelValue: { type: Number, default: 0 },
    integer: {
      type: Boolean,
      default: false,
    },
    min: {
      type: Number as PropType<number | undefined>,
      default: undefined,
    },
    max: {
      type: Number as PropType<number | undefined>,
      default: undefined,
    },
    step: {
      type: Number,
      default: 1,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const el = ref<Element>()
    const inputEl = ref<HTMLInputElement>()
    const dragStartRate = ref(0)
    const focused = ref(false)
    const dragged = ref(false)
    const seriesKey = ref<string>()

    const range = computed<number | undefined>(() => {
      if (props.min !== undefined && props.max !== undefined) {
        return props.max - props.min
      } else {
        return undefined
      }
    })

    const stepLog = computed(() =>
      Math.round(Math.log(props.step) / Math.log(10))
    )

    const draftValue = ref('0')

    watchEffect(() => {
      draftValue.value = props.modelValue.toString()
    })

    const parseDraftValue = computed(() => {
      if (props.integer) {
        return parseInt(draftValue.value)
      } else {
        return parseFloat(draftValue.value)
      }
    })

    const rate = computed(() => {
      if (!range.value) return 0
      if (props.max === props.min) return 0
      return props.modelValue / (props.max! - props.min!)
    })

    function onUpForward() {
      // focus and select the input element if not dragged
      if (!dragged.value) {
        focused.value = true
        inputEl.value?.select()
      }
    }

    const drag = useDrag((arg) => {
      if (!el.value) return
      const width = el.value.getBoundingClientRect().width
      if (width === 0) return

      const rateDiff = (arg.p.x - arg.base.x) / width
      if (Math.abs(rateDiff) > 0) {
        dragged.value = true
      }

      if (range.value) {
        const val = logRound(
          -2,
          clamp(0, 1, dragStartRate.value + rateDiff) * range.value + props.min!
        )
        draftValue.value = clampValue(
          props.integer ? Math.round(val) : val
        ).toString()
      } else {
        draftValue.value = logRound(
          stepLog.value,
          clampValue(parseDraftValue.value + arg.d.x * props.step)
        ).toString()
      }

      input()
    })
    useGlobalMousemove((e) => {
      e.preventDefault()
      drag.onMove(e)
    })
    useGlobalMouseup(() => {
      drag.onUp()
      dragged.value = false
      seriesKey.value = undefined
    })

    function clampValue(val: number) {
      let ret = val
      if (props.min !== undefined) {
        ret = Math.max(ret, props.min)
      }
      if (props.max !== undefined) {
        ret = Math.min(ret, props.max)
      }
      return ret
    }

    function input() {
      if (isNaN(parseDraftValue.value)) {
        draftValue.value = props.modelValue.toString()
        return
      }
      if (parseDraftValue.value === props.modelValue) return

      emit(
        'update:modelValue',
        clampValue(parseDraftValue.value),
        seriesKey.value
      )
    }

    return {
      focused,
      onFocus: () => (focused.value = true),
      onBlur: () => (focused.value = false),
      draftValue,
      el,
      inputEl,
      onDown: (e: MouseEvent) => {
        e.preventDefault()
        dragged.value = false
        seriesKey.value = `slider_${Date.now()}`
        dragStartRate.value = rate.value
        drag.onDown(e)
      },
      onUpForward,
      input,
      rate,
    }
  },
})
</script>

<style lang="scss" scoped>
.slider-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}
input {
  text-align: center;
}
.slider-background {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #4169e1;
  opacity: 0.3;
  pointer-events: none;
  transform-origin: 0;
}
.slider-forward {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  cursor: col-resize;
}
</style>
