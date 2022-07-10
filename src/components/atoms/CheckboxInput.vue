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

<script lang="ts">
import { computed, defineComponent } from 'vue'

export default defineComponent({
  props: {
    modelValue: { type: Boolean, default: false },
    label: { type: String, default: '' },
    disabled: { type: Boolean, default: false },
  },
  emits: ['update:model-value'],
  setup(props, { emit }) {
    return {
      value: computed({
        get() {
          return props.modelValue
        },
        set(val: boolean) {
          emit('update:model-value', val)
        },
      }),
    }
  },
})
</script>

<style lang="scss" scoped>
label {
  display: flex;
  align-items: center;
  cursor: pointer;
  > span {
    margin-left: 10px;
    text-align: left;
    user-select: none;
  }
  &.disabled {
    cursor: default;
    > span {
      color: var(--weak-border);
    }
  }
}
</style>
