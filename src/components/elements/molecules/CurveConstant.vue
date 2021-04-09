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
  <g :stroke-width="lineWidth * scale">
    <line :x1="from.x" :y1="from.y" :x2="to.x" :y2="from.y" />
    <line :x1="to.x" :y1="from.y" :x2="to.x" :y2="to.y" />
  </g>
</template>

<script lang="ts">
import { IVec2 } from 'okageo'
import { defineComponent, PropType } from 'vue'

export default defineComponent({
  props: {
    from: {
      type: Object as PropType<IVec2>,
      required: true,
    },
    to: {
      type: Object as PropType<IVec2>,
      required: true,
    },
    color: {
      type: String,
      default: '#fff',
    },
    scale: {
      type: Number,
      default: 1,
    },
    lineWidth: {
      type: Number,
      default: 1,
    },
  },
})
</script>
