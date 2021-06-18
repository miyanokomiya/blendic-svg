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
    stroke="black"
    :fill="fill"
    :stroke-width="1.2 * Math.min(scale, 1)"
    :title="node.type"
  >
    <g @click="select">
      <path :d="outline" stroke="#555" fill="eee" />
    </g>
    <text fill="#000">{{ node.type }}</text>
  </g>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue'
import { useSettings } from '../../composables/settings'
import { switchClick } from '/@/utils/devices'
import { GraphNode } from '/@/models/graphNode'
import * as helpers from '/@/utils/helpers'
import { add } from 'okageo'

export default defineComponent({
  props: {
    node: {
      type: Object as PropType<GraphNode>,
      required: true,
    },
    scale: { type: Number, default: 1 },
    selected: { type: Boolean, default: false },
  },
  emits: ['select'],
  setup(props, { emit }) {
    const { settings } = useSettings()

    const outline = computed(() => {
      return helpers.d(
        [
          props.node.position,
          add(props.node.position, { x: 100, y: 0 }),
          add(props.node.position, { x: 100, y: 200 }),
          add(props.node.position, { x: 0, y: 200 }),
        ],
        true
      )
    })

    return {
      outline,
      fill: computed(() => (props.selected ? settings.selectedColor : '#ddd')),
      select: (e: MouseEvent) => {
        switchClick(e, {
          plain: () => emit('select', props.node.id),
          shift: () => emit('select', props.node.id, { shift: true }),
          ctrl: () => emit('select', props.node.id),
        })
      },
    }
  },
})
</script>

<style lang="scss" scoped>
.view-only {
  pointer-events: none;
}
</style>
