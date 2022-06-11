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
      <SelectWithPicker
        :model-value="modelValue.targetId"
        :options="boneOptions"
        name="targetId"
        @update:model-value="updateTargetId"
        @start-pick="startPickBone"
      />
    </InlineField>
    <InlineField label="Pole Target" :label-width="labelWidth">
      <SelectWithPicker
        :model-value="modelValue.poleTargetId"
        :options="boneOptions"
        name="poleTargetId"
        @update:model-value="updatePoleTargetId"
        @start-pick="startPickBone"
      />
    </InlineField>
    <InlineField label="Chain Length" :label-width="labelWidth">
      <SliderInput
        :model-value="modelValue.chainLength"
        integer
        :min="0"
        @update:model-value="updateChainLength"
      />
    </InlineField>
    <InlineField label="Iterations" :label-width="labelWidth">
      <SliderInput
        :model-value="modelValue.iterations"
        integer
        :min="0"
        :max="500"
        @update:model-value="updateIterations"
      />
    </InlineField>
    <InlineField label="Influence" :label-width="labelWidth">
      <SliderInput
        :model-value="modelValue.influence"
        :min="0"
        :max="1"
        @update:model-value="updateInfluence"
      />
      <KeyDot
        :status="keyframeStatusMap['influence']"
        :updated="propsUpdatedStatus.influence"
        @create="createKeyframe('influence')"
        @delete="deleteKeyframe('influence')"
      />
    </InlineField>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { BoneConstraintOptions } from '/@/utils/constraints'
import SliderInput from '/@/components/atoms/SliderInput.vue'
import InlineField from '/@/components/atoms/InlineField.vue'
import SelectWithPicker from '/@/components/molecules/SelectWithPicker.vue'
import KeyDot from '/@/components/atoms/KeyDot.vue'
import { getProps } from '/@/components/molecules/constraints/common'
import { PickerOptions } from '/@/composables/modes/types'

export default defineComponent({
  components: {
    SliderInput,
    InlineField,
    KeyDot,
    SelectWithPicker,
  },
  props: getProps<BoneConstraintOptions['IK']>(),
  emits: ['update:model-value', 'start-pick-bone'],
  setup(props, { emit }) {
    function emitUpdated(
      val: Partial<BoneConstraintOptions['IK']>,
      seriesKey?: string
    ) {
      emit('update:model-value', { ...props.modelValue, ...val }, seriesKey)
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
      startPickBone(val?: PickerOptions) {
        emit('start-pick-bone', val)
      },
    }
  },
})
</script>
