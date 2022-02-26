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
        fill="#fafafa"
      />
      <path
        :d="headOutline"
        :stroke="outlineStroke"
        :stroke-width="outlineStrokeWidth"
        :fill="color"
      />
    </g>
    <g>
      <text
        x="8"
        y="3"
        dominant-baseline="text-before-edge"
        font-size="16"
        :fill="textColor"
        class="view-only"
        >{{ label }}</text
      >
    </g>
    <g>
      <g
        v-for="[key, edge] in Object.entries(edgePositions.outputs)"
        :key="key"
        :transform="`translate(${edge.p.x}, ${edge.p.y})`"
      >
        <g class="view-only">
          <rect
            :x="-edgeAnchorWidth"
            :y="-GRAPH_NODE_ROW_HEIGHT / 2"
            :width="edgeAnchorWidth"
            :height="GRAPH_NODE_ROW_HEIGHT"
            fill="transparent"
            stroke="none"
          />
          <text
            x="-10"
            dominant-baseline="middle"
            text-anchor="end"
            font-size="14"
            fill="#000"
            >{{ key }}</text
          >
        </g>
        <circle
          r="10"
          fill="transparent"
          stroke="none"
          class="edge-anchor"
          @mouseup.left.exact="upToEdge(key)"
          @mousedown.left.exact.prevent="downToEdge(key)"
        />
        <circle
          r="5"
          :fill="GRAPH_NODE_TYPE_COLOR[edge.type.type]"
          stroke="none"
          class="view-only"
        />
      </g>
    </g>
    <g class="view-only">
      <g
        v-for="(data, key) in dataMap"
        :key="key"
        :transform="`translate(${data.position.x}, ${data.position.y})`"
      >
        <GraphNodeDataField
          :label="key"
          :type="data.type"
          :model-value="data.value"
          @update:model-value="
            (val, seriesKey) => updateData(key, val, seriesKey)
          "
        />
      </g>
    </g>
    <g>
      <g
        v-for="[key, edge] in Object.entries(edgePositions.inputs)"
        :key="key"
        :transform="`translate(${edge.p.x}, ${edge.p.y})`"
      >
        <g class="view-only">
          <rect
            :y="-GRAPH_NODE_ROW_HEIGHT / 2"
            :width="edgeAnchorWidth"
            :height="GRAPH_NODE_ROW_HEIGHT"
            fill="transparent"
            stroke="none"
          />
          <g transform="translate(10, 0)">
            <GraphNodeInputLabel
              :input-key="key"
              :type="getInputType(key)"
              :input="node.inputs[key]"
            />
          </g>
        </g>
        <circle
          r="10"
          fill="transparent"
          stroke="none"
          class="edge-anchor"
          @mouseup.left.exact="upFromEdge(key)"
          @mousedown.left.exact.prevent="downFromEdge(key)"
        />
        <circle
          r="5"
          :fill="GRAPH_NODE_TYPE_COLOR[edge.type.type]"
          stroke="none"
          class="view-only"
        />
      </g>
    </g>
    <g v-if="errors" :transform="`translate(0, ${size.height})`">
      <ErrorText :errors="errors" />
    </g>
  </g>
</template>

<script lang="ts">
import { computed, withDefaults } from 'vue'
import { useSettings } from '../../composables/settings'
import { switchClick } from '/@/utils/devices'
import {
  GraphNode,
  GraphNodeEdgePositions,
  ValueType,
} from '/@/models/graphNode'
import * as helpers from '/@/utils/helpers'
import { add, IVec2 } from 'okageo'
import GraphNodeDataField from '/@/components/elements/GraphNodeDataField.vue'
import GraphNodeInputLabel from '/@/components/elements/GraphNodeInputLabel.vue'
import ErrorText from '/@/components/elements/atoms/ErrorText.vue'
import { mapReduce } from '/@/utils/commons'
import { getGraphNodeModule } from '/@/utils/graphNodes'
import { Size } from 'okanvas'
</script>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    node: GraphNode
    edgePositions?: GraphNodeEdgePositions
    selected?: boolean
    errors?: string[]
  }>(),
  {
    edgePositions: () => ({ inputs: {}, outputs: {} }),
    selected: false,
    errors: undefined,
  }
)

const emit = defineEmits<{
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
  (
    e: 'update:data',
    id: string,
    data: GraphNode['data'],
    seriesKey?: string
  ): void
}>()

function getHeadOutline(s: Size) {
  const r = 14
  return `M${0},${
    helpers.GRAPH_NODE_HEAD_HEIGHT
  } L${0},${r} A${r},${r} 0 0 1 ${r},${0} L${
    s.width - r
  },${0} A${r},${r} 0 0 1 ${s.width},${r} L${s.width},${
    helpers.GRAPH_NODE_HEAD_HEIGHT
  }`
}

function getOutline(s: Size) {
  const r = 8
  return `M${0},${helpers.GRAPH_NODE_HEAD_HEIGHT} L${0},${
    s.height - r
  } A${r},${r} 0 0 0 ${r},${s.height} L${s.width - r},${
    s.height
  } A${r},${r} 0 0 0 ${s.width},${s.height - r} L${s.width},${
    helpers.GRAPH_NODE_HEAD_HEIGHT
  }`
}

const { settings } = useSettings()

const size = computed(() => {
  return helpers.getGraphNodeSize(props.node)
})
const headOutline = computed(() => {
  return getHeadOutline(size.value)
})

const outline = computed(() => {
  return getOutline(size.value)
})

const nodeStruct = computed(() => getGraphNodeModule(props.node.type).struct)

const label = computed(() => nodeStruct.value.label ?? props.node.type)
const color = computed(() => nodeStruct.value.color ?? '#fafafa')
const textColor = computed(() => nodeStruct.value.textColor ?? '#000')

const dataPositions = computed(() =>
  helpers.getGraphNodeDataPosition(props.node)
)
const dataMap = computed(() => {
  const dataStruct = nodeStruct.value.data
  return mapReduce(dataPositions.value, (position, key) => {
    return {
      position,
      type: (dataStruct as any)[key].type as ValueType,
      value: props.node.data[key],
    }
  })
})

function updateData(key: string, val: any, seriesKey?: string) {
  emit(
    'update:data',
    props.node.id,
    { ...props.node.data, [key]: val },
    seriesKey
  )
}

function getInputType(key: string): ValueType {
  return (nodeStruct.value.inputs as any)[key].type
}

const GRAPH_NODE_TYPE_COLOR = helpers.GRAPH_NODE_TYPE_COLOR
const GRAPH_NODE_ROW_HEIGHT = helpers.GRAPH_NODE_ROW_HEIGHT

const outlineStroke = computed(() =>
  props.errors ? 'red' : props.selected ? settings.selectedColor : '#555'
)
const outlineStrokeWidth = computed(() =>
  props.errors ? 6 : props.selected ? 2 : 1
)
const edgeAnchorWidth = 60

function downBody(e: MouseEvent) {
  switchClick(e, {
    plain: () => emit('down-body', props.node.id),
    shift: () => emit('down-body', props.node.id, { shift: true }),
    ctrl: () => emit('down-body', props.node.id),
  })
}
function downFromEdge(key: string) {
  emit('down-edge', {
    type: 'draft-from',
    from: add(props.node.position, props.edgePositions.inputs[key].p),
    to: { nodeId: props.node.id, key },
  })
}
function downToEdge(key: string) {
  emit('down-edge', {
    type: 'draft-to',
    from: { nodeId: props.node.id, key },
    to: add(props.node.position, props.edgePositions.outputs[key].p),
  })
}
function upFromEdge(key: string) {
  emit('up-edge', { nodeId: props.node.id, type: 'input', key })
}
function upToEdge(key: string) {
  emit('up-edge', { nodeId: props.node.id, type: 'output', key })
}
</script>

<style scoped>
.view-only {
  pointer-events: none;
}
.edge-anchor:hover {
  transition: fill 0.2s;
  fill: #ffa07a;
}
.error-message {
  background-color: #fff;
  color: #000;
}
</style>
