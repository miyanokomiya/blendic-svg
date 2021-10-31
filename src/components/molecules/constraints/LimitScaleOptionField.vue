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
          :step="0.1"
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
          :step="0.1"
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
          :step="0.1"
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
          :step="0.1"
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
import { BoneConstraintOptions } from '/@/utils/constraints'
import { SpaceType } from '/@/models'
import { getProps } from '/@/components/molecules/constraints/common'

const propsDef = getProps<BoneConstraintOptions['LIMIT_SCALE']>()
</script>

<script setup lang="ts">
import SliderInput from '/@/components/atoms/SliderInput.vue'
import SelectField from '/@/components/atoms/SelectField.vue'
import InlineField from '/@/components/atoms/InlineField.vue'
import CheckboxInput from '/@/components/atoms/CheckboxInput.vue'
import KeyDot from '/@/components/atoms/KeyDot.vue'
import { spaceTypeOptions } from '/@/components/molecules/constraints/common'

defineProps(propsDef)

const emits = defineEmits<{
  (
    e: 'update:model-value',
    val: Partial<BoneConstraintOptions['LIMIT_SCALE']>,
    seriesKey?: string
  ): void
}>()

const labelWidth = '90px'

function emitUpdated(
  val: Partial<BoneConstraintOptions['LIMIT_SCALE']>,
  seriesKey?: string
) {
  emits('update:model-value', val, seriesKey)
}

function updateSpaceType(val: unknown) {
  emitUpdated({ spaceType: val as SpaceType })
}
function updateMinX(val: number, seriesKey?: string) {
  emitUpdated({ minX: val }, seriesKey)
}
function updateMaxX(val: number, seriesKey?: string) {
  emitUpdated({ maxX: val }, seriesKey)
}
function updateMinY(val: number, seriesKey?: string) {
  emitUpdated({ minY: val }, seriesKey)
}
function updateMaxY(val: number, seriesKey?: string) {
  emitUpdated({ maxY: val }, seriesKey)
}
function updateUseMinX(val: boolean, seriesKey?: string) {
  emitUpdated({ useMinX: val }, seriesKey)
}
function updateUseMaxX(val: boolean, seriesKey?: string) {
  emitUpdated({ useMaxX: val }, seriesKey)
}
function updateUseMinY(val: boolean, seriesKey?: string) {
  emitUpdated({ useMinY: val }, seriesKey)
}
function updateUseMaxY(val: boolean, seriesKey?: string) {
  emitUpdated({ useMaxY: val }, seriesKey)
}
function updateInfluence(val: number, seriesKey?: string) {
  emitUpdated({ influence: val }, seriesKey)
}
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
