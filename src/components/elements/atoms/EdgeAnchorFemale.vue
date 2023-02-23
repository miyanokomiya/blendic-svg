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
    <g v-if="d">
      <path :d="d" stroke-linejoin="round" />
      <EdgeAnchorMale
        v-if="connected"
        :type="type"
        transform="translate(-8,0)"
      />
    </g>
    <circle v-else r="5" />
  </g>
</template>

<script lang="ts">
import { computed, withDefaults } from 'vue'
import { GRAPH_VALUE_TYPE, ValueType } from '/@/models/graphNode'
import * as helpers from '/@/utils/helpers'
</script>

<script setup lang="ts">
import EdgeAnchorMale from '/@/components/elements/atoms/EdgeAnchorMale.vue'

const props = withDefaults(
  defineProps<{
    type: ValueType
    connected?: boolean
  }>(),
  { connected: false }
)

const fill = computed(() => helpers.GRAPH_NODE_TYPE_COLOR[props.type.type])

// Supposed view box is: { x: -8, y: -8, width: 12, height: 16 }
const d = computed(() => {
  switch (props.type.type) {
    case GRAPH_VALUE_TYPE.SCALER:
      return 'M-8,-8 l12,0 l0,16 l-12,0 l6,-8z'
    case GRAPH_VALUE_TYPE.VECTOR2:
      return 'M-8,-8 l12,0 l0,16 l-12,0 l6,-4 l-6,-4 l6,-4z'
    case GRAPH_VALUE_TYPE.TRANSFORM:
      return 'M-8,-8 l12,0 l0,16 l-12,0 l0,-4 l6,0 l0,-8 l-6,0z'
    case GRAPH_VALUE_TYPE.BOOLEAN:
      return 'M-8,-8 l12,0 l0,16 l-12,0 l0,-3 l6,-8 l-6,0z'
    case GRAPH_VALUE_TYPE.OBJECT:
      return 'M-8,-8 l12,0 l0,16 l-12,0 l0,-4 a5,5,0,1,0,0,-8z'
    case GRAPH_VALUE_TYPE.D:
      return 'M-8,-8 l12,0 l0,16 l-12,0 l0,-3 a6,8,0,0,0,6,-8 l-6,0z'
    default:
      return ''
  }
})
</script>
