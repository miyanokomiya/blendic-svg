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
    </g>
    <g>
      <text
        x="8"
        y="3"
        dominant-baseline="text-before-edge"
        font-size="16"
        fill="#000"
        class="view-only"
        >{{ node.type }}</text
      >
      <line y1="28" y2="28" :x2="size.width" stroke="#555" />
    </g>
    <g>
      <g
        v-for="(p, key) in inputsPosition"
        :key="key"
        :transform="`translate(${p.x}, ${p.y})`"
      >
        <text
          x="10"
          dominant-baseline="middle"
          font-size="14"
          fill="#000"
          class="view-only"
          >{{ key }}</text
        >
        <circle r="5" fill="#333" stroke="none" />
      </g>
    </g>
    <g>
      <g
        v-for="(p, key) in outputsPosition"
        :key="key"
        :transform="`translate(${p.x}, ${p.y})`"
      >
        <text
          x="-10"
          dominant-baseline="middle"
          text-anchor="end"
          font-size="14"
          fill="#000"
          class="view-only"
          >{{ key }}</text
        >
        <circle r="5" fill="#333" stroke="none" />
      </g>
    </g>
  </g>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue'
import { useSettings } from '../../composables/settings'
import { switchClick } from '/@/utils/devices'
import { GraphNode } from '/@/models/graphNode'
import * as helpers from '/@/utils/helpers'

export default defineComponent({
  props: {
    node: {
      type: Object as PropType<GraphNode>,
      required: true,
    },
    scale: { type: Number, default: 1 },
    selected: { type: Boolean, default: false },
  },
  emits: ['select', 'down-body'],
  setup(props, { emit }) {
    const { settings } = useSettings()

    const size = computed(() => {
      return helpers.getGraphNodeSize(props.node)
    })

    const outline = computed(() => {
      const s = size.value
      return helpers.d(
        [
          { x: 0, y: 0 },
          { x: s.width, y: 0 },
          { x: s.width, y: s.height },
          { x: 0, y: s.height },
        ],
        true
      )
    })

    const inputsPosition = computed(() =>
      helpers.getGraphNodeInputsPosition(props.node)
    )
    const outputsPosition = computed(() =>
      helpers.getGraphNodeOutputsPosition(props.node)
    )

    return {
      size,
      outline,
      inputsPosition,
      outputsPosition,
      outlineStroke: computed(() =>
        props.selected ? settings.selectedColor : '#555'
      ),
      outlineStrokeWidth: computed(() => (props.selected ? 2 : 1)),
      select: (e: MouseEvent) => {
        switchClick(e, {
          plain: () => emit('select', props.node.id),
          shift: () => emit('select', props.node.id, { shift: true }),
          ctrl: () => emit('select', props.node.id),
        })
      },
      downBody: () => emit('down-body', props.node.id),
    }
  },
})
</script>

<style lang="scss" scoped>
.view-only {
  pointer-events: none;
}
</style>
