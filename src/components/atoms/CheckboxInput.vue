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
  <label :class="{ disabled }">
    <input v-model="value" :disabled="disabled" type="checkbox" />
    <span v-if="label">{{ label }}</span>
  </label>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    label?: string
    disabled?: boolean
  }>(),
  {
    modelValue: false,
    label: '',
    disabled: false,
  }
)

const emit = defineEmits<{
  (e: 'update:model-value', val: boolean): void
}>()

const value = computed({
  get() {
    return props.modelValue
  },
  set(val: boolean) {
    emit('update:model-value', val)
  },
})
</script>

<style scoped>
label {
  display: flex;
  align-items: center;
  cursor: pointer;
}
label > span {
  margin-left: 10px;
  text-align: left;
  user-select: none;
}
label.disabled {
  cursor: default;
}
label.disabled > span {
  color: var(--weak-border);
}
</style>
