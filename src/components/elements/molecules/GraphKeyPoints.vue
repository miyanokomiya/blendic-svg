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
    <g class="view-only">
      <GraphCurveLines
        :curves="curves"
        :color="color"
        :scale="scale"
        :line-width="lineWidth"
      />
    </g>
    <g>
      <g v-for="curve in curves" :key="curve.id">
        <title>{{ pointKey }}</title>
        <circle
          :cx="curve.from.x"
          :cy="curve.from.y"
          :r="radius * scale"
          :stroke="curve.selected ? '#000' : '#777'"
          :stroke-width="scale"
          :fill="curve.selected ? selectedColor : color"
          data-type="keyframe-prop"
          :data-id="curve.id"
          :data-key="pointKey"
        />
      </g>
    </g>
    <g>
      <g v-for="curve in curves" :key="curve.id">
        <BezierControls
          v-if="curve.selected"
          :point-id="curve.id"
          :point-key="pointKey"
          :c0="curve.from"
          :control-in="curve.controlIn"
          :control-out="curve.controlOut"
          :color="color"
          :scale="scale"
        >
        </BezierControls>
      </g>
    </g>
  </g>
</template>

<script lang="ts" setup>
import BezierControls from '/@/components/elements/molecules/BezierControls.vue'
import GraphCurveLines from '/@/components/elements/molecules/GraphCurveLines.vue'
import { computed } from 'vue'
import { IdMap } from '/@/models'
import { KeyframeBase, KeyframeSelectedState } from '/@/models/keyframe'
import { useSettings } from '/@/composables/settings'
import { getCurves } from '/@/utils/graphCurves'
import { injectScale } from '/@/composables/canvas'

const props = withDefaults(
  defineProps<{
    pointKey: string
    keyframes: KeyframeBase[]
    selectedStateMap?: IdMap<KeyframeSelectedState>
    color?: string
    focused?: boolean
  }>(),
  {
    selectedStateMap: () => ({}),
    color: '#fff',
    focused: false,
  }
)

const { settings } = useSettings()

const curves = computed(() =>
  getCurves({
    keyframes: props.keyframes,
    selectedStateMap: props.selectedStateMap,
    pointKey: props.pointKey,
    valueWidth: settings.graphValueWidth,
  })
)

const getScale = injectScale()

const radius = computed(() => (props.focused ? 6.5 : 5))
const lineWidth = computed(() => (props.focused ? 2.5 : 1))

const scale = computed(getScale)
const selectedColor = computed(() => settings.selectedColor)
</script>
