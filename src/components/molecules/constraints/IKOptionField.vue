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
    <InlineField>
      <CheckboxInput
        :model-value="modelValue.smoothJoint"
        label="Smooth Joint"
        @update:model-value="updateSmoothJoint"
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

<script lang="ts" setup>
import SliderInput from '/@/components/atoms/SliderInput.vue'
import InlineField from '/@/components/atoms/InlineField.vue'
import SelectWithPicker from '/@/components/molecules/SelectWithPicker.vue'
import KeyDot from '/@/components/atoms/KeyDot.vue'
import CheckboxInput from '/@/components/atoms/CheckboxInput.vue'
import { BoneConstraintOptions } from '/@/utils/constraints'
import { PickerOptions } from '/@/composables/modes/types'
import {
  KeyframeConstraintPropKey,
  KeyframePropsStatus,
} from '/@/models/keyframe'

const props = withDefaults(
  defineProps<{
    modelValue: BoneConstraintOptions['IK']
    propsUpdatedStatus?: Partial<{
      [key in KeyframeConstraintPropKey]: boolean
    }>
    boneOptions?: { value: string; label: string }[]
    keyframeStatusMap?: KeyframePropsStatus['props']
    createKeyframe?: (key: KeyframeConstraintPropKey) => void
    deleteKeyframe?: (key: KeyframeConstraintPropKey) => void
  }>(),
  {
    propsUpdatedStatus: () => ({}),
    boneOptions: () => [],
    keyframeStatusMap: () => ({}),
    createKeyframe: () => {},
    deleteKeyframe: () => {},
  }
)

const emit = defineEmits<{
  (
    e: 'update:model-value',
    val: Partial<BoneConstraintOptions['IK']>,
    seriesKey?: string
  ): void
  (e: 'start-pick-bone', val?: PickerOptions): void
}>()

function emitUpdated(
  val: Partial<BoneConstraintOptions['IK']>,
  seriesKey?: string
) {
  emit('update:model-value', { ...props.modelValue, ...val }, seriesKey)
}

const labelWidth = '100px'

function updateTargetId(val: string) {
  emitUpdated({ targetId: val })
}

function updatePoleTargetId(val: string) {
  emitUpdated({ poleTargetId: val })
}

function updateSmoothJoint(val: boolean) {
  emitUpdated({ smoothJoint: val })
}

function updateChainLength(val: number, seriesKey?: string) {
  emitUpdated({ chainLength: val }, seriesKey)
}

function updateIterations(val: number, seriesKey?: string) {
  emitUpdated({ iterations: val }, seriesKey)
}

function updateInfluence(val: number, seriesKey?: string) {
  emitUpdated({ influence: val }, seriesKey)
}

function startPickBone(val?: PickerOptions) {
  emit('start-pick-bone', val)
}
</script>
