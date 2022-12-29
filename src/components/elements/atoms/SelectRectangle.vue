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
  <rect
    :x="x"
    :y="y"
    :width="width"
    :height="height"
    fill="#1e90ff"
    fill-opacity="0.2"
    stroke="none"
  />
</template>

<script lang="ts" setup>
withDefaults(
  defineProps<{
    x?: number
    y?: number
    width?: number
    height?: number
  }>(),
  {
    x: 0,
    y: 0,
    width: 100,
    height: 100,
  }
)
</script>
