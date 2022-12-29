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
    <g v-for="curve in curves" :key="curve.id">
      <GraphCurveLine
        :curve="curve"
        :color="color"
        :scale="scale"
        :first="curve.first"
        :last="curve.last"
        :line-width="lineWidth"
      />
    </g>
  </g>
</template>

<script lang="ts" setup>
import GraphCurveLine from '/@/components/elements/molecules/GraphCurveLine.vue'
import { IdMap } from '/@/models'
import { CurveInfo } from '/@/utils/graphCurves'

withDefaults(
  defineProps<{
    curves: IdMap<CurveInfo>
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
