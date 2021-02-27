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
  <g fill="black" stroke="black">
    <g
      :transform="`translate(${origin.x}, ${origin.y}) rotate(${rotate}) scale(${scale})`"
    >
      <circle r="2" />
    </g>
    <line
      :x1="origin.x"
      :y1="origin.y"
      :x2="current.x"
      :y2="current.y"
      :stroke-width="scale"
      :stroke-dasharray="`${2 * scale} ${2 * scale}`"
    />
    <g
      :transform="`translate(${current.x}, ${current.y}) rotate(${rotate}) scale(${scale})`"
    >
      <circle r="2" />
      <g :transform="`rotate(${side ? 90 : 0})`">
        <path d="M-20,0L-10,-10L-10,10z" />
        <path d="M20,0L10,-10L10,10z" />
      </g>
    </g>
  </g>
</template>

<script lang="ts">
import { getRadian, IVec2 } from 'okageo'
import { defineComponent, PropType, computed } from 'vue'

export default defineComponent({
  props: {
    origin: {
      type: Object as PropType<IVec2>,
      required: true,
    },
    current: {
      type: Object as PropType<IVec2>,
      required: true,
    },
    scale: {
      type: Number,
      required: true,
    },
    side: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    return {
      rotate: computed(
        () => (getRadian(props.current, props.origin) / Math.PI) * 180
      ),
    }
  },
})
</script>

<style lang="scss" scoped></style>
