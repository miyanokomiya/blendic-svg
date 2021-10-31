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
        @update:model-value="updateSpaceType"
      />
    </InlineField>
    <InlineField label="Min X" :label-width="labelWidth">
      <div class="inline">
        <CheckboxInput
          :model-value="modelValue.useMinX"
          @update:model-value="updateUseMinX"
        />
        <SliderInput
          :model-value="modelValue.minX"
          @update:model-value="updateMinX"
        />
      </div>
    </InlineField>
    <InlineField label="Min Y" :label-width="labelWidth">
      <div class="inline">
        <CheckboxInput
          :model-value="modelValue.useMinY"
          @update:model-value="updateUseMinY"
        />
        <SliderInput
          :model-value="modelValue.minY"
          @update:model-value="updateMinY"
        />
      </div>
    </InlineField>
    <InlineField label="Max X" :label-width="labelWidth">
      <div class="inline">
        <CheckboxInput
          :model-value="modelValue.useMaxX"
          @update:model-value="updateUseMaxX"
        />
        <SliderInput
          :model-value="modelValue.maxX"
          @update:model-value="updateMaxX"
        />
      </div>
    </InlineField>
    <InlineField label="Max Y" :label-width="labelWidth">
      <div class="inline">
        <CheckboxInput
          :model-value="modelValue.useMaxY"
          @update:model-value="updateUseMaxY"
        />
        <SliderInput
          :model-value="modelValue.maxY"
          @update:model-value="updateMaxY"
        />
      </div>
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
import SelectField from '/@/components/atoms/SelectField.vue'
import InlineField from '/@/components/atoms/InlineField.vue'
import CheckboxInput from '/@/components/atoms/CheckboxInput.vue'
import KeyDot from '/@/components/atoms/KeyDot.vue'
import { SpaceType } from '/@/models'
import {
  getProps,
  spaceTypeOptions,
} from '/@/components/molecules/constraints/common'

export default defineComponent({
  components: {
    SliderInput,
    SelectField,
    InlineField,
    CheckboxInput,
    KeyDot,
  },
  props: getProps<BoneConstraintOptions['LIMIT_LOCATION']>(),
  emits: ['update:model-value'],
  setup(props, { emit }) {
    function emitUpdated(
      val: Partial<BoneConstraintOptions['LIMIT_LOCATION']>,
      seriesKey?: string
    ) {
      emit('update:model-value', { ...props.modelValue, ...val }, seriesKey)
    }

    return {
      labelWidth: '90px',
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
      updateUseMinX(val: boolean, seriesKey?: string) {
        emitUpdated({ useMinX: val }, seriesKey)
      },
      updateUseMaxX(val: boolean, seriesKey?: string) {
        emitUpdated({ useMaxX: val }, seriesKey)
      },
      updateUseMinY(val: boolean, seriesKey?: string) {
        emitUpdated({ useMinY: val }, seriesKey)
      },
      updateUseMaxY(val: boolean, seriesKey?: string) {
        emitUpdated({ useMaxY: val }, seriesKey)
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
