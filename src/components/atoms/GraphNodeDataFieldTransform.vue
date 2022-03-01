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

Copyright (C) 2022, Tomoya Komiyama.
-->

<template>
  <div>
    <InlineField label="tr" label-width="10px">
      (
      <SliderInput
        :model-value="modelValue.translate.x"
        :step="1"
        :disabled="disabled"
        @update:model-value="updateTranslateX"
      />
      ,
      <SliderInput
        :model-value="modelValue.translate.y"
        :step="1"
        :disabled="disabled"
        @update:model-value="updateTranslateY"
      />
      )
    </InlineField>
    <InlineField label="ro" label-width="10px">
      <SliderInput
        :model-value="modelValue.rotate"
        :step="1"
        :disabled="disabled"
        @update:model-value="updateRotate"
      />
    </InlineField>
    <InlineField label="sc" label-width="10px">
      (
      <SliderInput
        :model-value="modelValue.scale.x"
        :step="0.1"
        :disabled="disabled"
        @update:model-value="updateScaleX"
      />
      ,
      <SliderInput
        :model-value="modelValue.scale.y"
        :step="0.1"
        :disabled="disabled"
        @update:model-value="updateScaleY"
      />
      )
    </InlineField>
    <InlineField label="or" label-width="10px">
      (
      <SliderInput
        :model-value="modelValue.origin.x"
        :step="1"
        :disabled="disabled"
        @update:model-value="updateOriginX"
      />
      ,
      <SliderInput
        :model-value="modelValue.origin.y"
        :step="1"
        :disabled="disabled"
        @update:model-value="updateOriginY"
      />
      )
    </InlineField>
  </div>
</template>

<script lang="ts">
import { withDefaults } from 'vue'
import { Transform } from '/@/models'
import SliderInput from '/@/components/atoms/SliderInput.vue'
import InlineField from '/@/components/atoms/InlineField.vue'
</script>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue: Transform
    disabled?: boolean
  }>(),
  {
    disabled: false,
  }
)

const emit = defineEmits<{
  (e: 'update:model-value', value: Transform, seriesKey?: string): void
}>()

function updateTranslateX(val: number, seriesKey?: string) {
  emit(
    'update:model-value',
    {
      ...props.modelValue,
      translate: { x: val, y: props.modelValue.translate.y },
    },
    seriesKey
  )
}
function updateTranslateY(val: number, seriesKey?: string) {
  emit(
    'update:model-value',
    {
      ...props.modelValue,
      translate: { x: props.modelValue.translate.x, y: val },
    },
    seriesKey
  )
}
function updateScaleX(val: number, seriesKey?: string) {
  emit(
    'update:model-value',
    {
      ...props.modelValue,
      scale: { x: val, y: props.modelValue.scale.y },
    },
    seriesKey
  )
}
function updateScaleY(val: number, seriesKey?: string) {
  emit(
    'update:model-value',
    {
      ...props.modelValue,
      scale: { x: props.modelValue.scale.x, y: val },
    },
    seriesKey
  )
}
function updateRotate(val: number, seriesKey?: string) {
  emit('update:model-value', { ...props.modelValue, rotate: val }, seriesKey)
}
function updateOriginX(val: number, seriesKey?: string) {
  emit(
    'update:model-value',
    {
      ...props.modelValue,
      origin: { x: val, y: props.modelValue.origin.y },
    },
    seriesKey
  )
}
function updateOriginY(val: number, seriesKey?: string) {
  emit(
    'update:model-value',
    {
      ...props.modelValue,
      origin: { x: props.modelValue.origin.x, y: val },
    },
    seriesKey
  )
}
</script>
