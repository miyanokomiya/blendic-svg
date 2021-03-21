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
        :model-value="modelValue.spaceType"
        :options="spaceTypeOptions"
        no-placeholder
        @update:modelValue="updateSpaceType"
      />
    </InlineField>
    <InlineField label="Min" :label-width="labelWidth">
      <div class="inline">
        <CheckboxInput
          :model-value="modelValue.useMin"
          @update:modelValue="updateUseMin"
        />
        <SliderInput
          :model-value="modelValue.min"
          @update:modelValue="updateMin"
        />
      </div>
    </InlineField>
    <InlineField label="Max" :label-width="labelWidth">
      <div class="inline">
        <CheckboxInput
          :model-value="modelValue.useMax"
          @update:modelValue="updateUseMax"
        />
        <SliderInput
          :model-value="modelValue.max"
          @update:modelValue="updateMax"
        />
      </div>
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
import InlineField from '/@/components/atoms/InlineField.vue'
import CheckboxInput from '/@/components/atoms/CheckboxInput.vue'
import { SpaceType } from '/@/models'

export default defineComponent({
  components: { SliderInput, SelectField, InlineField, CheckboxInput },
  props: {
    modelValue: {
      type: Object as PropType<BoneConstraintOptions['LIMIT_ROTATION']>,
      required: true,
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    function emitUpdated(
      val: Partial<BoneConstraintOptions['LIMIT_ROTATION']>,
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
      updateSpaceType(val: SpaceType) {
        emitUpdated({ spaceType: val })
      },
      updateMin(val: number, seriesKey?: string) {
        emitUpdated({ min: val }, seriesKey)
      },
      updateMax(val: number, seriesKey?: string) {
        emitUpdated({ max: val }, seriesKey)
      },
      updateUseMin(val: boolean, seriesKey?: string) {
        emitUpdated({ useMin: val }, seriesKey)
      },
      updateUseMax(val: boolean, seriesKey?: string) {
        emitUpdated({ useMax: val }, seriesKey)
      },
      updateInfluence(val: number, seriesKey?: string) {
        emitUpdated({ influence: val }, seriesKey)
      },
    }
  },
})
</script>

<style lang="scss" scoped>
.inline {
  display: flex;
  align-items: center;
  > * + * {
    margin-left: 10px;
  }
}
</style>
