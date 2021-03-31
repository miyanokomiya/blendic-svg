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
  <g>
    <path :d="d" :stroke="color" :stroke-width="scale" />
    <g v-if="showControl" stroke="#000" fill="#fff">
      <line :x1="c0.x" :y1="c0.y" :x2="c1.x" :y2="c1.y" />
      <line :x1="c2.x" :y1="c2.y" :x2="c3.x" :y2="c3.y" />
      <rect
        :x="c1.x - rectSize / 2"
        :y="c1.y - rectSize / 2"
        :width="rectSize"
        :height="rectSize"
      />
      <rect
        :x="c2.x - rectSize / 2"
        :y="c2.y - rectSize / 2"
        :width="rectSize"
        :height="rectSize"
      />
    </g>
  </g>
</template>

<script lang="ts">
import { IVec2 } from 'okageo'
import { computed, defineComponent, PropType } from 'vue'

export default defineComponent({
  props: {
    c0: {
      type: Object as PropType<IVec2>,
      required: true,
    },
    c1: {
      type: Object as PropType<IVec2>,
      required: true,
    },
    c2: {
      type: Object as PropType<IVec2>,
      required: true,
    },
    c3: {
      type: Object as PropType<IVec2>,
      required: true,
    },
    color: {
      type: String,
      default: '#fff',
    },
    showControl: {
      type: Boolean,
      default: false,
    },
    scale: {
      type: Number,
      default: 1,
    },
  },
  setup(props) {
    const d = computed(() => {
      return `M ${props.c0.x},${props.c0.y} C ${props.c1.x},${props.c1.y} ${props.c2.x},${props.c2.y} ${props.c3.x},${props.c3.y}`
    })
    const rectSize = computed(() => 8 * props.scale)

    return { d, rectSize }
  },
})
</script>
