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
    <InlineField label="Target Space" :label-width="labelWidth">
      <SelectField
        :model-value="modelValue.targetSpaceType"
        :options="spaceTypeOptions"
        no-placeholder
        @update:model-value="updateTargetSpaceType"
      />
    </InlineField>
    <InlineField label="Owner Space" :label-width="labelWidth">
      <SelectField
        :model-value="modelValue.ownerSpaceType"
        :options="spaceTypeOptions"
        no-placeholder
        @update:model-value="updateOwnerSpaceType"
      />
    </InlineField>
    <InlineField label="Axis" :label-width="labelWidth">
      <ToggleButtons v-model="copyAxes" :options="axesOptions" />
    </InlineField>
    <InlineField label="Power" :label-width="labelWidth">
      <SliderInput
        :model-value="modelValue.power"
        :step="0.1"
        @update:model-value="updatePower"
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
import SelectField from '/@/components/atoms/SelectField.vue'
import InlineField from '/@/components/atoms/InlineField.vue'
import KeyDot from '/@/components/atoms/KeyDot.vue'
import SelectWithPicker from '/@/components/molecules/SelectWithPicker.vue'
import ToggleButtons from '/@/components/atoms/ToggleButtons.vue'
import { computed } from 'vue'
import { BoneConstraintOptions } from '/@/utils/constraints'
import { SpaceType } from '/@/models'
import { spaceTypeOptions } from '/@/components/molecules/constraints/common'
import { PickerOptions } from '/@/composables/modes/types'
import {
  KeyframeConstraintPropKey,
  KeyframePropsStatus,
} from '/@/models/keyframe'

const props = withDefaults(
  defineProps<{
    modelValue: BoneConstraintOptions['COPY_SCALE']
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
    val: Partial<BoneConstraintOptions['COPY_SCALE']>,
    seriesKey?: string
  ): void
  (e: 'start-pick-bone', val?: PickerOptions): void
}>()

function emitUpdated(
  val: Partial<BoneConstraintOptions['COPY_SCALE']>,
  seriesKey?: string
) {
  emit('update:model-value', { ...props.modelValue, ...val }, seriesKey)
}

const labelWidth = '100px'

function updateTargetId(val: string) {
  emitUpdated({ targetId: val })
}

function updateTargetSpaceType(val: SpaceType) {
  emitUpdated({ targetSpaceType: val })
}

function updateOwnerSpaceType(val: SpaceType) {
  emitUpdated({ ownerSpaceType: val })
}

function updateInfluence(val: number, seriesKey?: string) {
  emitUpdated({ influence: val }, seriesKey)
}

function updatePower(val: number, seriesKey?: string) {
  emitUpdated({ power: val }, seriesKey)
}

const axesOptions = [
  { value: 'x', label: 'X' },
  { value: 'y', label: 'Y' },
]

const copyAxes = computed({
  get() {
    return [
      props.modelValue.copyX ? 'x' : '',
      props.modelValue.copyY ? 'y' : '',
    ].filter((v) => v)
  },
  set(val: string[]) {
    emitUpdated({
      copyX: val.includes('x'),
      copyY: val.includes('y'),
    })
  },
})

function startPickBone(val?: PickerOptions) {
  emit('start-pick-bone', val)
}
</script>
