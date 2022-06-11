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
  <span class="select-root">
    <select v-model="value" :disabled="disabled">
      <option v-if="!noPlaceholder" value="">-- {{ placeholder }} --</option>
      <option
        v-for="option in options"
        :key="option.value"
        :value="option.value"
      >
        {{ option.label }}
      </option>
    </select>
  </span>
</template>

<script setup lang="ts">
import { computed, PropType } from 'vue'

const props = defineProps({
  options: {
    type: Array as PropType<{ value: any; label: string }[]>,
    default: () => [],
  },
  modelValue: {
    type: [Number, String],
    default: '',
  },
  placeholder: {
    type: String,
    default: 'None',
  },
  noPlaceholder: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emits = defineEmits<{
  (e: 'update:model-value', val: any): void
}>()

const value = computed({
  get() {
    return props.modelValue
  },
  set(val: any) {
    emits('update:model-value', val)
  },
})
</script>

<style lang="scss" scoped>
.select-root {
  position: relative;
  display: flex;
  align-items: center;
  select {
    width: 100%;
    padding: 2px 12px 2px 4px;
    border: solid 1px #777;
  }
  &::after {
    display: block;
    content: ' ';
    position: absolute;
    top: 8px;
    right: 4px;
    width: 0;
    height: 0;
    pointer-events: none;
    border-top: solid 8px #777;
    border-left: solid 6px transparent;
    border-right: solid 6px transparent;
  }
}
</style>
