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
    <InlineField label="Target Space" :label-width="labelWidth">
      <SelectField
        :model-value="modelValue.targetSpaceType"
        :options="spaceTypeOptions"
        no-placeholder
        @update:modelValue="updateTargetSpaceType"
      />
    </InlineField>
    <InlineField label="Owner Space" :label-width="labelWidth">
      <SelectField
        :model-value="modelValue.ownerSpaceType"
        :options="spaceTypeOptions"
        no-placeholder
        @update:modelValue="updateOwnerSpaceType"
      />
    </InlineField>
    <InlineField>
      <CheckboxInput
        :model-value="modelValue.invert"
        label="Invert"
        @update:modelValue="updateInvert"
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
import { computed, defineComponent, PropType } from 'vue'
import { BoneConstraintOptions } from '/@/utils/constraints'
import SliderInput from '/@/components/atoms/SliderInput.vue'
import SelectField from '/@/components/atoms/SelectField.vue'
import CheckboxInput from '/@/components/atoms/CheckboxInput.vue'
import InlineField from '/@/components/atoms/InlineField.vue'
import { SpaceType } from '/@/models'

export default defineComponent({
  components: {
    SliderInput,
    SelectField,
    CheckboxInput,
    InlineField,
  },
  props: {
    modelValue: {
      type: Object as PropType<BoneConstraintOptions['COPY_ROTATION']>,
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
      val: Partial<BoneConstraintOptions['COPY_ROTATION']>,
      seriesKey?: string
    ) {
      emit('update:modelValue', { ...props.modelValue, ...val }, seriesKey)
    }

    const spaceTypeOptions = computed<{ value: SpaceType; label: string }[]>(
      () => {
        return [
          { value: 'world', label: 'World' },
          { value: 'local', label: 'Local' },
        ]
      }
    )

    return {
      labelWidth: '100px',
      spaceTypeOptions,
      updateTargetId(val: string) {
        emitUpdated({ targetId: val })
      },
      updateTargetSpaceType(val: SpaceType) {
        emitUpdated({ targetSpaceType: val })
      },
      updateOwnerSpaceType(val: SpaceType) {
        emitUpdated({ ownerSpaceType: val })
      },
      updateInfluence(val: number, seriesKey?: string) {
        emitUpdated({ influence: val }, seriesKey)
      },
      updateInvert(val: boolean) {
        emitUpdated({ invert: val })
      },
    }
  },
})
</script>
