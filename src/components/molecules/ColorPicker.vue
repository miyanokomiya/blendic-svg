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
        <InlineField label="H" label-width="10px">
          <SliderInput
            :model-value="localHsva.h"
            :min="extraHue ? undefined : 0"
            :max="extraHue ? undefined : 360"
            integer
            @update:modelValue="updateHue"
          />
        </InlineField>
      </div>
      <div>
        <InlineField label="A" label-width="10px">
          <SliderInput
            :model-value="localHsva.a"
            :min="0"
            :max="1"
            @update:modelValue="updateAlpha"
          />
        </InlineField>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { IVec2, sub } from 'okageo'
import { getPagePosition, useDrag } from 'okanvas'
import { computed, defineComponent, PropType, ref } from 'vue'
import { useGlobalMousemove, useGlobalMouseup } from '/@/composables/window'
import {
  HSVA,
  hsvaToRgba,
  parseRGBA,
  rednerRGBA,
  rgbaToHsva,
} from '/@/utils/color'
import { clamp } from '/@/utils/geometry'
import SliderInput from '/@/components/atoms/SliderInput.vue'
import InlineField from '/@/components/atoms/InlineField.vue'

const RECT_SIZE = 200

export default defineComponent({
  components: { SliderInput, InlineField },
  props: {
    modelValue: {
      type: [String, Object] as PropType<string | HSVA>,
      default: undefined,
    },
    extraHue: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const colorRect = ref<Element>()
    const dragged = ref(false)
    const seriesKey = ref<string>()

    const localHsva = computed(() => {
      if (typeof props.modelValue !== 'string') return props.modelValue

      const rgba = parseRGBA(props.modelValue)
      if (!rgba) return { h: 0, s: 0, v: 0, a: 1 }
      return rgbaToHsva(rgba)
    })
    const rateInRect = computed(() => {
      return { x: localHsva.value.s, y: 1 - localHsva.value.v }
    })

    const baseColor = computed(() => {
      return rednerRGBA(hsvaToRgba({ h: localHsva.value.h, s: 1, v: 1, a: 1 }))
    })

    function update(hsva: HSVA, seriesKey?: string) {
      emit(
        'update:modelValue',
        typeof props.modelValue === 'string'
          ? rednerRGBA(hsvaToRgba(hsva))
          : hsva,
        seriesKey
      )
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

    const drag = useDrag((arg) => {
      updateByRect(arg.p)
    })
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

    return {
      RECT_SIZE,
      colorRect,
      baseColor,
      localHsva,
      onDown,
      updateHue,
      updateAlpha,
      rateInRect,
    }
  },
})
</script>

<style lang="scss" scoped>
$size: 200px;

.color-picker-wrapper {
  width: $size;
  background-color: #fff;
}
.color-rect {
  position: relative;
  width: 100%;
  height: $size;
  background-image: linear-gradient(rgba(0, 0, 0, 0), rgb(0, 0, 0)),
    linear-gradient(to right, rgb(255, 255, 255), rgba(255, 255, 255, 0));
  .cursor {
    position: absolute;
    > div {
      transform: translate(-50%, -50%);
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background-color: #fff;
      border: solid 1px #000;
    }
  }
}
.input-block {
  padding: 2px 2px 0 8px;
  > div {
    padding-bottom: 2px;
  }
}
.alpha {
  width: 100%;
}
</style>
