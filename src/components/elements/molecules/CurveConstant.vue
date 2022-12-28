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

<script lang="ts" setup>
import { IVec2 } from 'okageo'

withDefaults(
  defineProps<{
    from: IVec2
    to: IVec2
    color?: string
    scale?: number
    lineWidth?: number
  }>(),
  {
    color: '#fff',
    scale: 1,
    lineWidth: 1,
  }
)
</script>
