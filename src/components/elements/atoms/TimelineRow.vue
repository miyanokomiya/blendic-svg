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
  <g class="toggle-expanded" @click="toggleExpanded">
    <rect
      :width="labelWidth"
      :height="labelHeight"
      fill="#fff"
      stroke="black"
    />
    <text x="4" :y="labelHeight / 2" dominant-baseline="central">{{
      label
    }}</text>
    <g
      v-if="showExpanded"
      :transform="`translate(${labelWidth - 16}, ${labelHeight / 2 - 6})`"
    >
      <rect x="-1" y="-1" width="14" height="14" stroke="none" fill="#888" />
      <g stroke-linejoin="round" stroke="none" fill="#fff">
        <path v-if="expanded" d="M2 9L10 9L6 3z" />
        <path v-else d="M10 3L2 3L6 9z" />
      </g>
    </g>
  </g>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  props: {
    labelWidth: {
      type: Number,
      default: 100,
    },
    labelHeight: {
      type: Number,
      default: 24,
    },
    label: {
      type: String,
      required: true,
    },
    expanded: {
      type: Boolean,
      required: false,
    },
    showExpanded: {
      type: Boolean,
      required: false,
    },
  },
  emits: ['toggle-expanded'],
  setup(_props, { emit }) {
    return {
      toggleExpanded() {
        emit('toggle-expanded')
      },
    }
  },
})
</script>

<style lang="scss" scoped>
.toggle-expanded {
  cursor: pointer;
}
</style>
