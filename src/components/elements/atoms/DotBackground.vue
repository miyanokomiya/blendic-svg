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
        'background-position': `${size / 2 - x}px ${size / 2 - y}px`,
        'background-size': `${size}px ${size}px`,
      }"
    />
  </foreignObject>
</template>

<script lang="ts" setup>
withDefaults(
  defineProps<{
    x?: number
    y?: number
    width?: number
    height?: number
    size?: number
  }>(),
  {
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    size: 100,
  }
)
</script>

<style scoped>
div {
  width: 100%;
  height: 100%;
  background-repeat: repeat repeat;
  background-image: radial-gradient(
    circle,
    #000 2px,
    rgba(255, 255, 255, 0) 2px
  );
}
</style>
