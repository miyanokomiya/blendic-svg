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
  <div class="toggle-buttons" :class="{ disabled }">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      :class="{ selected: selectedMap[option.value] }"
      @click="click(option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { withDefaults, computed } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: any[]
    options: { value: any; label: string }[]
    disabled?: boolean
  }>(),
  { disabled: false }
)

const emits = defineEmits<{
  (e: 'update:model-value', val: any[]): void
}>()

function click(value: any) {
  const next = selectedMap.value[value]
    ? props.modelValue.filter((v) => v !== value)
    : [...props.modelValue, value]
  emits('update:model-value', next)
}

const selectedMap = computed<{ [value: string]: true }>(() => {
  return props.modelValue.reduce((p, v) => {
    p[v] = true
    return p
  }, {})
})
</script>

<style scoped>
.toggle-buttons {
  display: flex;
  align-items: center;
}
button {
  padding: 2px 10px;
  border: 1px solid #777;
}
button.selected {
  color: #191970;
  background-color: #aed6ff;
  border: 1px solid #191970;
  box-shadow: inset 0px 0px 3px #191970;
}
button:not(:first-child) {
  border-left: none;
}
button:first-child {
  border-radius: 12px 0 0 12px;
}
button:last-child {
  border-radius: 0 12px 12px 0;
}
.toggle-buttons.disabled > buttons {
  cursor: default;
  opacity: 0.7;
}
</style>
