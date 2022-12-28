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
  <path :d="d" :stroke="color" :stroke-width="lineWidth * scale" />
</template>

<script lang="ts" setup>
import { IVec2 } from 'okageo'
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    c0: IVec2
    c1: IVec2
    c2: IVec2
    c3: IVec2
    color?: string
    scale?: number
    lineWidth?: number
  }>(),
  {
    color: '#fff',
    scale: 1,
    lineWidth: 1,
  }
)

const d = computed(() => {
  return `M ${props.c0.x},${props.c0.y} C ${props.c1.x},${props.c1.y} ${props.c2.x},${props.c2.y} ${props.c3.x},${props.c3.y}`
})
</script>
