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
  <g
    class="edge"
    :class="{ selected }"
    data-type="edge"
    :data-input_id="inputId"
    :data-input_key="inputKey"
    :data-output_id="outputId"
    :data-output_key="outputKey"
  >
    <path :d="pathD" :stroke="stroke" :stroke-width="3 * scale" fill="none" />
    <path
      class="highlight"
      :d="pathD"
      :stroke="stroke"
      :stroke-width="9 * scale"
      fill="none"
    />
    <g v-if="selected" fill="none" :stroke="selectedColor" stroke-width="5">
      <circle :cx="from.x" :cy="from.y" r="7" />
      <circle :cx="to.x" :cy="to.y" r="7" />
    </g>
  </g>
</template>

<script lang="ts">
import { withDefaults, computed } from 'vue'
import { IVec2 } from 'okageo'
import { useSettings } from '/@/composables/settings'
import { injectScale } from '/@/composables/canvas'
</script>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    from: IVec2
    to: IVec2
    selected?: boolean
    inputId?: string
    inputKey?: string
    outputId?: string
    outputKey?: string
  }>(),
  {
    selected: false,
    inputId: undefined,
    inputKey: undefined,
    outputId: undefined,
    outputKey: undefined,
  }
)

const pathD = computed(() => {
  const xD = Math.sqrt(Math.abs(props.from.x - props.to.x)) * 8
  return `M${props.from.x + 5},${props.from.y} C${props.from.x + xD},${
    props.from.y
  } ${props.to.x - xD},${props.to.y} ${props.to.x - 5},${props.to.y}`
})

const { settings } = useSettings()
const scale = computed(injectScale())

const selectedColor = computed(() => settings.selectedColor)
const stroke = computed(() =>
  props.selected ? settings.selectedColor : '#888'
)
</script>

<style scoped>
.edge.selected .highlight,
.edge:not(:hover) .highlight {
  display: none;
}
.highlight {
  cursor: pointer;
}
</style>
