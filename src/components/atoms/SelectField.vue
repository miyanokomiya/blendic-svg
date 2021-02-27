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
    <select v-model="value">
      <option value="">-- None --</option>
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

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue'

export default defineComponent({
  props: {
    options: {
      type: Array as PropType<{ value: number | string; label: string }[]>,
      default: () => [],
    },
    modelValue: {
      type: [Number, String],
      default: '',
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return {
      value: computed({
        get() {
          return props.modelValue
        },
        set(val: number | string) {
          emit('update:modelValue', val)
        },
      }),
    }
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
    padding: 1px 12px 0 0;
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
