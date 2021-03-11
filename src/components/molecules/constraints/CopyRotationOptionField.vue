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
  <div class="copy-rotation-option-field">
    <div class="field">
      <label>Target</label>
      <SelectField v-model="targetId" :options="boneOptions" />
    </div>
    <div class="field">
      <label>Target Space</label>
      <SelectField
        v-model="targetSpaceType"
        :options="spaceTypeOptions"
        no-placeholder
      />
    </div>
    <div class="field">
      <label>Owner Space</label>
      <SelectField
        v-model="ownerSpaceType"
        :options="spaceTypeOptions"
        no-placeholder
      />
    </div>
    <div class="field">
      <CheckboxInput v-model="invert" label="Invert" />
    </div>
    <div class="field">
      <label>Influence</label>
      <NumberInput v-model="influence" :min="0" :max="1" />
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue'
import { BoneConstraintOptions } from '/@/utils/constraints'
import NumberInput from '/@/components/atoms/NumberInput.vue'
import SelectField from '/@/components/atoms/SelectField.vue'
import CheckboxInput from '/@/components/atoms/CheckboxInput.vue'
import { SpaceType } from '/@/models'

export default defineComponent({
  components: { NumberInput, SelectField, CheckboxInput },
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

<style lang="scss" scoped>
.copy-rotation-option-field {
  text-align: left;
  padding: 8px 0;
  box-sizing: border-box;
  .field {
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    &:last-child {
      margin-bottom: 0;
    }
    > label {
      display: block;
      width: 110px;
      flex-shrink: 0;
      & + * {
        flex: 1;
        min-width: 0;
      }
    }
  }
}
</style>
