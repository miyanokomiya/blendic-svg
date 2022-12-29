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
      class="fill-background stroke-text"
    />
    <text
      x="4"
      :y="labelHeight / 2"
      dominant-baseline="central"
      :class="highlight ? 'fill-highlight' : 'fill-text'"
      >{{ label }}</text
    >
    <g
      v-if="showExpanded"
      :transform="`translate(${labelWidth - 16}, ${labelHeight / 2 - 6})`"
    >
      <rect
        x="-1"
        y="-1"
        width="14"
        height="14"
        stroke="none"
        class="fill-background-second"
      />
      <g stroke-linejoin="round" stroke="none" class="fill-background">
        <path v-if="expanded" d="M2 9L10 9L6 3z" />
        <path v-else d="M10 3L2 3L6 9z" />
      </g>
    </g>
  </g>
</template>

<script lang="ts" setup>
withDefaults(
  defineProps<{
    labelWidth?: number
    labelHeight?: number
    label: string
    expanded?: boolean
    showExpanded?: boolean
    selected?: boolean
    highlight?: boolean
  }>(),
  {
    labelWidth: 100,
    labelHeight: 24,
    highlight: false,
  }
)

const emit = defineEmits<{
  (e: 'toggle-expanded'): void
}>()

function toggleExpanded() {
  emit('toggle-expanded')
}
</script>

<style scoped>
.toggle-expanded {
  cursor: pointer;
}
</style>
