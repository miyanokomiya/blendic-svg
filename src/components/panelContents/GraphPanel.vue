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
    <div v-if="keyframe && selectedKey">
      <h4>Interpolation</h4>
      <SelectField
        :model-value="keyframe.points[selectedKey].curve.name"
        :options="curveOptions"
        no-placeholder
        @update:modelValue="updateCurve"
      />
    </div>
    <div v-else>
      <p>No Item</p>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue'
import {
  CurveName,
  getCurve,
  KeyframeBase,
  KeyframeSelectedState,
} from '/@/models/keyframe'
import SelectField from '/@/components/atoms/SelectField.vue'
import { curveItems } from '/@/utils/keyframes/core'
import { updatePoints } from '/@/utils/keyframes'

const curveOptions = curveItems.map((item) => ({
  label: item.label,
  value: item.name,
}))

export default defineComponent({
  components: { SelectField },
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

    function updateCurve(curveName: CurveName) {
      if (!props.keyframe || !props.selectedState) return
      emit(
        'update',
        updatePoints(props.keyframe, props.selectedState, (p) => ({
          ...p,
          curve: getCurve(curveName),
        }))
      )
    }

    return {
      selectedKey,
      curveOptions,
      updateCurve,
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
</style>
