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
  <div>
    <InlineField label="Target" :label-width="labelWidth">
      <SelectField
        :model-value="modelValue.targetId"
        :options="boneOptions"
        @update:modelValue="updateTargetId"
      />
    </InlineField>
    <InlineField label="Pole Target" :label-width="labelWidth">
      <SelectField
        :model-value="modelValue.poleTargetId"
        :options="boneOptions"
        @update:modelValue="updatePoleTargetId"
      />
    </InlineField>
    <InlineField label="Chain Length" :label-width="labelWidth">
      <SliderInput
        :model-value="modelValue.chainLength"
        integer
        :min="0"
        @update:modelValue="updateChainLength"
      />
    </InlineField>
    <InlineField label="Iterations" :label-width="labelWidth">
      <SliderInput
        :model-value="modelValue.iterations"
        integer
        :min="0"
        :max="500"
        @update:modelValue="updateIterations"
      />
    </InlineField>
    <InlineField label="Influence" :label-width="labelWidth">
      <SliderInput
        :model-value="modelValue.influence"
        :min="0"
        :max="1"
        @update:modelValue="updateInfluence"
      />
    </InlineField>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { BoneConstraintOptions } from '/@/utils/constraints'
import SliderInput from '/@/components/atoms/SliderInput.vue'
import SelectField from '/@/components/atoms/SelectField.vue'
import InlineField from '/@/components/atoms/InlineField.vue'

export default defineComponent({
  components: { SliderInput, SelectField, InlineField },
  props: {
    modelValue: {
      type: Object as PropType<BoneConstraintOptions['IK']>,
      required: true,
    },
    boneOptions: {
      type: Array as PropType<{ value: string; label: string }[]>,
      required: true,
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    function emitUpdated(
      val: Partial<BoneConstraintOptions['IK']>,
      seriesKey?: string
    ) {
      emit('update:modelValue', { ...props.modelValue, ...val }, seriesKey)
    }

    return {
      labelWidth: '100px',
      updateTargetId(val: string) {
        emitUpdated({ targetId: val })
      },
      updatePoleTargetId(val: string) {
        emitUpdated({ poleTargetId: val })
      },
      updateChainLength(val: number, seriesKey?: string) {
        emitUpdated({ chainLength: val }, seriesKey)
      },
      updateIterations(val: number, seriesKey?: string) {
        emitUpdated({ iterations: val }, seriesKey)
      },
      updateInfluence(val: number, seriesKey?: string) {
        emitUpdated({ influence: val }, seriesKey)
      },
    }
  },
})
</script>
