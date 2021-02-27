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
  <input v-model="draftValue" type="text" @change="input" />
</template>

<script lang="ts">
import { computed, defineComponent, ref, watchEffect } from 'vue'

export default defineComponent({
  props: {
    modelValue: { type: Number, default: 0 },
    integer: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
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

    return {
      draftValue,
      input() {
        if (parseDraftValue.value === props.modelValue) return
        emit('update:modelValue', parseDraftValue.value)
      },
    }
  },
})
</script>
