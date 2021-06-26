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
  <foreignObject :x="x" :y="y" :width="width" :height="height">
    <div
      xmlns="http://www.w3.org/1999/xhtml"
      :style="{
        'background-position': `${-x}px ${-y}px`,
      }"
    />
  </foreignObject>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  props: {
    x: {
      type: Number,
      default: 0,
    },
    y: {
      type: Number,
      default: 0,
    },
    width: {
      type: Number,
      default: 100,
    },
    height: {
      type: Number,
      default: 100,
    },
  },
})
</script>

<style lang="scss" scoped>
div {
  width: 100%;
  height: 100%;
  background-size: 20px 20px;
  background-repeat: repeat repeat;
  background-image: radial-gradient(circle, #000 1px, rgba(#fff, 0) 1px);
}
</style>
