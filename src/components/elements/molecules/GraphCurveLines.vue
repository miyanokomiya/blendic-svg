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
      />
    </g>
  </g>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import GraphCurveLine from '/@/components/elements/molecules/GraphCurveLine.vue'
import { IdMap } from '/@/models'
import { CurveInfo } from '/@/utils/graphCurves'

export default defineComponent({
  components: { GraphCurveLine },
  props: {
    curves: {
      type: Object as PropType<IdMap<CurveInfo>>,
      required: true,
    },
    color: {
      type: String,
      default: '#fff',
    },
    scale: {
      type: Number,
      default: 1,
    },
  },
})
</script>
