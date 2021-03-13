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
    <InlineField label="Space Type" :label-width="labelWidth">
      <SelectField
        v-model="spaceType"
        :options="spaceTypeOptions"
        no-placeholder
      />
    </InlineField>
    <InlineField label="Min" :label-width="labelWidth">
      <NumberInput v-model="min" />
    </InlineField>
    <InlineField label="Max" :label-width="labelWidth">
      <NumberInput v-model="max" />
    </InlineField>
    <InlineField label="Influence" :label-width="labelWidth">
      <SliderInput v-model="influence" />
    </InlineField>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue'
import { BoneConstraintOptions } from '/@/utils/constraints'
import NumberInput from '/@/components/atoms/NumberInput.vue'
import SliderInput from '/@/components/atoms/SliderInput.vue'
import SelectField from '/@/components/atoms/SelectField.vue'
import InlineField from '/@/components/atoms/InlineField.vue'
import { SpaceType } from '/@/models'

export default defineComponent({
  components: { NumberInput, SliderInput, SelectField, InlineField },
  props: {
    modelValue: {
      type: Object as PropType<BoneConstraintOptions['LIMIT_ROTATION']>,
      required: true,
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    function emitUpdated(
      val: Partial<BoneConstraintOptions['LIMIT_ROTATION']>
    ) {
      emit('update:modelValue', { ...props.modelValue, ...val })
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
      spaceType: computed({
        get(): SpaceType {
          return props.modelValue.spaceType
        },
        set(val: SpaceType) {
          emitUpdated({ spaceType: val })
        },
      }),
      min: computed({
        get(): number {
          return props.modelValue.min
        },
        set(val: number) {
          emitUpdated({ min: val })
        },
      }),
      max: computed({
        get(): number {
          return props.modelValue.max
        },
        set(val: number) {
          emitUpdated({ max: val })
        },
      }),
      influence: computed({
        get(): number {
          return props.modelValue.influence
        },
        set(val: number) {
          emitUpdated({ influence: val })
        },
      }),
    }
  },
})
</script>
