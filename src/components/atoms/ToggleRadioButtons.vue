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
  <ToggleButtons v-model="value" :options="options" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ToggleButtons from '/@/components/atoms/ToggleButtons.vue'

const props = withDefaults(
  defineProps<{
    modelValue: any
    options: { value: any; label: string }[]
    disabled?: boolean
  }>(),
  { disabled: false }
)

const emits = defineEmits<{
  (e: 'update:model-value', val: any): void
}>()

const value = computed({
  get() {
    return props.modelValue !== undefined ? [props.modelValue] : []
  },
  set(val: any[]) {
    const next = val.filter((v) => v !== props.modelValue)
    emits('update:model-value', next.length > 0 ? next[0] : props.modelValue)
  },
})
</script>
