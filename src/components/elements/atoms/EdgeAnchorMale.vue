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

Copyright (C) 2023, Tomoya Komiyama.
-->

<template>
  <g :fill="fill" stroke="#333">
    <path :d="d" stroke-linejoin="round" />
  </g>
</template>

<script lang="ts">
import { computed } from 'vue'
import { ValueType } from '/@/models/graphNode'
import * as helpers from '/@/utils/helpers'
import { getSurface } from '/@/components/elements/atoms/edgeAnchor'
</script>

<script setup lang="ts">
const props = defineProps<{
  type: ValueType
}>()

const fill = computed(() => helpers.GRAPH_NODE_TYPE_COLOR[props.type.type])
const d = computed(() => `M-6,-8 l6,0 ${getSurface(props.type)} l-6,0z`)
</script>
