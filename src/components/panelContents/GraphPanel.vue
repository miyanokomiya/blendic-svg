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
  <div class="graph-panel-wrapper">
    <BlockField label="Value Scale">
      <SliderInput v-model="valueWidth" :min="0.5" :max="10" />
    </BlockField>
    <hr />
    <template v-if="targetPoint">
      <BlockField label="Interpolation">
        <SelectField
          :model-value="targetPoint.curve.name"
          :options="curveOptions"
          no-placeholder
          @update:modelValue="updateCurveName"
        />
      </BlockField>
      <BlockField label="Value">
        <SliderInput
          :model-value="targetPoint.value"
          @update:modelValue="updateCurveValue"
        />
      </BlockField>
    </template>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue'
import {
  CurveName,
  getCurve,
  KeyframeBase,
  KeyframePoint,
  KeyframeSelectedState,
} from '/@/models/keyframe'
import BlockField from '/@/components/atoms/BlockField.vue'
import SelectField from '/@/components/atoms/SelectField.vue'
import SliderInput from '/@/components/atoms/SliderInput.vue'
import { curveItems } from '/@/utils/keyframes/core'
import { updatePoints } from '/@/utils/keyframes'
import { useSettings } from '/@/composables/settings'

const curveOptions = curveItems.map((item) => ({
  label: item.label,
  value: item.name,
}))

export default defineComponent({
  components: { BlockField, SelectField, SliderInput },
  props: {
    keyframe: {
      type: Object as PropType<KeyframeBase | undefined>,
      default: undefined,
    },
    selectedState: {
      type: Object as PropType<KeyframeSelectedState | undefined>,
      default: undefined,
    },
  },
  emits: ['update'],
  setup(props, { emit }) {
    const selectedKey = computed(() => {
      if (!props.selectedState) return
      return Object.keys(props.selectedState.props)[0]
    })

    const targetPoint = computed(() => {
      if (!selectedKey.value) return
      return props.keyframe?.points[selectedKey.value]
    })

    function updateCurve(
      updateFn: (p: KeyframePoint) => KeyframePoint,
      seriesKey?: string
    ) {
      if (!props.keyframe || !props.selectedState) return
      emit(
        'update',
        updatePoints(props.keyframe, props.selectedState, updateFn),
        seriesKey
      )
    }

    function updateCurveName(curveName: CurveName) {
      updateCurve((p) => ({
        ...p,
        curve: getCurve(curveName),
      }))
    }

    function updateCurveValue(value: number, seriesKey?: string) {
      updateCurve(
        (p) => ({
          ...p,
          value,
        }),
        seriesKey
      )
    }

    const { settings } = useSettings()

    const valueWidth = computed({
      get(): number {
        return settings.graphValueWidth
      },
      set(val: number) {
        settings.graphValueWidth = val
      },
    })

    return {
      targetPoint,
      curveOptions,
      updateCurveName,
      updateCurveValue,
      valueWidth,
    }
  },
})
</script>

<style lang="scss" scoped>
h4 {
  text-align: left;
  margin-bottom: 8px;
}
.graph-panel-wrapper {
  padding: 10px;
}
hr {
  margin: 10px 0;
}
</style>
