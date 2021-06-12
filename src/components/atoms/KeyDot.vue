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
  <button type="button" @click="toggle">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="-8 -8 16 16">
      <circle v-if="status === 'none'" r="2.5" :fill="color" />
      <path
        v-else-if="status === 'others'"
        d="M0,-5 L5,0 L0,5 L-5,0z"
        stroke="none"
        :fill="color"
      />
      <path
        v-else
        d="M0,-5 L5,0 L0,5 L-5,0z"
        stroke-linejoin="round"
        stroke-width="1.5"
        :stroke="color"
        fill="none"
      />
    </svg>
  </button>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue'
import type { KeyframeStatus } from '/@/models/keyframe'

export default defineComponent({
  props: {
    status: {
      type: String as PropType<KeyframeStatus>,
      default: 'none',
    },
    updated: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['create', 'delete'],
  setup(props, { emit }) {
    function toggle() {
      if (props.updated) {
        emit('create')
        return
      }

      switch (props.status) {
        case 'none':
        case 'others':
          emit('create')
          return
        case 'self':
          emit('delete')
          return
      }
    }

    return {
      toggle,
      color: computed(() => (props.updated ? '#ffc0cb' : '#aaa')),
    }
  },
})
</script>

<style lang="scss" scoped>
button {
  display: flex;
  align-items: center;
  justify-content: center;
}
svg {
  width: 20px;
}
</style>
