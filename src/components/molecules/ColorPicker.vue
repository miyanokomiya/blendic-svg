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
  <div class="color-picker-wrapper">
    <div class="color-picker-inner">
      <HueCiclePicker
        :model-value="localHsva.h"
        class="hue-circle"
        @update:model-value="updateHue"
      />
      <div
        ref="colorRect"
        class="color-rect"
        :style="{ 'background-color': baseColor }"
        @mousedown="onDown"
      >
        <div
          class="cursor"
          :style="{
            transform: `translate(${rateInRect.x * RECT_SIZE}px,${
              rateInRect.y * RECT_SIZE
            }px)`,
          }"
        >
          <div />
        </div>
      </div>
      <div class="input-block">
        <div>
          <InlineField label="A" label-width="10px">
            <SliderInput
              :model-value="localHsva.a"
              :min="0"
              :max="1"
              @update:model-value="updateAlpha"
            />
          </InlineField>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { IVec2, sub, clamp } from 'okageo'
import { DragArgs, getPagePosition, useDrag } from 'okanvas'
import { computed, ref } from 'vue'
import { useGlobalMousemove, useGlobalMouseup } from '/@/composables/window'
import { HSVA, hsvaToRgba, rednerRGBA } from '/@/utils/color'
import { useThrottle } from '/@/composables/throttle'

const RECT_SIZE = 110
</script>

<script lang="ts" setup>
import SliderInput from '/@/components/atoms/SliderInput.vue'
import InlineField from '/@/components/atoms/InlineField.vue'
import HueCiclePicker from '/@/components/atoms/HueCiclePicker.vue'

const props = withDefaults(
  defineProps<{
    modelValue?: HSVA
    extraHue?: boolean
  }>(),
  {
    modelValue: () => ({ h: 0, s: 0, v: 0, a: 1 }),
    extraHue: false,
  }
)

const emit = defineEmits<{
  (e: 'update:model-value', hsva: HSVA, seriesKey?: string): void
}>()

const colorRect = ref<Element>()
const dragged = ref(false)
const seriesKey = ref<string>()

const localHsva = computed(() => {
  return props.modelValue
})
const rateInRect = computed(() => {
  return { x: localHsva.value.s, y: 1 - localHsva.value.v }
})

const baseColor = computed(() => {
  return rednerRGBA(hsvaToRgba({ h: localHsva.value.h, s: 1, v: 1, a: 1 }))
})

function update(hsva: HSVA, seriesKey?: string) {
  emit('update:model-value', hsva, seriesKey)
}

function updateHue(val: number, seriesKey?: string) {
  update({ ...localHsva.value, h: val }, seriesKey)
}
function updateAlpha(val: number, seriesKey?: string) {
  update({ ...localHsva.value, a: val }, seriesKey)
}

function updateByRect(windowP: IVec2) {
  if (!colorRect.value) return
  const rect = colorRect.value.getBoundingClientRect()

  const pointInRect = sub(windowP, { x: rect.left, y: rect.top })
  const next = {
    x: pointInRect.x / RECT_SIZE,
    y: pointInRect.y / RECT_SIZE,
  }

  const sv = {
    s: clamp(0, 1, next.x),
    v: 1 - clamp(0, 1, next.y),
  }
  update({ ...localHsva.value, s: sv.s, v: sv.v }, seriesKey.value)
}

function onDrag(arg: DragArgs) {
  updateByRect(arg.p)
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
  updateByRect(getPagePosition(e))
  drag.onDown(e)
}
</script>

<style scoped>
.color-picker-wrapper {
  --size: 200px;
  padding: 2px;
  background-color: var(--background);
}
.color-picker-inner {
  position: relative;
  width: var(--size);
}
.color-rect {
  --margin: 44px;
  position: absolute;
  top: 0;
  left: 0;
  margin: var(--margin);
  width: calc(var(--size) - var(--margin) * 2);
  height: calc(var(--size) - var(--margin) * 2);
  background-image: linear-gradient(rgba(0, 0, 0, 0), rgb(0, 0, 0)),
    linear-gradient(to right, rgb(255, 255, 255), rgba(255, 255, 255, 0));
}
.color-rect .cursor {
  position: absolute;
}
.color-rect .cursor > div {
  transform: translate(-50%, -50%);
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: var(--background);
  border: solid 1px var(--strong-border);
}
.input-block {
  padding-left: 8px;
}
.alpha {
  width: 100%;
}
</style>
