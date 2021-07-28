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
  <g :transform="`translate(${origin.x}, ${origin.y}) rotate(${rotate})`">
    <g
      :stroke-width="2 * scale"
      :stroke-dasharray="`${2 * scale},${2 * scale}`"
    >
      <line x1="-50" x2="50" stroke="red" />
      <line y1="-50" y2="50" stroke="green" />
    </g>
    <path d="M50,0 L40,-5 L40,5z" fill="red" />
    <path d="M0,50 L-5,40 L5,40z" fill="green" />
  </g>
</template>

<script lang="ts">
import { IVec2 } from 'okageo'
import { defineComponent, PropType, computed } from 'vue'
import { injectScale } from '/@/composables/canvas'

export default defineComponent({
  props: {
    origin: {
      type: Object as PropType<IVec2>,
      required: true,
    },
    radian: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const scale = computed(injectScale())
    return {
      scale,
      rotate: computed(() => (props.radian * 180) / Math.PI),
    }
  },
})
</script>
