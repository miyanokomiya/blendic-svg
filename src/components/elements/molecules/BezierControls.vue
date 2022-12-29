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
    <g stroke="#000" fill="#fff" class="view-only">
      <line
        v-if="controlIn"
        :x1="controlIn.x"
        :y1="controlIn.y"
        :x2="c0.x"
        :y2="c0.y"
      />
      <line
        v-if="controlOut"
        :x1="c0.x"
        :y1="c0.y"
        :x2="controlOut.x"
        :y2="controlOut.y"
      />
    </g>
    <g stroke="#000" fill="#fff">
      <rect
        v-if="controlIn"
        :x="controlIn.x - rectSize / 2"
        :y="controlIn.y - rectSize / 2"
        :width="rectSize"
        :height="rectSize"
      />
      <rect
        v-if="controlOut"
        :x="controlOut.x - rectSize / 2"
        :y="controlOut.y - rectSize / 2"
        :width="rectSize"
        :height="rectSize"
      />
    </g>
    <g fill="transparent">
      <rect
        v-if="controlIn"
        :x="controlIn.x - rectSize"
        :y="controlIn.y - rectSize"
        :width="rectSize * 2"
        :height="rectSize * 2"
        data-type="bezier-control"
        :data-id="pointId"
        :data-key="pointKey"
        data-control_in="true"
      />
      <rect
        v-if="controlOut"
        :x="controlOut.x - rectSize"
        :y="controlOut.y - rectSize"
        :width="rectSize * 2"
        :height="rectSize * 2"
        data-type="bezier-control"
        :data-id="pointId"
        :data-key="pointKey"
        data-control_out="true"
      />
    </g>
  </g>
</template>

<script lang="ts" setup>
import { IVec2 } from 'okageo'
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    pointId: string
    pointKey: string
    c0: IVec2
    controlIn?: IVec2 | undefined
    controlOut?: IVec2 | undefined
    color?: string
    scale?: number
  }>(),
  {
    controlIn: undefined,
    controlOut: undefined,
    color: '#fff',
    scale: 1,
  }
)

const rectSize = computed(() => 10 * props.scale)
</script>
