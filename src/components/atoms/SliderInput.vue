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
    <div
      class="slider-background"
      :style="{ transform: `scaleX(${scaleX})` }"
    />
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
      @mousedown.prevent="onDown"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watchEffect } from 'vue'
import { clamp } from 'okageo'
import { useThrottle } from '/@/composables/throttle'
import { PointerMovement, usePointerLock } from '/@/composables/window'
import { logRound } from '/@/utils/geometry'

const props = withDefaults(
  defineProps<{
    modelValue?: number
    integer?: boolean
    min?: number | undefined
    max?: number | undefined
    step?: number
    disabled?: boolean
  }>(),
  {
    modelValue: 0,
    integer: false,
    min: undefined,
    max: undefined,
    step: 1,
    disabled: false,
  }
)

const emit = defineEmits<{
  (e: 'update:model-value', val: number, seriesKey?: string): void
}>()

const el = ref<Element>()
const inputEl = ref<HTMLInputElement>()
const dragStartValue = ref(0)
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

const stepLog = computed(() => Math.round(Math.log(props.step) / Math.log(10)))

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

function getRate(value: number): number {
  if (!range.value) return 0
  if (props.max === props.min) return 0
  return (value - props.min!) / (props.max! - props.min!)
}

const rate = computed(() => {
  return getRate(props.modelValue)
})

const dragStartRate = computed(() => {
  return getRate(dragStartValue.value)
})

const scaleX = computed(() => {
  return clamp(0, 1, rate.value)
})

function onUpForward() {
  document.exitPointerLock()
  // focus and select the input element if not dragged
  if (!dragged.value) {
    focused.value = true
    inputEl.value?.select()
  }
}

function onDrag(arg: PointerMovement) {
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
    // the same speed as pixel is too high to slide
    const diffX = (arg.p.x - arg.base.x) * 0.4
    draftValue.value = logRound(
      stepLog.value,
      clampValue(dragStartValue.value + diffX * props.step)
    ).toString()
  }

  input()
}
const throttleDrag = useThrottle(onDrag, 1000 / 60, true)

const pointerLock = usePointerLock({
  onMove: throttleDrag,
  onEscape: () => {
    dragged.value = false
    seriesKey.value = undefined
  },
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

  emit('update:model-value', clampValue(parseDraftValue.value), seriesKey.value)
}

const onFocus = () => (focused.value = true)
const onBlur = () => (focused.value = false)

const onDown = (e: MouseEvent) => {
  dragged.value = false
  seriesKey.value = `slider_${Date.now()}`
  dragStartValue.value = props.modelValue
  pointerLock.requestPointerLock(e, 'move-h')
}
</script>

<style scoped>
.slider-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background-color: var(--background);
}
input {
  position: relative;
  width: 100%;
  text-align: center;
  background-color: transparent;
}
.slider-background {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: var(--input-value-primary);
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
