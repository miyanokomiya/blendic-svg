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
    <InlineField label="Min X" :label-width="labelWidth">
      <SliderInput
        :model-value="modelValue.minX"
        @update:modelValue="updateMinX"
      />
    </InlineField>
    <InlineField label="Max X" :label-width="labelWidth">
      <SliderInput
        :model-value="modelValue.maxX"
        @update:modelValue="updateMaxX"
      />
    </InlineField>
    <InlineField label="Min Y" :label-width="labelWidth">
      <SliderInput
        :model-value="modelValue.minY"
        @update:modelValue="updateMinY"
      />
    </InlineField>
    <InlineField label="Max Y" :label-width="labelWidth">
      <SliderInput
        :model-value="modelValue.maxY"
        @update:modelValue="updateMaxY"
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
import InlineField from '/@/components/atoms/InlineField.vue'
import { SpaceType } from '/@/models'

export default defineComponent({
  components: { SliderInput, SelectField, InlineField },
  props: {
    modelValue: {
      type: Object as PropType<BoneConstraintOptions['LIMIT_LOCATION']>,
      required: true,
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    function emitUpdated(
      val: Partial<BoneConstraintOptions['LIMIT_LOCATION']>,
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
      updateMinX(val: number, seriesKey?: string) {
        emitUpdated({ minX: val }, seriesKey)
      },
      updateMaxX(val: number, seriesKey?: string) {
        emitUpdated({ maxX: val }, seriesKey)
      },
      updateMinY(val: number, seriesKey?: string) {
        emitUpdated({ minY: val }, seriesKey)
      },
      updateMaxY(val: number, seriesKey?: string) {
        emitUpdated({ maxY: val }, seriesKey)
      },
      updateInfluence(val: number, seriesKey?: string) {
        emitUpdated({ influence: val }, seriesKey)
      },
    }
  },
})
</script>
