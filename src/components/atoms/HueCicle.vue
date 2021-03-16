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
    <path
      v-for="(_p, i) in points"
      :key="i"
      :d="getD(i)"
      :stroke="colors[i]"
      :fill="colors[i]"
    />
  </g>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { hsvaToRgba, rednerRGBA } from '/@/utils/color'

export default defineComponent({
  props: {
    radius: {
      type: Number,
      default: 50,
    },
  },
  setup(props) {
    const count = 120

    const points = [...Array(count)].map((_, i) => {
      return radToP(((Math.PI * 2) / count) * i)
    })

    const colors = points.map((_p, i) => getRgb(i))

    function radToP(rad: number) {
      return {
        x: Math.cos(rad) * props.radius,
        y: Math.sin(rad) * props.radius,
      }
    }

    function getD(i: number) {
      const p1 = points[i]
      const p2 = points[(i + 1) % count]
      return `M0,0L${p1.x},${p1.y}A${props.radius},${props.radius},0,0,1,${p2.x},${p2.y}z`
    }

    function getRgb(i: number) {
      return rednerRGBA(hsvaToRgba({ h: (i * 360) / count, s: 1, v: 1, a: 1 }))
    }

    return { points, getD, colors }
  },
})
</script>
