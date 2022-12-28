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
  <g :stroke="color" :stroke-width="lineWidth * scale" fill="none">
    <!-- horizon before from -->
    <line
      v-if="first"
      :x1="curve.from.x - 20000"
      :y1="curve.from.y"
      :x2="curve.from.x"
      :y2="curve.from.y"
    />
    <!-- horizon after to -->
    <line
      v-if="last"
      :x1="curve.from.x"
      :y1="curve.from.y"
      :x2="curve.from.x + 20000"
      :y2="curve.from.y"
    />
    <template v-else-if="curve.to">
      <CurveBezier3Vue
        v-if="curve.name === 'bezier3'"
        :c0="curve.from"
        :c1="curve.fixedC1"
        :c2="curve.fixedC2"
        :c3="curve.to"
        :color="color"
        :scale="scale"
        :line-width="lineWidth"
      />
      <g v-else-if="curve.name === 'constant'">
        <CurveConstant
          :from="curve.from"
          :to="curve.to"
          :color="color"
          :scale="scale"
          :line-width="lineWidth"
        />
      </g>
      <line
        v-else
        :x1="curve.from.x"
        :y1="curve.from.y"
        :x2="curve.to.x"
        :y2="curve.to.y"
        :stroke-width="lineWidth * scale"
      />
    </template>
  </g>
</template>

<script lang="ts" setup>
import CurveBezier3Vue from '/@/components/elements/molecules/CurveBezier3.vue'
import CurveConstant from '/@/components/elements/molecules/CurveConstant.vue'
import { CurveInfo } from '/@/utils/graphCurves'

withDefaults(
  defineProps<{
    curve: CurveInfo
    first?: boolean
    last?: boolean
    color?: string
    scale?: number
    lineWidth?: number
  }>(),
  {
    first: false,
    last: false,
    color: '#fff',
    scale: 1,
    lineWidth: 1,
  }
)
</script>
