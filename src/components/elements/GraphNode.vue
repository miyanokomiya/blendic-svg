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
    <g @click="select" @mousedown.exact="downBody">
      <path
        :d="outline"
        :stroke="outlineStroke"
        :stroke-width="outlineStrokeWidth"
        fill="#eee"
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
        >{{ node.type }}</text
      >
      <line y1="28" y2="28" :x2="size.width" stroke="#555" />
    </g>
    <g>
      <g
        v-for="(p, key) in edgePositions.outputs"
        :key="key"
        :transform="`translate(${p.x}, ${p.y})`"
      >
        <g
          @mouseup.left.exact="upToEdge(key)"
          @mousedown.left.exact.prevent="downToEdge(key)"
        >
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
            class="view-only"
            >{{ key }}</text
          >
          <circle r="8" fill="transparent" stroke="none" />
        </g>
        <circle r="5" fill="#333" stroke="none" class="view-only" />
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
          @update:modelValue="
            (val, seriesKey) => updateData(key, val, seriesKey)
          "
        />
      </g>
    </g>
    <g>
      <g
        v-for="(p, key) in edgePositions.inputs"
        :key="key"
        :transform="`translate(${p.x}, ${p.y})`"
      >
        <g
          @mouseup.left.exact="upFromEdge(key)"
          @mousedown.left.exact.prevent="downFromEdge(key)"
        >
          <rect
            :y="-GRAPH_NODE_ROW_HEIGHT / 2"
            :width="edgeAnchorWidth"
            :height="GRAPH_NODE_ROW_HEIGHT"
            fill="transparent"
            stroke="none"
          />
          <text x="10" dominant-baseline="middle" font-size="14" fill="#000">{{
            key
          }}</text>
          <circle r="8" fill="transparent" stroke="none" />
        </g>
        <circle r="5" fill="#333" stroke="none" class="view-only" />
      </g>
    </g>
  </g>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue'
import { useSettings } from '../../composables/settings'
import { switchClick } from '/@/utils/devices'
import { GraphNode, GraphNodeEdgePositions } from '/@/models/graphNode'
import * as helpers from '/@/utils/helpers'
import { add } from 'okageo'
import GraphNodeDataField from '/@/components/elements/GraphNodeDataField.vue'
import { mapReduce } from '/@/utils/commons'
import { getGraphNodeModule } from '/@/utils/graphNodes'

export default defineComponent({
  components: {
    GraphNodeDataField,
  },
  props: {
    node: {
      type: Object as PropType<GraphNode>,
      required: true,
    },
    edgePositions: {
      type: Object as PropType<GraphNodeEdgePositions>,
      default: () => ({}),
    },
    selected: { type: Boolean, default: false },
  },
  emits: ['select', 'down-body', 'down-edge', 'up-edge', 'update:data'],
  setup(props, { emit }) {
    const { settings } = useSettings()

    const size = computed(() => {
      return helpers.getGraphNodeSize(props.node)
    })

    const headOutline = computed(() => {
      const s = size.value

      const r = 14
      return `M${0},${
        helpers.GRAPH_NODE_HEAD_HEIGHT
      } L${0},${r} A${r},${r} 0 0 1 ${r},${0} L${
        s.width - r
      },${0} A${r},${r} 0 0 1 ${s.width},${r} L${s.width},${
        helpers.GRAPH_NODE_HEAD_HEIGHT
      }`
    })

    const outline = computed(() => {
      const s = size.value
      return helpers.d([
        { x: 0, y: helpers.GRAPH_NODE_HEAD_HEIGHT },
        { x: 0, y: s.height },
        { x: s.width, y: s.height },
        { x: s.width, y: helpers.GRAPH_NODE_HEAD_HEIGHT },
      ])
    })

    const color = computed(
      () => getGraphNodeModule(props.node.type).struct.color ?? '#eee'
    )
    const textColor = computed(
      () => getGraphNodeModule(props.node.type).struct.textColor ?? '#000'
    )

    const dataPositions = computed(() =>
      helpers.getGraphNodeDataPosition(props.node)
    )
    const dataMap = computed(() => {
      const dataStruct = getGraphNodeModule(props.node.type).struct.data
      return mapReduce(dataPositions.value, (position, key) => {
        return {
          position,
          type: (dataStruct as any)[key].type as string,
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

    return {
      GRAPH_NODE_ROW_HEIGHT: helpers.GRAPH_NODE_ROW_HEIGHT,
      color,
      textColor,
      size,
      headOutline,
      outline,
      outlineStroke: computed(() =>
        props.selected ? settings.selectedColor : '#555'
      ),
      edgeAnchorWidth: computed(() => 30),
      outlineStrokeWidth: computed(() => (props.selected ? 2 : 1)),
      dataMap,
      select: (e: MouseEvent) => {
        switchClick(e, {
          plain: () => emit('select', props.node.id),
          shift: () => emit('select', props.node.id, { shift: true }),
          ctrl: () => emit('select', props.node.id),
        })
      },
      downBody: () => emit('down-body', props.node.id),
      downFromEdge: (key: string) =>
        emit('down-edge', {
          type: 'draft-from',
          from: add(props.node.position, props.edgePositions.inputs[key]),
          to: { nodeId: props.node.id, key },
        }),
      downToEdge: (key: string) =>
        emit('down-edge', {
          type: 'draft-to',
          from: { nodeId: props.node.id, key },
          to: add(props.node.position, props.edgePositions.outputs[key]),
        }),
      upFromEdge: (key: string) =>
        emit('up-edge', { nodeId: props.node.id, type: 'input', key }),
      upToEdge: (key: string) =>
        emit('up-edge', { nodeId: props.node.id, type: 'output', key }),
      updateData,
    }
  },
})
</script>

<style lang="scss" scoped>
.view-only {
  pointer-events: none;
}
</style>
