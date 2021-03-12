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
      <SelectField v-model="targetId" :options="boneOptions" />
    </InlineField>
    <InlineField label="Target Space" :label-width="labelWidth">
      <SelectField
        v-model="targetSpaceType"
        :options="spaceTypeOptions"
        no-placeholder
      />
    </InlineField>
    <InlineField label="Owner Space" :label-width="labelWidth">
      <SelectField
        v-model="ownerSpaceType"
        :options="spaceTypeOptions"
        no-placeholder
      />
    </InlineField>
    <InlineField>
      <CheckboxInput v-model="invert" label="Invert" />
    </InlineField>
    <InlineField label="Influence" :label-width="labelWidth">
      <NumberInput v-model="influence" :min="0" :max="1" />
    </InlineField>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue'
import { BoneConstraintOptions } from '/@/utils/constraints'
import NumberInput from '/@/components/atoms/NumberInput.vue'
import SelectField from '/@/components/atoms/SelectField.vue'
import CheckboxInput from '/@/components/atoms/CheckboxInput.vue'
import InlineField from '/@/components/atoms/InlineField.vue'
import { SpaceType } from '/@/models'

export default defineComponent({
  components: { NumberInput, SelectField, CheckboxInput, InlineField },
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
    function emitUpdated(val: Partial<BoneConstraintOptions['COPY_ROTATION']>) {
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
      targetSpaceType: computed({
        get(): SpaceType {
          return props.modelValue.targetSpaceType
        },
        set(val: SpaceType) {
          emitUpdated({ targetSpaceType: val })
        },
      }),
      ownerSpaceType: computed({
        get(): SpaceType {
          return props.modelValue.ownerSpaceType
        },
        set(val: SpaceType) {
          emitUpdated({ ownerSpaceType: val })
        },
      }),
      targetId: computed({
        get(): string {
          return props.modelValue.targetId
        },
        set(val: string) {
          emitUpdated({ targetId: val })
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
      invert: computed({
        get(): boolean {
          return props.modelValue.invert
        },
        set(val: boolean) {
          emitUpdated({ invert: val })
        },
      }),
    }
  },
})
</script>
