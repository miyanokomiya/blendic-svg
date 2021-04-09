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

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import CurveBezier3Vue from '/@/components/elements/molecules/CurveBezier3.vue'
import CurveConstant from '/@/components/elements/molecules/CurveConstant.vue'
import { CurveInfo } from '/@/utils/graphCurves'

export default defineComponent({
  components: { CurveBezier3Vue, CurveConstant },
  props: {
    curve: {
      type: Object as PropType<CurveInfo>,
      required: true,
    },
    first: {
      type: Boolean,
      default: false,
    },
    last: {
      type: Boolean,
      default: false,
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
