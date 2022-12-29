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
    <g data-type="node-body" :data-node_id="node.id">
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
        y="6"
        dominant-baseline="text-before-edge"
        font-size="16"
        :fill="textColor"
        class="view-only"
        >{{ label }}</text
      >
    </g>
    <g
      v-if="isCustomNode"
      :transform="`translate(${size.width - 28}, 6)`"
      data-type="node-custom-anchor"
      :data-node_type="node.type"
      class="node-custom-anchor"
    >
      <rect width="18" height="18" rx="4" ry="4" fill="#eee" />
      <path
        d="M4 6L14 6L9 12z"
        stroke-linejoin="round"
        stroke="none"
        fill="#000"
      />
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
            >{{ edge.label }}</text
          >
        </g>
        <circle
          data-type="node-edge-output"
          :data-node_id="node.id"
          :data-edge_key="key"
          r="10"
          fill="transparent"
          stroke="none"
          class="edge-anchor"
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
              :input-key="edge.label"
              :type="inputTypeMap[key]"
              :input="node.inputs[key]"
            />
          </g>
        </g>
        <circle
          data-type="node-edge-input"
          :data-node_id="node.id"
          :data-edge_key="key"
          r="10"
          fill="transparent"
          stroke="none"
          class="edge-anchor"
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
import { GraphNode, GraphNodeEdgePositions } from '/@/models/graphNode'
import * as helpers from '/@/utils/helpers'
import GraphNodeDataField from '/@/components/elements/GraphNodeDataField.vue'
import GraphNodeInputLabel from '/@/components/elements/GraphNodeInputLabel.vue'
import ErrorText from '/@/components/elements/atoms/ErrorText.vue'
import { mapReduce } from '/@/utils/commons'
import { getDataTypeAndValue, getInputTypes } from '/@/utils/graphNodes'
import { Size } from 'okanvas'
import { injectGetGraphNodeModuleFn } from '/@/composables/animationGraph'
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
const getGraphNodeModule = computed(injectGetGraphNodeModuleFn())

const isCustomNode = computed(
  () => getGraphNodeModule.value(props.node.type)?.struct.custom
)

const size = computed(() => {
  return helpers.getGraphNodeSize(getGraphNodeModule.value, props.node)
})
const headOutline = computed(() => {
  return getHeadOutline(size.value)
})

const outline = computed(() => {
  return getOutline(size.value)
})

const nodeStruct = computed(
  () => getGraphNodeModule.value(props.node.type)?.struct
)

const label = computed(() => nodeStruct.value?.label ?? 'Unknown')
const color = computed(() => nodeStruct.value?.color ?? '#ccc')
const textColor = computed(() => nodeStruct.value?.textColor ?? '#ff0000')

const dataPositions = computed(() =>
  helpers.getGraphNodeDataPosition(getGraphNodeModule.value, props.node)
)
const dataMap = computed(() => {
  return mapReduce(dataPositions.value, (position, key) => {
    return {
      position,
      ...getDataTypeAndValue(getGraphNodeModule.value, props.node, key),
    }
  })
})

const inputTypeMap = computed(() => {
  return getInputTypes(nodeStruct.value, props.node)
})

const GRAPH_NODE_TYPE_COLOR = helpers.GRAPH_NODE_TYPE_COLOR
const GRAPH_NODE_ROW_HEIGHT = helpers.GRAPH_NODE_ROW_HEIGHT

const outlineStroke = computed(() =>
  props.errors ? 'red' : props.selected ? settings.selectedColor : '#555'
)
const outlineStrokeWidth = computed(() =>
  props.errors ? 6 : props.selected ? 2 : 1
)
const edgeAnchorWidth = 60
</script>

<style scoped>
.edge-anchor:hover {
  transition: fill 0.2s;
  fill: #ffa07a;
}
.node-custom-anchor:hover {
  opacity: 0.8;
}
.error-message {
  background-color: var(--background);
  color: var(--text);
}
</style>
