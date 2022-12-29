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
  <g class="fill-text stroke-text">
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
  </g>
</template>

<script lang="ts" setup>
import { getRadian, IVec2 } from 'okageo'
import { computed } from 'vue'
import { injectScale } from '/@/composables/canvas'

const props = defineProps<{
  origin: IVec2
  current: IVec2
}>()

const getScale = injectScale()

const scale = computed(getScale)

const rotate = computed(
  () => (getRadian(props.current, props.origin) / Math.PI) * 180
)
</script>
