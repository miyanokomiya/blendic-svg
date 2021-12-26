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
    :title="node.type"
    :transform="`translate(${node.position.x}, ${node.position.y})`"
  >
    <g @mousedown.left="downBody">
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
        @mouseup.left.exact="upToEdge"
        @mousedown.left.exact.prevent="downToEdge"
      >
        <circle r="8" fill="transparent" stroke="none" />
      </g>
      <circle r="4.5" :fill="typeColor" stroke="none" class="view-only" />
    </g>
    <g :transform="`translate(${inputEdge.p.x}, ${inputEdge.p.y})`">
      <g
        class="edge-anchor"
        @mouseup.left.exact="upFromEdge"
        @mousedown.left.exact.prevent="downFromEdge"
      >
        <circle r="8" fill="transparent" stroke="none" />
      </g>
      <circle r="4.5" :fill="typeColor" stroke="none" class="view-only" />
    </g>
  </g>
</template>

<script lang="ts">
import { computed, withDefaults } from 'vue'
import { add, IVec2 } from 'okageo'
import { GraphNodeEdgePositions, GraphNodeReroute } from '/@/models/graphNode'
import { switchClick } from '/@/utils/devices'
import * as helpers from '/@/utils/helpers'
import { useSettings } from '../../composables/settings'

const { settings } = useSettings()
</script>

<script setup lang="ts">
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

const typeColor = computed(
  () =>
    helpers.GRAPH_NODE_TYPE_COLOR[props.edgePositions.inputs.value.type.type]
)
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

const emits = defineEmits<{
  (e: 'down-body', id: string, option?: { shift?: boolean }): void
  (
    e: 'down-edge',
    arg:
      | {
          type: 'draft-from' | 'draft-to'
          from: IVec2
          to: { nodeId: string; key: string }
        }
      | {
          type: 'draft-from' | 'draft-to'
          from: { nodeId: string; key: string }
          to: IVec2
        }
  ): void
  (
    e: 'up-edge',
    arg: {
      type: 'input' | 'output'
      nodeId: string
      key: string
    }
  ): void
}>()

function downBody(e: MouseEvent) {
  switchClick(e, {
    plain: () => emits('down-body', props.node.id),
    shift: () => emits('down-body', props.node.id, { shift: true }),
    ctrl: () => emits('down-body', props.node.id),
  })
}

function downFromEdge() {
  emits('down-edge', {
    type: 'draft-from',
    from: add(props.node.position, props.edgePositions.inputs.value.p),
    to: { nodeId: props.node.id, key: 'value' },
  })
}
function downToEdge() {
  emits('down-edge', {
    type: 'draft-to',
    from: { nodeId: props.node.id, key: 'value' },
    to: add(props.node.position, props.edgePositions.outputs.value.p),
  })
}
function upFromEdge() {
  emits('up-edge', { nodeId: props.node.id, type: 'input', key: 'value' })
}
function upToEdge() {
  emits('up-edge', { nodeId: props.node.id, type: 'output', key: 'value' })
}
</script>

<style scoped>
.view-only {
  pointer-events: none;
}
.edge-anchor:hover circle {
  transition: fill 0.2s;
  fill: #ffa07a;
}
</style>
