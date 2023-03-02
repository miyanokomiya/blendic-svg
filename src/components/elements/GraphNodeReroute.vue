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
  <g :transform="`translate(${node.position.x}, ${node.position.y})`">
    <title>{{ node.type }}</title>
    <g data-type="node-body" :data-node_id="node.id">
      <path
        :d="outline"
        :stroke="outlineStroke"
        :stroke-width="outlineStrokeWidth"
        fill="#ddd"
      />
    </g>
    <g :transform="`translate(${outputEdge.p.x}, ${outputEdge.p.y})`">
      <g
        class="edge-anchor"
        data-type="node-edge-output"
        :data-node_id="node.id"
        data-edge_key="value"
      >
        <circle r="8" fill="transparent" stroke="none" />
      </g>
      <EdgeAnchorMale :type="outputEdge.type" class="view-only" />
    </g>
    <g :transform="`translate(${inputEdge.p.x}, ${inputEdge.p.y})`">
      <g
        class="edge-anchor"
        data-type="node-edge-input"
        :data-node_id="node.id"
        data-edge_key="value"
      >
        <circle r="8" fill="transparent" stroke="none" />
      </g>
      <EdgeAnchorFemale :type="inputEdge.type" class="view-only" />
    </g>
  </g>
</template>

<script lang="ts">
import { computed, withDefaults } from 'vue'
import { GraphNodeEdgePositions, GraphNodeReroute } from '/@/models/graphNode'
import { useSettings } from '/@/composables/settings'

const { settings } = useSettings()
</script>

<script setup lang="ts">
import EdgeAnchorMale from '/@/components/elements/atoms/EdgeAnchorMale.vue'
import EdgeAnchorFemale from '/@/components/elements/atoms/EdgeAnchorFemale.vue'

const props = withDefaults(
  defineProps<{
    node: GraphNodeReroute
    edgePositions: GraphNodeEdgePositions
    selected?: boolean
    errors?: string[]
  }>(),
  {
    selected: false,
    errors: undefined,
  }
)

const inputEdge = computed(() => {
  return props.edgePositions.inputs.value
})
const outputEdge = computed(() => {
  return props.edgePositions.outputs.value
})

const outline = computed(() => {
  const w = outputEdge.value.p.x - inputEdge.value.p.x
  return `M0,-2 Q${w},-2 ${w},10 T${0},22 z`
})
const outlineStroke = computed(() =>
  props.errors ? 'red' : props.selected ? settings.selectedColor : '#555'
)
const outlineStrokeWidth = computed(() =>
  props.errors ? 6 : props.selected ? 3 : 2
)
</script>

<style scoped>
.edge-anchor:hover circle {
  transition: fill 0.2s;
  fill: #ffa07a;
}
</style>
