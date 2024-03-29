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
  <g>
    <title v-if="tooltip">{{ tooltip }}</title>
    <rect
      :y="top - 3"
      :width="sameRangeWidth"
      height="6"
      fill="#aaa"
      fill-opacity="0.5"
      class="view-only"
    />
    <circle
      :cy="top"
      r="5"
      stroke="#000"
      :fill="selected ? selectedColor : '#fff'"
    />
    <circle
      :cy="top"
      r="10"
      fill="transparent"
      @click.left.exact="select"
      @click.left.shift.exact="shiftSelect"
    />
  </g>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useSettings } from '/@/composables/settings'

withDefaults(
  defineProps<{
    top: number
    selected?: boolean
    sameRangeWidth?: number
    tooltip?: string
  }>(),
  {
    selected: false,
    sameRangeWidth: 0,
    tooltip: '',
  }
)

const emit = defineEmits<{
  (e: 'select'): void
  (e: 'shift-select'): void
}>()

const { settings } = useSettings()
const selectedColor = computed(() => settings.selectedColor)

function select() {
  emit('select')
}

function shiftSelect() {
  emit('shift-select')
}
</script>
