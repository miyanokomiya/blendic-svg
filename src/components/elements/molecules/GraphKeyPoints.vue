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
          @click.exact="select(curve.id, curve.keyframeName)"
          @click.shift.exact="shiftSelect(curve.id, curve.keyframeName)"
        />
      </g>
    </g>
    <g>
      <g v-for="curve in curves" :key="curve.id">
        <BezierControls
          v-if="curve.selected"
          :c0="curve.from"
          :control-in="curve.controlIn"
          :control-out="curve.controlOut"
          :color="color"
          :scale="scale"
          @down-control-in="downControl(curve.id, { controlIn: true })"
          @down-control-out="downControl(curve.id, { controlOut: true })"
        >
        </BezierControls>
      </g>
    </g>
  </g>
</template>

<script lang="ts">
import { computed, defineComponent, inject, PropType } from 'vue'
import { IdMap } from '/@/models'
import {
  CurveSelectedState,
  KeyframeBase,
  KeyframeName,
  KeyframeSelectedState,
} from '/@/models/keyframe'
import BezierControls from '/@/components/elements/molecules/BezierControls.vue'
import GraphCurveLines from '/@/components/elements/molecules/GraphCurveLines.vue'
import { useSettings } from '/@/composables/settings'
import { getCurves } from '/@/utils/graphCurves'

export default defineComponent({
  components: {
    BezierControls,
    GraphCurveLines,
  },
  props: {
    pointKey: {
      type: String,
      required: true,
    },
    keyframes: {
      type: Array as PropType<KeyframeBase[]>,
      required: true,
    },
    selectedStateMap: {
      type: Object as PropType<IdMap<KeyframeSelectedState>>,
      default: () => ({}),
    },
    color: {
      type: String,
      default: '#fff',
    },
    focused: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['select', 'shift-select', 'down-control'],
  setup(props, { emit }) {
    const { settings } = useSettings()

    const curves = computed(() =>
      getCurves({
        keyframes: props.keyframes,
        selectedStateMap: props.selectedStateMap,
        pointKey: props.pointKey,
        valueWidth: settings.graphValueWidth,
      })
    )

    function select(id: string, keyframeName: KeyframeName) {
      emit('select', id, {
        name: keyframeName,
        props: { [props.pointKey]: true },
      } as KeyframeSelectedState)
    }
    function shiftSelect(id: string, keyframeName: KeyframeName) {
      emit('shift-select', id, {
        name: keyframeName,
        props: { [props.pointKey]: true },
      } as KeyframeSelectedState)
    }

    function downControl(keyframeId: string, state: CurveSelectedState) {
      emit('down-control', keyframeId, props.pointKey, state)
    }

    const getScale = inject<() => number>('getScale', () => 1)

    const radius = computed(() => (props.focused ? 6.5 : 5))
    const lineWidth = computed(() => (props.focused ? 2.5 : 1))

    return {
      scale: computed(getScale),
      radius,
      lineWidth,
      selectedColor: computed(() => settings.selectedColor),
      curves,
      select,
      shiftSelect,
      downControl,
    }
  },
})
</script>

<style lang="scss" scoped>
.view-only {
  pointer-events: none;
}
</style>
