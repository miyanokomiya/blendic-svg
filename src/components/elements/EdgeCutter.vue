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

Copyright (C) 2022, Tomoya Komiyama.
-->

<template>
  <g class="edge-cutter" data-type="edge-cutter">
    <path :d="pathD" stroke="lime" :stroke-width="3 * scale" fill="none" />
  </g>
</template>

<script lang="ts">
import { computed } from 'vue'
import { IVec2 } from 'okageo'
import { injectScale } from '/@/composables/canvas'
</script>

<script setup lang="ts">
const props = defineProps<{
  from: IVec2
  to: IVec2
}>()

const pathD = computed(() => {
  return `M${props.from.x},${props.from.y} L${props.to.x},${props.to.y}`
})

const scale = computed(injectScale())
</script>

<style scoped></style>
